const ioClient = require('socket.io-client');
const dotenv = require('dotenv');
dotenv.config();

class SocketClient {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.name = process.env.MY_ID;
        this.isConnected = false;
        this.initialized = false;
        this.messageHistory = new Set(); // To prevent duplicate messages
        this.messageQueue = []; // Queue for messages that couldn't be sent
    }

    init() {
        // Prevent multiple initializations
        if (this.initialized && this.socket) {
            return;
        }

        // Clean up existing socket if needed
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = ioClient(this.url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 5000
        });

        this.socket.on('connect', () => {
            console.log(`[Socket Client ${this.name}] Successfully connected to ${this.url}`);
            this.isConnected = true;
            // Send all queued messages when connected
            this.flushMessageQueue();
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[Socket Client ${this.name}] Disconnected. Reason: ${reason}`);
            this.isConnected = false;
        });

        this.socket.on('error', (err) => {
            console.error(`[Socket Client ${this.name}] Connection Error:`, err);
            this.isConnected = false;
        });

        this.initialized = true;
    }

    // Generate a unique message ID to prevent duplicates
    generateMessageId(channel, data) {
        // Create a string that represents the unique message
        const stringifiedData = JSON.stringify(data);
        return `${channel}:${data.nodeId || 'unknown'}:${data.type || 'unknown'}:${stringifiedData}`;
    }

    // Flush all queued messages when connection is established
    flushMessageQueue() {
        if (this.messageQueue.length === 0) return;

        console.log(`[Socket Client ${this.name}] Flushing ${this.messageQueue.length} queued messages...`);
        
        while (this.messageQueue.length > 0) {
            const { channel, data } = this.messageQueue.shift();
            if (this.isConnected && this.socket && this.socket.connected) {
                this.socket.emit(channel, data);
                console.log(`[Socket Client ${this.name}] Sent queued message: ${channel}`, { nodeId: data.nodeId, type: data.type });
            } else {
                // If connection lost while flushing, put message back at front
                this.messageQueue.unshift({ channel, data });
                break;
            }
        }
    }

    sendMessage(channel, data) {
        // Generate unique ID for this message
        const messageId = this.generateMessageId(channel, data);

        // Check if this message was already sent to prevent duplicates
        // if (this.messageHistory.has(messageId)) {
        //     console.log(`[Socket Client ${this.name}] Message already sent, skipping duplicate: ${messageId.substring(0, 50)}...`);
        //     return true;
        // }

        // Add to message history
        this.messageHistory.add(messageId);

        // Initialize connection if not already done
        if (!this.initialized) {
            this.init();
        }

        // If connected, send immediately
        if (this.isConnected && this.socket && this.socket.connected) {
            this.socket.emit(channel, data);
            console.log(`[Socket Client ${this.name}] Sent message: ${channel}`, { nodeId: data.nodeId, type: data.type });
            return true;
        } else {
            // Queue the message to be sent when connection is established
            this.messageQueue.push({ channel, data });
            console.log(`[Socket Client ${this.name}] Message queued (not connected): ${channel}`, { nodeId: data.nodeId, type: data.type, queueSize: this.messageQueue.length });
            
            // Try to connect if not already connecting
            if (!this.isConnected) {
                this.init();
            }
            return false;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.initialized = false;
            // Clear message queue on disconnect
            this.messageQueue = [];
        }
    }
}

const CENTRAL_SERVER_URL = `ws://${'10.15.240.149'}:${process.env.SOCKET_PORT || 4000}`;
module.exports = new SocketClient(CENTRAL_SERVER_URL);