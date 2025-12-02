const express = require('express');
const { getNodes, killNode, reviveNode } = require('./node.controller');

const router = express.Router();

router.get('/', getNodes);
router.post('/:id/kill', killNode);
router.post('/:id/revive', reviveNode);

module.exports = router;
