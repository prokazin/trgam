class TradingSystem {
    constructor() {
        this.currentAsset = 'BTC';
        this.currentLeverage = 2;
        this.currentAmount = 100;
        this.openPositions = [];
        this.updateInterval = null;
        
        this.initTrading();
    }
    
    initTrading() {
        this.loadPositions();
        this.setupEventListeners();
        this.startPriceUpdates();
    }
    
    loadPositions() {
        const data = loadFromStorage();
        this.openPositions = data?.positions || [];
        this.updatePositionsDisplay();
    }
    
    setupEventListeners() {
        document.getElementById('assetSelect').addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            if (window.tradingChart) {
                window.tradingChart.switchAsset(this.currentAsset);
            }
            this.updateCurrentPrice();
        });
        
        document.querySelectorAll('.lev-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLeverage = parseInt(e.target.dataset.leverage);
            });
        });
        
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentAmount = parseInt(e.target.dataset.amount);
            });
        });
    }
    
    startPriceUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateCurrentPrice();
        }, 3000);
    }
    
    updateCurrentPrice() {
        if (!window.tradingChart) return;
        
        const newPrice = window.tradingChart.updatePrice(this.currentAsset);
        
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        
        const prevPrice = parseFloat(priceElement.textContent.replace('$', '').replace(',', '')) || newPrice;
        const changePercent = ((newPrice - prevPrice) / prevPrice * 100);
        
        priceElement.textContent = `$${newPrice.toFixed(this.getPriceDecimals())}`;
        changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.className = changePercent >= 0 ? 'positive' : 'negative';
        
        this.updatePositionsPnL(newPrice);
    }
    
    getPriceDecimals() {
        switch(this.currentAsset) {
            case 'BTC': return 2;
            case 'SHIB': return 8;
            case 'DOGE': return 6;
            default: return 2;
        }
    }
    
    openPosition(direction) {
        const stopLossInput = document.getElementById('stopLoss');
        const stopLoss = parseFloat(stopLossInput.value);
        
        const amount = this.currentAmount;
        
        if (!amount || amount <= 0) {
            alert('Выберите сумму');
            return;
        }
        
        const data = loadFromStorage();
        const balance = data?.balance || 2000;
        
        if (amount > balance) {
            alert('Недостаточно средств');
            return;
        }
        
        const currentPrice = parseFloat(
            document.getElementById('currentPrice').textContent.replace('$', '').replace(',', '')
        );
        
        const position = {
            id: generateId(),
            asset: this.currentAsset,
            direction: direction,
            entryPrice: currentPrice,
            currentPrice: currentPrice,
            amount: amount,
            leverage: this.currentLeverage,
            openTime: new Date().toISOString(),
            stopLoss: stopLoss,
            pnl: 0,
            roe: 0
        };
        
        if (savePosition(position)) {
            this.openPositions.push(position);
            
            if (window.tradingChart) {
                window.tradingChart.addEntryPoint(currentPrice);
            }
            
            this.updatePositionsDisplay();
            this.updateBalanceDisplay();
            
            this.applyMarketImpact(direction, amount);
            
            alert(`Позиция открыта: ${direction === 'long' ? 'Лонг' : 'Шорт'} ${this.currentAsset} на $${amount}`);
        }
    }
    
    closePosition() {
        if (this.openPositions.length === 0) {
            alert('Нет открытых позиций');
            return;
        }
        
        // Закрываем последнюю позицию для текущего актива
        const currentAssetPositions = this.openPositions.filter(p => p.asset === this.currentAsset);
        if (currentAssetPositions.length === 0) {
            alert('Нет открытых позиций для этой валюты');
            return;
        }
        
        const position = currentAssetPositions[currentAssetPositions.length - 1];
        this.closeSpecificPosition(position.id);
    }
    
    closeSpecificPosition(positionId) {
        const position = this.openPositions.find(p => p.id === positionId);
        if (!position) return;
        
        const currentPrice = parseFloat(
            document.getElementById('currentPrice').textContent.replace('$', '').replace(',', '')
        );
        
        const priceDiff = currentPrice - position.entryPrice;
        
        // ВАЖНО: Исправленный расчет P&L
        let pnl;
        if (position.direction === 'long') {
            // Для лонга: прибыль = (текущая цена - цена входа) * сумма * плечо
            pnl = priceDiff * position.amount * position.leverage;
        } else {
            // Для шорта: прибыль = (цена входа - текущая цена) * сумма * плечо
            pnl = -priceDiff * position.amount * position.leverage;
        }
        
        const roe = (pnl / position.amount) * 100;
        
        position.currentPrice = currentPrice;
        position.pnl = pnl;
        position.roe = roe;
        
        // Сохраняем в историю
        saveToHistory(position);
        
        // Обновляем баланс
        const data = loadFromStorage();
        const newBalance = (data?.balance || 2000) + pnl;
        updateBalance(newBalance);
        
        // Удаляем позицию из хранилища
        const dataStorage = loadFromStorage();
        if (dataStorage) {
            dataStorage.positions = dataStorage.positions.filter(p => p.id !== positionId);
            saveToStorage(dataStorage);
        }
        
        // Удаляем позицию из открытых
        this.openPositions = this.openPositions.filter(p => p.id !== positionId);
        
        // Добавляем точку выхода на график
        if (window.tradingChart) {
            window.tradingChart.addExitPoint(currentPrice);
        }
        
        // Обновляем интерфейс
        this.updatePositionsDisplay();
        this.updateBalanceDisplay();
        
        alert(`Позиция закрыта. P&L: $${pnl.toFixed(2)} (ROE: ${roe.toFixed(2)}%)`);
    }
    
    updatePositionsPnL(currentPrice) {
        this.openPositions.forEach(position => {
            if (position.asset === this.currentAsset) {
                const priceDiff = currentPrice - position.entryPrice;
                
                // Исправленный расчет P&L
                if (position.direction === 'long') {
                    position.pnl = priceDiff * position.amount * position.leverage;
                } else {
                    position.pnl = -priceDiff * position.amount * position.leverage;
                }
                
                position.roe = (position.pnl / position.amount) * 100;
                position.currentPrice = currentPrice;
                
                // Проверка стоп-лосса
                if (position.stopLoss) {
                    const lossPercent = Math.abs(position.roe);
                    if (lossPercent >= position.stopLoss) {
                        this.closePositionById(position.id);
                    }
                }
            }
        });
        
        this.updatePositionsDisplay();
    }
    
    closePositionById(positionId) {
        const position = this.openPositions.find(p => p.id === positionId);
        if (!position) return;
        
        const currentPrice = position.currentPrice;
        const priceDiff = currentPrice - position.entryPrice;
        
        // Исправленный расчет P&L
        let pnl;
        if (position.direction === 'long') {
            pnl = priceDiff * position.amount * position.leverage;
        } else {
            pnl = -priceDiff * position.amount * position.leverage;
        }
        
        position.pnl = pnl;
        position.roe = (pnl / position.amount) * 100;
        
        saveToHistory(position);
        
        const data = loadFromStorage();
        const newBalance = (data?.balance || 2000) + pnl;
        updateBalance(newBalance);
        
        const dataStorage = loadFromStorage();
        if (dataStorage) {
            dataStorage.positions = dataStorage.positions.filter(p => p.id !== positionId);
            saveToStorage(dataStorage);
        }
        
        this.openPositions = this.openPositions.filter(p => p.id !== positionId);
        this.updatePositionsDisplay();
        this.updateBalanceDisplay();
        
        if (window.tradingChart) {
            window.tradingChart.addExitPoint(currentPrice);
        }
        
        alert(`Позиция закрыта по стоп-лоссу. P&L: $${pnl.toFixed(2)}`);
    }
    
    updatePositionsDisplay() {
        const container = document.getElementById('openPositionsList');
        if (!container) return;
        
        if (this.openPositions.length === 0) {
            container.innerHTML = '<div class="no-positions">Нет открытых позиций</div>';
            return;
        }
        
        const currentAssetPositions = this.openPositions.filter(p => p.asset === this.currentAsset);
        
        if (currentAssetPositions.length === 0) {
            container.innerHTML = '<div class="no-positions">Нет открытых позиций для этой валюты</div>';
            return;
        }
        
        container.innerHTML = currentAssetPositions.map(position => `
            <div class="position-item" data-id="${position.id}">
                <div class="position-info">
                    <span class="position-asset">${position.asset}</span>
                    <span class="position-direction ${position.direction}">
                        ${position.direction === 'long' ? 'Лонг' : 'Шорт'} ${position.leverage}x
                    </span>
                </div>
                <div class="position-details">
                    <span>Вход: $${position.entryPrice.toFixed(this.getPriceDecimals())}</span>
                    <span>Сумма: $${position.amount.toFixed(2)}</span>
                    <span class="position-profit ${position.pnl >= 0 ? 'positive' : 'negative'}">
                        P&L: $${position.pnl.toFixed(2)} (${position.roe.toFixed(2)}%)
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    updateBalanceDisplay() {
        const data = loadFromStorage();
        const balance = data?.balance || 2000;
        
        document.getElementById('userBalance').textContent = 
            `$${balance.toFixed(2)}`;
        
        const totalPnL = this.openPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalInvested = this.openPositions.reduce((sum, pos) => sum + pos.amount, 0);
        const totalROE = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
        
        document.getElementById('roeDisplay').textContent = 
            `ROE: ${totalROE.toFixed(2)}%`;
    }
    
    applyMarketImpact(direction, amount) {
        if (amount > 500) {
            const data = loadFromStorage();
            if (data) {
                const volatilityChange = direction === 'long' ? 0.01 : -0.01;
                data.market.volatility[this.currentAsset] += volatilityChange;
                // Ограничиваем волатильность
                data.market.volatility[this.currentAsset] = Math.max(0.01, Math.min(0.2, data.market.volatility[this.currentAsset]));
                saveToStorage(data);
            }
        }
    }
}

let tradingSystem = null;

function initTrading() {
    tradingSystem = new TradingSystem();
    return tradingSystem;
}

window.openPosition = function(direction) {
    if (tradingSystem) {
        tradingSystem.openPosition(direction);
    }
};

window.closePosition = function() {
    if (tradingSystem) {
        tradingSystem.closePosition();
    }
};

window.initTrading = initTrading;
window.TradingSystem = TradingSystem;
