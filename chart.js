class TradingChart {
    constructor() {
        this.chart = null;
        this.priceData = [];
        this.entryPoints = [];
        this.exitPoints = [];
        this.supportLevels = [];
        this.resistanceLevels = [];
        this.timeLabels = [];
        
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
                        data: this.priceData,
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Вход',
                        data: this.entryPoints,
                        pointBackgroundColor: '#00ff88',
                        pointBorderColor: '#fff',
                        pointRadius: 6,
                        pointBorderWidth: 2,
                        showLine: false,
                        pointStyle: 'circle'
                    },
                    {
                        label: 'Выход',
                        data: this.exitPoints,
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
        const asset = document.getElementById('assetSelect').value;
        const basePrice = data?.market?.prices[asset] || 50000;
        
        // Генерация 100 точек начальных данных
        for (let i = 0; i < 100; i++) {
            this.timeLabels.push(i);
            
            if (i === 0) {
                this.priceData.push(basePrice);
            } else {
                // Реалистичное движение с поддержками/сопротивлениями
                let change = (Math.random() - 0.5) * basePrice * 0.02;
                
                // Добавление эффекта поддержки/сопротивления
                if (this.priceData[i-1] < basePrice * 0.9) {
                    change += Math.random() * basePrice * 0.01; // поддержка
                } else if (this.priceData[i-1] > basePrice * 1.1) {
                    change -= Math.random() * basePrice * 0.01; // сопротивление
                }
                
                this.priceData.push(this.priceData[i-1] + change);
            }
        }
        
        this.updateChart();
    }
    
    updateChart() {
        if (this.chart) {
            this.chart.data.labels = this.timeLabels;
            this.chart.data.datasets[0].data = this.priceData;
            this.chart.data.datasets[1].data = this.entryPoints;
            this.chart.data.datasets[2].data = this.exitPoints;
            this.chart.update('none');
        }
    }
    
    addPricePoint(price) {
        // Удаляем старую точку и добавляем новую
        this.timeLabels.shift();
        this.timeLabels.push(this.timeLabels.length > 0 ? 
            this.timeLabels[this.timeLabels.length - 1] + 1 : 0);
        
        this.priceData.shift();
        this.priceData.push(price);
        
        // Обновляем точки входа/выхода
        this.entryPoints = this.entryPoints.map(p => 
            p.x >= 0 ? {x: p.x - 1, y: p.y} : p
        ).filter(p => p.x >= 0);
        
        this.exitPoints = this.exitPoints.map(p => 
            p.x >= 0 ? {x: p.x - 1, y: p.y} : p
        ).filter(p => p.x >= 0);
        
        this.updateChart();
    }
    
    addEntryPoint(price) {
        const index = this.priceData.length - 1;
        this.entryPoints.push({
            x: index,
            y: price
        });
        this.updateChart();
    }
    
    addExitPoint(price) {
        const index = this.priceData.length - 1;
        this.exitPoints.push({
            x: index,
            y: price
        });
        this.updateChart();
    }
    
    updatePrice(asset, marketData) {
        const data = loadFromStorage();
        const basePrice = data?.market?.prices[asset] || 50000;
        const volatility = data?.market?.volatility[asset] || 0.02;
        
        // Влияние открытых позиций на цену
        const positions = data?.positions || [];
        const buyPressure = positions.filter(p => p.direction === 'long').length;
        const sellPressure = positions.filter(p => p.direction === 'short').length;
        
        let priceChange = 0;
        if (buyPressure > sellPressure) {
            priceChange = Math.random() * volatility * 0.5;
        } else if (sellPressure > buyPressure) {
            priceChange = -Math.random() * volatility * 0.5;
        } else {
            priceChange = (Math.random() - 0.5) * volatility;
        }
        
        // Добавление рыночных событий
        if (window.marketEvents && window.marketEvents.activeEvents.length > 0) {
            window.marketEvents.activeEvents.forEach(event => {
                priceChange += event.priceImpact;
            });
        }
        
        const newPrice = basePrice * (1 + priceChange);
        
        // Обновление в хранилище
        if (data) {
            data.market.prices[asset] = newPrice;
            saveToStorage(data);
        }
        
        this.addPricePoint(newPrice);
        
        // Проверка на ликвидацию
        this.checkLiquidation(newPrice, data?.balance || 2000);
        
        return newPrice;
    }
    
    checkLiquidation(currentPrice, balance) {
        const data = loadFromStorage();
        const positions = data?.positions || [];
        
        positions.forEach(position => {
            const priceDiff = Math.abs(currentPrice - position.entryPrice) / position.entryPrice;
            const lossPercent = priceDiff * position.leverage * 100;
            
            if (lossPercent >= 100) {
                // Ликвидация
                handleLiquidation(position);
            }
        });
    }
}

// Инициализация графика
let tradingChart = null;

function initChart() {
    tradingChart = new TradingChart();
    return tradingChart;
}

// Экспорт функций
window.initChart = initChart;
window.TradingChart = TradingChart;
