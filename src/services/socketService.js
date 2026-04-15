/**
 * Socket.io Service
 * Manages real-time communication with the dashboard.
 */
class SocketService {
    constructor() {
        this.io = null;
    }

    /**
     * Initialize Socket.io with the HTTP server
     * @param {Object} io 
     */
    init(io) {
        this.io = io;
        this.io.on('connection', (socket) => {
            console.log(`New WebSocket Connection: ${socket.id}`);
            
            socket.on('disconnect', () => {
                console.log(`WebSocket Disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Broadcast a new metric to all connected clients
     * @param {Object} metric 
     */
    broadcastMetric(metric) {
        if (this.io) {
            this.io.emit('new-metric', metric);
        }
    }

    /**
     * Broadcast a new alert to all connected clients
     * @param {Object} alert 
     */
    broadcastAlert(alert) {
        if (this.io) {
            this.io.emit('new-alert', alert);
        }
    }

    /**
     * Broadcast a new log entry
     * @param {Object} log 
     */
    broadcastLog(log) {
        if (this.io) {
            this.io.emit('new-log', log);
        }
    }
}

module.exports = new SocketService();
