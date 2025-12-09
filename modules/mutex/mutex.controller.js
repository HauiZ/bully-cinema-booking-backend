const state = require('../../state');
const { processNextInQueue } = require('./mutex.service');
const { BadRequestError } = require('../../errors/api.error');
const dotenv = require('dotenv');
dotenv.config();
const myId = process.env.MY_ID;

function acquireLock(req, res) {
    try {
        if (myId != state.currentLeaderId) {

            res.status(400).send('Not Leader');
            return;
        }

        const { requesterId } = req.body;
        if (!state.isResourceLocked) {
            state.isResourceLocked = true;
            console.log(`🔓 LEADER: Cấp khóa cho Node ${requesterId}`);
            res.send('GRANTED');
        } else {
            console.log(`zzz LEADER: Node ${requesterId} đang xếp hàng.`);
            state.requestQueue.push({ res, requesterId });
        }
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
}

function releaseLock(req, res) {
    try {
        if (myId != state.currentLeaderId) {
            res.status(200).send();
            return;
        }
        console.log('🔒 LEADER: Nhận lệnh trả khóa.');
        processNextInQueue();
        res.status(200).send();
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = {
    acquireLock,
    releaseLock,
};
