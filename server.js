/**
 * HỆ THỐNG PHÂN TÁN - SEQUELIZE ORM VERSION
 * - Bully Algorithm: Bầu chọn Leader
 * - Mutual Exclusion: Quản lý khóa tập trung
 * - Sequelize: Thao tác Database
 */

require('dotenv').config(); // Load biến môi trường từ file .env
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');

// --- 1. CẤU HÌNH CƠ BẢN ---

// Lấy tham số từ dòng lệnh HOẶC file .env (Ưu tiên dòng lệnh)
// Cách chạy: node server.js <ID> <PORT>
const myId = parseInt(process.argv[2]) || parseInt(process.env.MY_ID);
const myPort = parseInt(process.argv[3]) || parseInt(process.env.PORT);

if (!myId || !myPort) {
  console.log(myId, myPort);
    console.error("❌ Thiếu ID hoặc PORT. Kiểm tra lại file .env hoặc lệnh chạy.");
    process.exit(1);
}

// Cấu hình danh sách Node (HARDCODE IP ZEROTIER ĐỂ ĐẢM BẢO KẾT NỐI)
const nodes = [
    { id: 1, url: 'http://10.15.240.214:3000' },   // Máy Hùng
    { id: 2, url: 'http://10.15.240.99:3000' },   // Máy Hậu
    { id: 3, url: 'http://10.15.240.171:3000' },  // Máy Khánh
    { id: 4, url: 'http://10.15.240.248:3000' },   // Máy Trương
    { id: 5, url: 'http://10.15.240.47:3000' },   // Máy Giang
    { id: 6, url: 'http://10.15.240.149:3000' },  // Máy Tuấn
];

// --- 2. CẤU HÌNH SEQUELIZE (DATABASE) ---
const sequelize = new Sequelize(
    process.env.DB_NAME || 'cinema_db',
    process.env.DB_USER_NAME || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST_NAME || 'localhost',
        dialect: 'mysql',
        logging: false, // Tắt log SQL cho gọn terminal
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Định nghĩa Model: SEATS
const Seat = sequelize.define('Seat', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    seat_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: { 
        type: DataTypes.ENUM('AVAILABLE', 'BOOKED'), 
        defaultValue: 'AVAILABLE' 
    },
    customer_name: { type: DataTypes.STRING, allowNull: true },
    booked_by_node: { type: DataTypes.STRING, allowNull: true } // Lưu Node nào bán vé
}, {
    tableName: 'seats',
    timestamps: true, // Tự động tạo createdAt, updatedAt
    createdAt: false, // Tắt createdAt nếu không cần
    updatedAt: 'updated_at' // Map với cột trong DB của bạn
});

// Định nghĩa Model: TRANSACTION_LOGS
const TransactionLog = sequelize.define('TransactionLog', {
    node_id: DataTypes.STRING,
    action_type: DataTypes.STRING,
    description: DataTypes.TEXT
}, {
    tableName: 'transaction_logs',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
});

// --- 3. TRẠNG THÁI SERVER ---
const app = express();
app.use(bodyParser.json());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

let currentLeaderId = null;
let isElectionRunning = false;
let isResourceLocked = false;
let requestQueue = []; // Hàng đợi Mutex

// ============================================================
// PHẦN A: API MUA VÉ (DÙNG SEQUELIZE)
// ============================================================

app.post('/buy-ticket', async (req, res) => {
    const { seat, customerName } = req.body;
    const myNodeName = `Node ${myId}`;
    console.log(`🎫 [REQ] Khách ${customerName} muốn mua ghế ${seat}`);

    try {
        // 1. MUTEX: Xin quyền truy cập (Retry nếu Leader chết)
        await acquireLockWithRetry(myId);

        console.log("✅ ĐƯỢC CẤP QUYỀN! Đang thao tác Database...");

        // 2. CRITICAL SECTION: Thao tác DB bằng Sequelize
        // Tìm ghế đang AVAILABLE
        const targetSeat = await Seat.findOne({ 
            where: { 
                seat_number: seat, 
                status: 'AVAILABLE' 
            } 
        });

        if (!targetSeat) {
            console.log("❌ Ghế không tồn tại hoặc đã bị đặt.");
            await releaseLock();
            return res.json({ status: "FAIL", msg: "Ghế đã hết hoặc không tồn tại!" });
        }

        // Cập nhật ghế (Book)
        targetSeat.status = 'BOOKED';
        targetSeat.customer_name = customerName;
        targetSeat.booked_by_node = myNodeName;
        await targetSeat.save(); // Lưu xuống DB

        // Ghi Log
        await TransactionLog.create({
            node_id: myNodeName,
            action_type: 'BUY',
            description: `Khách ${customerName} mua ghế ${seat}`
        });

        console.log("💾 Đã lưu DB thành công!");

        // 3. MUTEX: Trả quyền
        await releaseLock();

        return res.json({ status: "SUCCESS", msg: "Đặt vé thành công!", ticket: targetSeat });

    } catch (err) {
        console.error("❌ Lỗi xử lý:", err.message);
        // Cố gắng trả lock nếu có lỗi xảy ra để tránh Deadlock
        if(currentLeaderId === myId && isResourceLocked) releaseLocalLock();
        res.status(500).json({ error: "Lỗi hệ thống" });
    }
});

// --- CÁC HÀM HỖ TRỢ MUTEX (Client Side) ---

async function acquireLockWithRetry(requesterId) {
    while (true) {
        if (currentLeaderId === null) {
            console.log("⏳ Chưa có Leader, đợi 1s...");
            await sleep(1000);
            continue;
        }

        try {
            if (currentLeaderId === myId) {
                await acquireLocalLock();
            } else {
                const leader = nodes.find(n => n.id === currentLeaderId);
                // Gọi sang Leader xin lock
                await axios.post(`${leader.url}/mutex/acquire`, { requesterId }, { timeout: 5000 });
            }
            return; // Thành công
        } catch (error) {
            console.log(`⚠️ Không xin được khóa (Leader ${currentLeaderId} có thể đã chết). Đang đợi bầu lại...`);
            if (currentLeaderId !== myId) startElection();
            await sleep(2000);
        }
    }
}

async function releaseLock() {
    console.log("... Đang trả khóa ...");
    if (currentLeaderId === myId) {
        releaseLocalLock();
    } else {
        try {
            const leader = nodes.find(n => n.id === currentLeaderId);
            await axios.post(`${leader.url}/mutex/release`, { requesterId: myId });
        } catch (e) { /* Kệ lỗi mạng lúc trả khóa */ }
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================
// PHẦN B: LOGIC LEADER (MUTEX SERVER SIDE)
// ============================================================

app.post('/mutex/acquire', (req, res) => {
    if (myId !== currentLeaderId) return res.status(400).send("Not Leader");
    
    const { requesterId } = req.body;
    if (!isResourceLocked) {
        isResourceLocked = true;
        console.log(`🔓 LEADER: Cấp khóa cho Node ${requesterId}`);
        res.send("GRANTED");
    } else {
        console.log(`zzz LEADER: Node ${requesterId} đang xếp hàng.`);
        requestQueue.push({ res, requesterId }); // Treo request
    }
});

app.post('/mutex/release', (req, res) => {
    if (myId !== currentLeaderId) return res.sendStatus(200);
    console.log(`🔒 LEADER: Nhận lệnh trả khóa.`);
    processNextInQueue();
    res.sendStatus(200);
});

function acquireLocalLock() {
    return new Promise(resolve => {
        if (!isResourceLocked) {
            isResourceLocked = true;
            resolve();
        } else {
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
        next.res.send("GRANTED"); // Trả lời cho request đang treo
    } else {
        isResourceLocked = false;
        console.log("🏁 Tài nguyên rảnh rỗi.");
    }
}

// ============================================================
// PHẦN C: BULLY ALGORITHM (BẦU CỬ)
// ============================================================

app.get('/ping', (req, res) => res.sendStatus(200));

app.post('/election', (req, res) => {
    const { senderId } = req.body;
    if (myId > senderId) {
        res.sendStatus(200);
        startElection(); // Tôi to hơn, tôi tranh cử
    } else {
        res.sendStatus(200);
    }
});

app.post('/victory', (req, res) => {
    currentLeaderId = req.body.leaderId;
    isElectionRunning = false;
    isResourceLocked = false;
    requestQueue = [];
    console.log(`👑 LEADER MỚI: NODE ${currentLeaderId}`);
    res.sendStatus(200);
});

async function startElection() {
    if (isElectionRunning) return;
    isElectionRunning = true;
    console.log("📢 Bắt đầu bầu cử...");

    const higherNodes = nodes.filter(n => n.id > myId);
    if (higherNodes.length === 0) {
        declareVictory();
        return;
    }

    let anyoneAlive = false;
    await Promise.all(higherNodes.map(async (node) => {
        try {
            await axios.post(`${node.url}/election`, { senderId: myId }, { timeout: 1000 });
            anyoneAlive = true;
        } catch (e) {}
    }));

    if (!anyoneAlive) {
        declareVictory();
    } else {
        setTimeout(() => {
            if (currentLeaderId === null || currentLeaderId < myId) {
                isElectionRunning = false;
                startElection();
            }
        }, 5000);
    }
}

function declareVictory() {
    console.log("🎉 TÔI LÀ LEADER!");
    currentLeaderId = myId;
    isElectionRunning = false;
    isResourceLocked = false;
    requestQueue = [];
    nodes.forEach(n => {
        if (n.id !== myId) axios.post(`${n.url}/victory`, { leaderId: myId }).catch(()=>{});
    });
}

// Heartbeat
setInterval(async () => {
    if (currentLeaderId === myId || isElectionRunning || !currentLeaderId) return;
    const leader = nodes.find(n => n.id === currentLeaderId);
    try {
        await axios.get(`${leader.url}/ping`, { timeout: 2000 });
    } catch (e) {
        console.log("☠️ Leader chết. Bầu lại!");
        currentLeaderId = null;
        startElection();
    }
}, 3000);

// --- KHỞI CHẠY ---
app.listen(myPort, '0.0.0.0', async () => {
    console.log(`🚀 Node ${myId} running at Port ${myPort}`);
    
    // Test kết nối DB
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối Database thành công!');
        // Đồng bộ Model với DB (không xóa dữ liệu cũ)
        await sequelize.sync({ alter: false }); 
    } catch (error) {
        console.error('❌ Không thể kết nối DB:', error.message);
    }

    setTimeout(startElection, 3000);
});