// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    
    // Chart configurations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#f8fafc', usePointStyle: true }
            }
        },
        animation: { duration: 500 }
    };

    const latencyCtx = document.getElementById('latencyChart').getContext('2d');
    const errorCtx = document.getElementById('errorChart').getContext('2d');

    const latencyChart = new Chart(latencyCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    const errorChart = new Chart(errorCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    const serviceColors = {
        'API Gateway': '#4f46e5',
        'Auth Service': '#10b981',
        'Order DB': '#f59e0b',
        'Payment API': '#ef4444'
    };

    /**
     * Initial data fetch
     */
    async function initDashboard() {
        try {
            const [statusRes, alertsRes, logsRes] = await Promise.all([
                fetch('/api/metrics/status'),
                fetch('/api/system/alerts'),
                fetch('/api/system/logs')
            ]);
            
            const [statusData, alertsData, logsData] = await Promise.all([
                statusRes.json(),
                alertsRes.json(),
                logsRes.json()
            ]);

            // Update UI with initial status
            updateServiceGrid(statusData);
            alertsData.forEach(addAlertToFeed);
            logsData.forEach(addLogToFeed);
        } catch (err) {
            console.error('Initialization error:', err);
        }
    }

    /**
     * Update Service Grid (Status Cards)
     */
    function updateServiceGrid(services) {
        const grid = document.getElementById('service-status-grid');
        grid.innerHTML = '';

        services.forEach(service => {
            const isFaulty = service.lastErrorRate > 10 || service.lastLatency > 500;
            const card = document.createElement('div');
            card.className = `status-card ${isFaulty ? 'faulty' : 'healthy'}`;
            card.innerHTML = `
                <div class="service-title">SERVICE STATUS</div>
                <div class="service-name">${service._id}</div>
                <div class="metrics-row">
                    <span>Latency: <strong>${service.lastLatency}ms</strong></span>
                    <span>Errors: <strong>${service.lastErrorRate}%</strong></span>
                </div>
                <div class="metrics-row" style="margin-top: 0.5rem; font-size: 0.75rem; color: #94a3b8">
                    <span>Last seen: ${new Date(service.lastSeen).toLocaleTimeString()}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /**
     * Real-time Metric Handling
     */
    socket.on('new-metric', (metric) => {
        const time = new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Update Latency Chart
        updateChart(latencyChart, metric.serviceName, time, metric.latency);
        
        // Update Error Chart
        updateChart(errorChart, metric.serviceName, time, metric.errorRate);

        // Update overall service status (simplified: re-fetch)
        debounceFetchStatus();
    });

    function updateChart(chart, serviceName, timestamp, value) {
        let dataset = chart.data.datasets.find(ds => ds.label === serviceName);
        
        if (!dataset) {
            dataset = {
                label: serviceName,
                data: [],
                borderColor: serviceColors[serviceName] || '#999',
                backgroundColor: (serviceColors[serviceName] || '#999') + '33',
                tension: 0.4,
                pointRadius: 2
            };
            chart.data.datasets.push(dataset);
        }

        if (chart.data.labels.indexOf(timestamp) === -1) {
            chart.data.labels.push(timestamp);
            if (chart.data.labels.length > 20) chart.data.labels.shift();
        }

        dataset.data.push(value);
        if (dataset.data.length > 20) dataset.data.shift();

        chart.update('none'); // Update without full animation for performance
    }

    /**
     * Alerts Handling
     */
    socket.on('new-alert', addAlertToFeed);

    function addAlertToFeed(alert) {
        const feed = document.getElementById('alerts-feed');
        const item = document.createElement('div');
        item.className = `alert-item ${alert.severity}`;
        item.innerHTML = `
            <strong>[${alert.severity.toUpperCase()}] ${alert.serviceName}</strong><br>
            ${alert.message}<br>
            <small>${new Date(alert.timestamp).toLocaleString()}</small>
        `;
        feed.prepend(item);
        if (feed.children.length > 50) feed.lastChild.remove();
    }

    /**
     * Logs Handling
     */
    socket.on('new-log', addLogToFeed);

    function addLogToFeed(log) {
        const feed = document.getElementById('logs-feed');
        const item = document.createElement('div');
        item.className = `log-item ${log.type}`;
        item.innerHTML = `
            <span class="log-type">[${log.type.toUpperCase()}]</span> 
            ${log.serviceName}: ${log.message}
            <div style="font-size: 0.7rem; color: #94a3b8">${new Date(log.timestamp).toLocaleTimeString()}</div>
        `;
        feed.prepend(item);
        if (feed.children.length > 50) feed.lastChild.remove();
    }

    // Debounce function for status updates
    let fetchTimer;
    function debounceFetchStatus() {
        clearTimeout(fetchTimer);
        fetchTimer = setTimeout(async () => {
            const res = await fetch('/api/metrics/status');
            const data = await res.json();
            updateServiceGrid(data);
        }, 1000);
    }

    initDashboard();
});
