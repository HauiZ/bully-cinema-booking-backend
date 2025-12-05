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

    sendMessage(channel, data) {
        // Generate unique ID for this message
        const messageId = this.generateMessageId(channel, data);

        // Check if this message was already sent to prevent duplicates
        // if (this.messageHistory.has(messageId)) {
        //     console.log(`[Socket Client ${this.name}] Message already sent, skipping duplicate: ${messageId.substring(0, 50)}...`);
        //     return true;
        // }

        // Add to message history
        // this.messageHistory.add(messageId);

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
            console.warn(`[Socket Client ${this.name}] Cannot send message: Not connected. Channel: ${channel}`, { nodeId: data.nodeId, type: data.type });
            // Try to connect and send again after a delay
            if (!this.isConnected) {
                this.init();
                // Note: Since sending is async, the message may not be sent immediately in this call
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
        }
    }
}

const CENTRAL_SERVER_URL = `ws://${process.env.IP_NETWORK || 'localhost'}:${process.env.SOCKET_PORT || 4000}`;
module.exports = new SocketClient(CENTRAL_SERVER_URL);