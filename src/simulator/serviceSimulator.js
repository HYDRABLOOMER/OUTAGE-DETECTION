const axios = require('axios');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/metrics`;
const SOCKET_URL = `http://localhost:${process.env.PORT || 5000}`;

const SERVICES = [
    { name: 'API Gateway', baseLatency: 50, errorLuck: 0.98 },
    { name: 'Auth Service', baseLatency: 30, errorLuck: 0.99 },
    { name: 'Order DB', baseLatency: 100, errorLuck: 0.97 },
    { name: 'Payment API', baseLatency: 200, errorLuck: 0.95 }
];

// Service states (to track malfunctions)
const serviceStates = {};
SERVICES.forEach(s => {
    serviceStates[s.name] = { isFaulty: false, faultType: null };
});

// Connect to Socket.io for mitigation commands
const socket = io(SOCKET_URL);
socket.on('connect', () => {
    console.log('Simulator connected to Server Socket');
});

// Listen for mitigation (simplified for demo: resetting all faults)
// In a real system, would be service-specific
socket.on('new-log', (log) => {
    if (log.type === 'mitigation') {
        console.log(`[Simulator] MITIGATION RECEIVED for ${log.serviceName}. Resetting service health...`);
        if (serviceStates[log.serviceName]) {
            serviceStates[log.serviceName].isFaulty = false;
            serviceStates[log.serviceName].faultType = null;
        }
    }
});

/**
 * Generate and send metrics for a service
 */
async function sendMetrics(service) {
    const state = serviceStates[service.name];
    
    // Inject random fault (1% chance)
    if (!state.isFaulty && Math.random() < 0.01) {
        state.isFaulty = true;
        state.faultType = Math.random() > 0.5 ? 'latency' : 'error';
        console.log(`!!! FAULT INJECTED in ${service.name}: ${state.faultType} !!!`);
    }

    let latency = service.baseLatency + (Math.random() * 20 - 10);
    let errorRate = Math.random() > service.errorLuck ? (Math.random() * 5 + 1) : 0;

    if (state.isFaulty) {
        if (state.faultType === 'latency') {
            latency *= (3 + Math.random() * 5); // Huge spike
        } else {
            errorRate += (20 + Math.random() * 30); // Huge error rate
        }
    }

    const payload = {
        serviceName: service.name,
        latency: Math.round(latency),
        errorRate: parseFloat(errorRate.toFixed(2)),
        requestCount: Math.floor(Math.random() * 100) + 10
    };

    try {
        await axios.post(API_URL, payload);
        // console.log(`Metric sent for ${service.name}: ${JSON.stringify(payload)}`);
    } catch (err) {
        // console.error(`Error sending metrics for ${service.name}: ${err.message}`);
    }
}

/**
 * Main Simulator Loop
 */
function startSimulator() {
    console.log('Starting Service Simulator...');
    console.log(`Targeting API: ${API_URL}`);
    
    setInterval(() => {
        SERVICES.forEach(s => sendMetrics(s));
    }, 3000); // Send metrics every 3 seconds
}

startSimulator();
