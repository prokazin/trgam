class TradingChart {
    constructor() {
        this.chart = null;
        this.priceData = {};
        this.entryPoints = {};
        this.exitPoints = {};
        this.timeLabels = [];
        
        this.currentAsset = 'BTC';
        this.initChart();
        this.generateInitialData();
    }
    
    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [
                    {
                        label: 'Цена',
                        data: this.priceData[this.currentAsset] || [],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Вход',
                        data: this.entryPoints[this.currentAsset] || [],
                        pointBackgroundColor: '#00ff88',
                        pointBorderColor: '#fff',
                        pointRadius: 6,
                        pointBorderWidth: 2,
                        showLine: false,
                        pointStyle: 'circle'
                    },
                    {
                        label: 'Выход',
                        data: this.exitPoints[this.currentAsset] || [],
                        pointBackgroundColor: '#ff4444',
                        pointBorderColor: '#fff',
                        pointRadius: 6,
                        pointBorderWidth: 2,
                        showLine: false,
                        pointStyle: 'crossRot'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    }
    
    generateInitialData() {
        const data = loadFromStorage();
        
        // Инициализация данных для каждой валюты
        ['BTC', 'SHIB', 'DOGE'].forEach(asset => {
            this.priceData[asset] = [];
            this.entryPoints[asset] = [];
            this.exitPoints[asset] = [];
        });
        
        // Генерация 100 точек для каждой валюты
        for (let i = 0; i < 100; i++) {
            this.timeLabels.push(i);
            
            ['BTC', 'SHIB', 'DOGE'].forEach(asset => {
                const basePrice = data?.market?.prices[asset] || 
                    (asset === 'BTC' ? 50000 : asset === 'SHIB' ? 0.00001 : 0.15);
                
                if (i === 0) {
                    this.priceData[asset].push(basePrice);
                } else {
                    let change = (Math.random() - 0.5) * basePrice * 0.02;
                    
                    if (this.priceData[asset][i-1] < basePrice * 0.9) {
                        change += Math.random() * basePrice * 0.01;
                    } else if (this.priceData[asset][i-1] > basePrice * 1.1) {
                        change -= Math.random() * basePrice * 0.01;
                    }
                    
                    this.priceData[asset].push(this.priceData[asset][i-1] + change);
                }
            });
        }
        
        this.updateChart();
    }
    
    switchAsset(asset) {
        this.currentAsset = asset;
        this.updateChart();
    }
    
    updateChart() {
        if (this.chart) {
            this.chart.data.datasets[0].data = this.priceData[this.currentAsset] || [];
            this.chart.data.datasets[1].data = this.entryPoints[this.currentAsset] || [];
            this.chart.data.datasets[2].data = this.exitPoints[this.currentAsset] || [];
            this.chart.update('none');
        }
    }
    
    addPricePoint(price) {
        if (!this.priceData[this.currentAsset]) {
            this.priceData[this.currentAsset] = [];
        }
        
        this.timeLabels.shift();
        this.timeLabels.push(this.timeLabels.length > 0 ? 
            this.timeLabels[this.timeLabels.length - 1] + 1 : 0);
        
        this.priceData[this.currentAsset].shift();
        this.priceData[this.currentAsset].push(price);
        
        if (this.entryPoints[this.currentAsset]) {
            this.entryPoints[this.currentAsset] = this.entryPoints[this.currentAsset].map(p => 
                p.x >= 0 ? {x: p.x - 1, y: p.y} : p
            ).filter(p => p.x >= 0);
        }
        
        if (this.exitPoints[this.currentAsset]) {
            this.exitPoints[this.currentAsset] = this.exitPoints[this.currentAsset].map(p => 
                p.x >= 0 ? {x: p.x - 1, y: p.y} : p
            ).filter(p => p.x >= 0);
        }
        
        this.updateChart();
    }
    
    addEntryPoint(price) {
        if (!this.entryPoints[this.currentAsset]) {
            this.entryPoints[this.currentAsset] = [];
        }
        
        const index = (this.priceData[this.currentAsset] || []).length - 1;
        this.entryPoints[this.currentAsset].push({
            x: index,
            y: price
        });
        this.updateChart();
    }
    
    addExitPoint(price) {
        if (!this.exitPoints[this.currentAsset]) {
            this.exitPoints[this.currentAsset] = [];
        }
        
        const index = (this.priceData[this.currentAsset] || []).length - 1;
        this.exitPoints[this.currentAsset].push({
            x: index,
            y: price
        });
        this.updateChart();
    }
    
    updatePrice(asset, marketData) {
        const data = loadFromStorage();
        const basePrice = data?.market?.prices[asset] || 
            (asset === 'BTC' ? 50000 : asset === 'SHIB' ? 0.00001 : 0.15);
        const volatility = data?.market?.volatility[asset] || 0.02;
        
        const positions = data?.positions || [];
        const buyPressure = positions.filter(p => p.direction === 'long' && p.asset === asset).length;
        const sellPressure = positions.filter(p => p.direction === 'short' && p.asset === asset).length;
        
        let priceChange = 0;
        if (buyPressure > sellPressure) {
            priceChange = Math.random() * volatility * 0.5;
        } else if (sellPressure > buyPressure) {
            priceChange = -Math.random() * volatility * 0.5;
        } else {
            priceChange = (Math.random() - 0.5) * volatility;
        }
        
        if (window.marketEvents && window.marketEvents.activeEvents.length > 0) {
            window.marketEvents.activeEvents.forEach(event => {
                priceChange += event.priceImpact;
            });
        }
        
        const newPrice = basePrice * (1 + priceChange);
        
        if (data) {
            data.market.prices[asset] = newPrice;
            saveToStorage(data);
        }
        
        if (asset === this.currentAsset) {
            this.addPricePoint(newPrice);
        }
        
        this.checkLiquidation(asset, newPrice, data?.balance || 2000);
        
        return newPrice;
    }
    
    checkLiquidation(asset, currentPrice, balance) {
        const data = loadFromStorage();
        const positions = data?.positions || [];
        
        positions.forEach(position => {
            if (position.asset === asset) {
                const priceDiff = Math.abs(currentPrice - position.entryPrice) / position.entryPrice;
                const lossPercent = priceDiff * position.leverage * 100;
                
                if (lossPercent >= 100) {
                    handleLiquidation(position);
                }
            }
        });
    }
}

function handleLiquidation(position) {
    const data = loadFromStorage();
    if (!data) return;
    
    const priceDiff = position.currentPrice - position.entryPrice;
    const pnl = position.direction === 'long' ? 
        priceDiff * position.amount * position.leverage :
        -priceDiff * position.amount * position.leverage;
    
    data.balance = Math.max(0, data.balance + pnl);
    data.positions = data.positions.filter(p => p.id !== position.id);
    saveToStorage(data);
    
    if (window.tradingSystem) {
        window.tradingSystem.openPositions = window.tradingSystem.openPositions.filter(p => p.id !== position.id);
        window.tradingSystem.updateBalanceDisplay();
        window.tradingSystem.updatePositionsDisplay();
    }
    
    alert(`Ликвидация! Позиция ${position.asset} закрыта по стоп-ауту.`);
}

let tradingChart = null;

function initChart() {
    tradingChart = new TradingChart();
    return tradingChart;
}

window.initChart = initChart;
window.TradingChart = TradingChart;
