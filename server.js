/**
 * HỆ THỐNG BÁN VÉ PHÂN TÁN (BULLY + MUTEX)
 * IP Configuration (ZeroTier):
 * - Hậu:    10.15.240.99
 * - Tuấn:   10.15.240.149
 * - Trường: 10.15.240.248
 */

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// --- 1. CẤU HÌNH NODE & MẠNG ---
// Lấy ID và PORT từ dòng lệnh
const myId = parseInt(process.argv[2], 10);
const myPort = parseInt(process.argv[3], 10);

if (!myId || !myPort) {
  console.error('❌ Chạy sai! Dùng lệnh: node server.js <ID> <PORT>');
  process.exit(1);
}

// BẢN ĐỒ MẠNG LƯỚI (QUAN TRỌNG NHẤT)
// Đây là địa chỉ để các Node gọi lẫn nhau
// CHÚ Ý: sửa lại IP/PORT đúng thực tế nếu bạn thay đổi
const nodes = [
  { id: 1, url: 'http://10.15.240.99:3001' },   // Máy Hậu
  { id: 2, url: 'http://10.15.240.99:3002' },   // Máy Hậu
  { id: 3, url: 'http://10.15.240.149:3003' },  // Máy Tuấn
  { id: 4, url: 'http://10.15.240.149:3004' },  // Máy Tuấn
  { id: 5, url: 'http://10.15.240.248:3005' }   // Máy Trương
];

// Cấu hình Database (Luôn trỏ về máy Hậu hoặc máy chứa DB)
const dbConfig = {
  host: process.env.DB_HOST || '10.15.240.99',
  user: process.env.DB_USER || 'team_member',
  password: process.env.DB_PASSWORD || 'password_chung_123',
  database: process.env.DB_NAME || 'cinema_db'
};

// --- 2. TRẠNG THÁI ---
let currentLeaderId = null;
let isElectionRunning = false;
let isResourceLocked = false;
let requestQueue = [];

// ============================================================
// PHẦN A: API MUA VÉ (LOGIC MUTEX + RETRY)
// ============================================================

app.post('/buy-ticket', async (req, res) => {
  const { seat, customerName } = req.body;
  const myNodeName = `Node ${myId}`;

  if (!seat || !customerName) {
    return res.status(400).json({ status: 'FAIL', msg: 'Thiếu seat hoặc customerName' });
  }

  console.log(`🎫 [REQ] ${myNodeName} – Khách ${customerName} đặt vé ${seat}`);

  try {
    // 1. Xin quyền truy cập (Có cơ chế Retry nếu Leader chết)
    await acquireLockWithRetry(myId);

    console.log('✅ ĐƯỢC CẤP QUYỀN! Đang ghi Database...');

    // 2. Critical Section: Thao tác Database
    const connection = await mysql.createConnection(dbConfig);
    try {
      // Kiểm tra ghế trống
      const [rows] = await connection.execute(
        'SELECT * FROM seats WHERE seat_number = ? AND status = "AVAILABLE"',
        [seat]
      );

      if (rows.length === 0) {
        console.log('❌ Ghế đã có người đặt trước.');

        // Ghi log FAIL
        await connection.execute(
          'INSERT INTO transaction_logs (node_id, action_type, description) VALUES (?, ?, ?)',
          [
            myNodeName,
            'BUY_FAIL',
            `${myNodeName} cố đặt ghế ${seat} nhưng ghế đã được BOOKED trước đó`
          ]
        );

        await releaseLock(); // Trả quyền ngay
        await connection.end();
        return res.json({ status: 'FAIL', msg: 'Ghế đã hết!' });
      }

      // Book ghế
      await connection.execute(
        'UPDATE seats SET status = "BOOKED", customer_name = ?, booked_by_node = ? WHERE seat_number = ?',
        [customerName, myNodeName, seat]
      );
      console.log('💾 Ghi DB thành công!');

      // Ghi log SUCCESS
      await connection.execute(
        'INSERT INTO transaction_logs (node_id, action_type, description) VALUES (?, ?, ?)',
        [
          myNodeName,
          'BUY_SUCCESS',
          `${myNodeName} đặt thành công ghế ${seat} cho khách ${customerName}`
        ]
      );
    } finally {
      await connection.end();
    }

    // 3. Trả quyền
    await releaseLock();

    return res.json({
      status: 'SUCCESS',
      msg: 'Mua vé thành công!',
      processedBy: myNodeName,
      leader: currentLeaderId
    });
  } catch (err) {
    console.error('❌ Lỗi giao dịch:', err.message);
    try {
      await releaseLock();
    } catch (_) {}
    res.status(500).json({ status: 'ERROR', msg: 'Lỗi hệ thống hoặc mất kết nối DB' });
  }
});

// Hàm xin khóa thông minh (Chịu lỗi)
async function acquireLockWithRetry(requesterId) {
  while (true) {
    if (currentLeaderId === null) {
      console.log('⏳ Chưa có leader hoặc đang bầu cử, đợi 1s...');
      await new Promise((r) => setTimeout(r, 1000));
      continue; // Thử lại
    }

    try {
      if (currentLeaderId === myId) {
        await acquireLocalLock();
      } else {
        const leader = nodes.find((n) => n.id === currentLeaderId);
        if (!leader) throw new Error('Không tìm thấy leader trong danh sách nodes');

        // Timeout 5s, nếu Leader không trả lời coi như chết
        await axios.post(
          `${leader.url}/mutex/acquire`,
          { requesterId },
          { timeout: 5000 }
        );
      }
      return; // Thành công
    } catch (error) {
      console.log(
        `⚠️ Lỗi xin khóa từ Node ${currentLeaderId} (${error.message}). Leader có thể đã chết. Bắt đầu bầu cử...`
      );
      // Nếu Leader chết, kích hoạt bầu cử
      if (currentLeaderId !== myId) startElection();
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function releaseLock() {
  console.log('... Đang trả khóa ...');
  if (currentLeaderId === myId) {
    releaseLocalLock();
  } else if (currentLeaderId != null) {
    try {
      const leader = nodes.find((n) => n.id === currentLeaderId);
      if (!leader) return;
      await axios.post(`${leader.url}/mutex/release`, { requesterId: myId }).catch(() => {});
    } catch (e) {
      console.log('⚠️ Lỗi khi trả khóa (bỏ qua vì chỉ là giải phóng).');
    }
  }
}

// ============================================================
// PHẦN B: LOGIC QUẢN LÝ KHÓA (CHỈ CHẠY KHI LÀ LEADER)
// ============================================================

// Endpoint cho các node khác xin khóa
app.post('/mutex/acquire', (req, res) => {
  if (myId !== currentLeaderId) return res.status(400).send('Not Leader');

  const { requesterId } = req.body;
  if (!isResourceLocked) {
    isResourceLocked = true;
    console.log(`🔓 LEADER: Cấp khóa cho Node ${requesterId}`);
    return res.send('GRANTED');
  }

  console.log(`😴 LEADER: Node ${requesterId} xếp hàng đợi.`);
  // Lưu res để trả lời sau
  requestQueue.push({ res, requesterId });
});

// Endpoint cho các node khác trả khóa
app.post('/mutex/release', (req, res) => {
  if (myId !== currentLeaderId) return res.sendStatus(200);

  console.log('🔒 LEADER: Nhận lệnh trả khóa.');
  processNextInQueue();
  res.sendStatus(200);
});

// Lock local khi chính node leader muốn vào vùng găng
function acquireLocalLock() {
  return new Promise((resolve) => {
    if (!isResourceLocked) {
      isResourceLocked = true;
      resolve();
    } else {
      console.log('😴 LEADER (LOCAL): tự xếp hàng đợi.');
      // Giả mạo một res có .send là resolve()
      requestQueue.push({ res: { send: resolve }, requesterId: myId });
    }
  });
}

function releaseLocalLock() {
  processNextInQueue();
}

function processNextInQueue() {
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    console.log(`➡️ Chuyển khóa cho Node ${next.requesterId}`);
    next.res.send('GRANTED');
  } else {
    isResourceLocked = false;
    console.log('🏁 Tài nguyên rảnh.');
  }
}

// ============================================================
// PHẦN C: THUẬT TOÁN BULLY (BẦU CỬ)
// ============================================================

app.get('/ping', (req, res) => res.sendStatus(200));

// Nhận yêu cầu ELECTION từ node khác
app.post('/election', (req, res) => {
  const { senderId } = req.body;
  if (!senderId) return res.sendStatus(400);

  if (myId > senderId) {
    console.log(`📨 Nhận ELECTION từ Node ${senderId}, tôi lớn hơn nên trả OK và tự bầu cử.`);
    res.sendStatus(200);
    startElection();
  } else {
    console.log(`📨 Nhận ELECTION từ Node ${senderId}, tôi nhỏ hơn nên chỉ trả OK.`);
    res.sendStatus(200);
  }
});

// Nhận thông báo VICTORY từ leader mới
app.post('/victory', (req, res) => {
  currentLeaderId = req.body.leaderId;
  isElectionRunning = false;
  isResourceLocked = false;
  requestQueue = [];
  console.log(`👑 CHẤP NHẬN LEADER MỚI: NODE ${currentLeaderId}`);
  res.sendStatus(200);
});

// Bắt đầu bầu cử theo Bully
async function startElection() {
  if (isElectionRunning) return;
  isElectionRunning = true;
  currentLeaderId = null;

  console.log('📢 Bắt đầu bầu cử (Bully)...');

  const higherNodes = nodes.filter((n) => n.id > myId);
  if (higherNodes.length === 0) {
    declareVictory();
    return;
  }

  let anyoneAlive = false;

  await Promise.all(
    higherNodes.map(async (node) => {
      try {
        await axios.post(
          `${node.url}/election`,
          { senderId: myId },
          { timeout: 1000 }
        );
        anyoneAlive = true;
      } catch (e) {
        // Node không trả lời -> coi như chết
      }
    })
  );

  if (!anyoneAlive) {
    declareVictory();
  } else {
    // Chờ kết quả, nếu lâu quá không thấy ai thắng thì bầu lại
    setTimeout(() => {
      if (currentLeaderId === null) {
        console.log('⌛ Không thấy ai tuyên bố thắng, bầu lại...');
        isElectionRunning = false;
        startElection();
      }
    }, 5000);
  }
}

// Tự tuyên bố mình là leader
function declareVictory() {
  console.log('🎉 TÔI LÀ LEADER!');
  currentLeaderId = myId;
  isElectionRunning = false;
  isResourceLocked = false;
  requestQueue = [];

  nodes.forEach((n) => {
    if (n.id !== myId) {
      axios
        .post(`${n.url}/victory`, { leaderId: myId })
        .catch(() => {});
    }
  });
}

// Heartbeat kiểm tra Leader
setInterval(async () => {
  if (currentLeaderId === myId || isElectionRunning || !currentLeaderId) return;
  const leader = nodes.find((n) => n.id === currentLeaderId);
  if (!leader) return;

  try {
    await axios.get(`${leader.url}/ping`, { timeout: 2000 });
  } catch (e) {
    console.log('☠️ Leader chết. Bầu cử lại!');
    currentLeaderId = null;
    startElection();
  }
}, 3000);

// --- HEALTH CHECK / DEBUG ---
app.get('/status', (req, res) => {
  res.json({
    nodeId: myId,
    port: myPort,
    leaderId: currentLeaderId,
    isElectionRunning,
    isResourceLocked,
    queueLength: requestQueue.length
  });
});

// --- KHỞI CHẠY ---
// Lắng nghe 0.0.0.0 để nhận kết nối từ IP ZeroTier
app.listen(myPort, '0.0.0.0', () => {
  console.log(`🚀 Node ${myId} đang chạy tại Port ${myPort}`);
  // Đợi 3s cho các máy khác kịp bật rồi mới bắt đầu bầu cử
  setTimeout(startElection, 3000);
});
