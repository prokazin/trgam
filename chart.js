class TradingChart {
    constructor() {
        this.chart = null;
        this.priceData = {
            BTC: [],
            SHIB: [],
            DOGE: []
        };
        this.entryPoints = {
            BTC: [],
            SHIB: [],
            DOGE: []
        };
        this.exitPoints = {
            BTC: [],
            SHIB: [],
            DOGE: []
        };
        this.timeLabels = [];
        this.currentAsset = 'BTC';
        this.currentPrices = {
            BTC: 50000,
            SHIB: 0.00001,
            DOGE: 0.15
        };
        
        this.initChart();
        this.generateInitialData();
    }
    
    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        // Генерируем начальные метки времени
        for (let i = 0; i < 50; i++) {
            this.timeLabels.push(`t-${50 - i}`);
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [
                    {
                        label: 'Цена',
                        data: this.priceData[this.currentAsset],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0
                    },
                    {
                        label: 'Вход',
                        data: this.entryPoints[this.currentAsset],
                        pointBackgroundColor: '#00ff88',
                        pointBorderColor: '#fff',
                        pointRadius: 6,
                        pointBorderWidth: 2,
                        showLine: false,
                        pointStyle: 'circle'
                    },
                    {
                        label: 'Выход',
                        data: this.exitPoints[this.currentAsset],
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
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += '$' + context.parsed.y.toLocaleString();
                                return label;
                            }
                        }
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
                }
            }
        });
    }
    
    generateInitialData() {
        const data = loadFromStorage();
        
        ['BTC', 'SHIB', 'DOGE'].forEach(asset => {
            const basePrice = data?.market?.prices[asset] || 
                (asset === 'BTC' ? 50000 : asset === 'SHIB' ? 0.00001 : 0.15);
            
            this.currentPrices[asset] = basePrice;
            
            // Генерируем 50 начальных точек
            for (let i = 0; i < 50; i++) {
                if (i === 0) {
                    this.priceData[asset].push(basePrice);
                } else {
                    // Создаем реалистичное движение цены
                    let change = (Math.random() - 0.5) * basePrice * 0.02;
                    
                    // Эффект поддержки/сопротивления
                    const lastPrice = this.priceData[asset][i-1];
                    if (lastPrice < basePrice * 0.95) {
                        change += Math.random() * basePrice * 0.01; // поддержка
                    } else if (lastPrice > basePrice * 1.05) {
                        change -= Math.random() * basePrice * 0.01; // сопротивление
                    }
                    
                    // Немного тренда
                    change += (Math.random() - 0.5) * basePrice * 0.005;
                    
                    const newPrice = lastPrice + change;
                    this.priceData[asset].push(newPrice);
                    this.currentPrices[asset] = newPrice;
                }
            }
        });
        
        this.updateChart();
    }
    
    switchAsset(asset) {
        this.currentAsset = asset;
        this.updateChart();
    }
    
    updateChart() {
        if (this.chart) {
            this.chart.data.labels = this.timeLabels;
            this.chart.data.datasets[0].data = this.priceData[this.currentAsset];
            this.chart.data.datasets[1].data = this.entryPoints[this.currentAsset];
            this.chart.data.datasets[2].data = this.exitPoints[this.currentAsset];
            this.chart.update('none');
        }
    }
    
    addNewPrice(asset, price) {
        // Добавляем новую цену
        this.priceData[asset].push(price);
        
        // Удаляем самую старую цену, чтобы сохранить 50 точек
        if (this.priceData[asset].length > 50) {
            this.priceData[asset].shift();
        }
        
        // Обновляем текущую цену
        this.currentPrices[asset] = price;
        
        // Обновляем метки времени
        if (this.timeLabels.length >= 50) {
            this.timeLabels.shift();
        }
        this.timeLabels.push(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        
        // Сдвигаем точки входа/выхода
        this.entryPoints[asset] = this.entryPoints[asset].map(point => {
            return {x: point.x + 1, y: point.y};
        }).filter(point => point.x < 50);
        
        this.exitPoints[asset] = this.exitPoints[asset].map(point => {
            return {x: point.x + 1, y: point.y};
        }).filter(point => point.x < 50);
        
        // Если это текущий актив, обновляем график
        if (asset === this.currentAsset) {
            this.updateChart();
        }
    }
    
    addEntryPoint(asset, price) {
        const index = this.priceData[asset].length - 1;
        this.entryPoints[asset].push({
            x: index,
            y: price
        });
        
        if (asset === this.currentAsset) {
            this.updateChart();
        }
    }
    
    addExitPoint(asset, price) {
        const index = this.priceData[asset].length - 1;
        this.exitPoints[asset].push({
            x: index,
            y: price
        });
        
        if (asset === this.currentAsset) {
            this.updateChart();
        }
    }
    
    updatePrice(asset) {
        const data = loadFromStorage();
        const currentPrice = this.currentPrices[asset];
        const volatility = data?.market?.volatility[asset] || 0.02;
        
        // Получаем позиции для этого актива
        const positions = data?.positions || [];
        const assetPositions = positions.filter(p => p.asset === asset);
        
        // Рассчитываем давление покупок/продаж
        let marketPressure = 0;
        assetPositions.forEach(pos => {
            if (pos.direction === 'long') {
                marketPressure += pos.amount * 0.0001; // Покупки увеличивают цену
            } else {
                marketPressure -= pos.amount * 0.0001; // Продажи уменьшают цену
            }
        });
        
        // Базовая волатильность + влияние позиций
        let priceChange = (Math.random() - 0.5) * volatility * 2;
        priceChange += marketPressure;
        
        // Влияние рыночных событий
        if (window.marketEvents && window.marketEvents.activeEvents.length > 0) {
            window.marketEvents.activeEvents.forEach(event => {
                priceChange += (event.priceImpact * 0.3); // Уменьшенное влияние
            });
        }
        
        // Ограничиваем максимальное изменение
        priceChange = Math.max(-volatility * 3, Math.min(volatility * 3, priceChange));
        
        const newPrice = currentPrice * (1 + priceChange);
        
        // Обновляем в хранилище
        if (data) {
            data.market.prices[asset] = newPrice;
            data.market.lastUpdate = Date.now();
            saveToStorage(data);
        }
        
        // Добавляем точку на график
        this.addNewPrice(asset, newPrice);
        
        // Проверяем ликвидацию
        this.checkLiquidation(asset, newPrice);
        
        return newPrice;
    }
    
    checkLiquidation(asset, currentPrice) {
        const data = loadFromStorage();
        if (!data) return;
        
        const positions = data.positions || [];
        positions.forEach(position => {
            if (position.asset === asset) {
                const priceDiff = position.direction === 'long' 
                    ? (position.entryPrice - currentPrice) // Для лонга: цена упала
                    : (currentPrice - position.entryPrice); // Для шорта: цена выросла
                
                const lossPercent = (priceDiff / position.entryPrice) * position.leverage * 100;
                
                if (lossPercent >= 100) {
                    // Ликвидация
                    this.handleLiquidation(position, currentPrice);
                }
            }
        });
    }
    
    handleLiquidation(position, currentPrice) {
        const data = loadFromStorage();
        if (!data) return;
        
        // Рассчитываем P&L при ликвидации
        const priceDiff = currentPrice - position.entryPrice;
        let pnl;
        if (position.direction === 'long') {
            pnl = priceDiff * position.amount * position.leverage;
        } else {
            pnl = -priceDiff * position.amount * position.leverage;
        }
        
        // Обновляем баланс (не может быть отрицательным)
        const newBalance = Math.max(0, data.balance + pnl);
        updateBalance(newBalance);
        
        // Добавляем точку выхода на график
        this.addExitPoint(position.asset, currentPrice);
        
        // Удаляем позицию
        data.positions = data.positions.filter(p => p.id !== position.id);
        saveToStorage(data);
        
        // Обновляем интерфейс
        if (window.tradingSystem) {
            window.tradingSystem.openPositions = window.tradingSystem.openPositions.filter(p => p.id !== position.id);
            window.tradingSystem.updatePositionsDisplay();
            window.tradingSystem.updateBalanceDisplay();
        }
        
        // Уведомление
        setTimeout(() => {
            alert(`❗ Ликвидация! Позиция ${position.asset} закрыта.\nP&L: $${pnl.toFixed(2)}\nНовый баланс: $${newBalance.toFixed(2)}`);
        }, 100);
    }
}

let tradingChart = null;

function initChart() {
    tradingChart = new TradingChart();
    return tradingChart;
}

window.initChart = initChart;
window.TradingChart = TradingChart;
