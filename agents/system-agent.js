const si = require('systeminformation');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api/metrics';
const AGENT_NAME = process.env.AGENT_NAME || 'Main-Server-Agent';
const INTERVAL = parseInt(process.env.AGENT_INTERVAL) || 5000;

/**
 * System Agent
 * Collects real-time hardware metrics and reports them to the central monitoring system.
 */
async function collectAndSendMetrics() {
    try {
        // Collect metrics in parallel
        const [cpu, mem, disk, net] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.networkStats()
        ]);

        const payload = {
            serviceName: AGENT_NAME,
            cpuUsage: cpu.currentLoad,
            memoryUsage: (mem.active / mem.total) * 100,
            diskUsage: disk[0] ? disk[0].use : 0,
            networkSpeed: net[0] ? (net[0].rx_sec + net[0].tx_sec) / 1024 / 1024 : 0, // Mbps
            timestamp: new Date()
        };

        // console.log(`[Agent] Reporting: CPU: ${payload.cpuUsage.toFixed(1)}%, RAM: ${payload.memoryUsage.toFixed(1)}%`);
        
        await axios.post(API_URL, payload);
    } catch (error) {
        console.error(`[Agent] Error collecting metrics: ${error.message}`);
    }
}

console.log(`📡 system-agent started. Reporting to ${API_URL} every ${INTERVAL}ms...`);
setInterval(collectAndSendMetrics, INTERVAL);
collectAndSendMetrics();
