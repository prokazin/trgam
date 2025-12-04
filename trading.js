class TradingSystem {
    constructor() {
        this.currentAsset = 'BTC';
        this.currentLeverage = 2;
        this.currentAmount = 100;
        this.openPositions = [];
        this.updateInterval = null;
        this.priceUpdateInterval = null;
        
        this.initTrading();
    }
    
    initTrading() {
        this.loadPositions();
        this.setupEventListeners();
        this.startPriceUpdates();
        this.startRegularUpdates();
    }
    
    loadPositions() {
        const data = loadFromStorage();
        this.openPositions = data?.positions || [];
        this.updatePositionsDisplay();
    }
    
    setupEventListeners() {
        // Смена актива
        document.getElementById('assetSelect').addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            if (window.tradingChart) {
                window.tradingChart.switchAsset(this.currentAsset);
            }
            this.updateCurrentPriceDisplay();
            this.updatePositionsDisplay();
        });
        
        // Плечо
        document.querySelectorAll('.lev-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLeverage = parseInt(e.target.dataset.leverage);
            });
        });
        
        // Сумма
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentAmount = parseInt(e.target.dataset.amount);
            });
        });
    }
    
    startPriceUpdates() {
        // Обновление цены каждые 2 секунды
        this.priceUpdateInterval = setInterval(() => {
            if (window.tradingChart) {
                const newPrice = window.tradingChart.updatePrice(this.currentAsset);
                this.updateCurrentPriceDisplay(newPrice);
                this.updatePositionsPnL();
            }
        }, 2000);
    }
    
    startRegularUpdates() {
        // Обновление баланса и ROE каждую секунду
        this.updateInterval = setInterval(() => {
            this.updateBalanceDisplay();
        }, 1000);
    }
    
    updateCurrentPriceDisplay(price = null) {
        if (!window.tradingChart) return;
        
        const currentPrice = price || window.tradingChart.currentPrices[this.currentAsset];
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        
        const prevPrice = parseFloat(priceElement.textContent.replace(/[$,]/g, '')) || currentPrice;
        const changePercent = ((currentPrice - prevPrice) / prevPrice * 100);
        
        // Форматируем цену в зависимости от актива
        let formattedPrice;
        switch(this.currentAsset) {
            case 'BTC':
                formattedPrice = currentPrice.toFixed(2);
                break;
            case 'SHIB':
                formattedPrice = currentPrice.toFixed(8);
                break;
            case 'DOGE':
                formattedPrice = currentPrice.toFixed(6);
                break;
            default:
                formattedPrice = currentPrice.toFixed(2);
        }
        
        priceElement.textContent = `$${formattedPrice}`;
        changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        changeElement.className = changePercent >= 0 ? 'positive' : 'negative';
    }
    
    openPosition(direction) {
        const stopLossInput = document.getElementById('stopLoss');
        const stopLoss = parseFloat(stopLossInput.value) || 5;
        
        const amount = this.currentAmount;
        
        if (amount <= 0) {
            alert('Выберите сумму');
            return;
        }
        
        const data = loadFromStorage();
        const balance = data?.balance || 2000;
        
        if (amount > balance) {
            alert('Недостаточно средств');
            return;
        }
        
        const currentPrice = window.tradingChart ? window.tradingChart.currentPrices[this.currentAsset] : 
            (this.currentAsset === 'BTC' ? 50000 : this.currentAsset === 'SHIB' ? 0.00001 : 0.15);
        
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
            
            // Добавляем точку входа на график
            if (window.tradingChart) {
                window.tradingChart.addEntryPoint(this.currentAsset, currentPrice);
            }
            
            this.updatePositionsDisplay();
            this.updateBalanceDisplay();
            
            alert(`✅ Позиция открыта:\n${direction === 'long' ? 'Лонг' : 'Шорт'} ${this.currentAsset}\nСумма: $${amount}\nПлечо: ${this.currentLeverage}x`);
        }
    }
    
    closePosition() {
        const currentAssetPositions = this.openPositions.filter(p => p.asset === this.currentAsset);
        
        if (currentAssetPositions.length === 0) {
            alert('Нет открытых позиций для этой валюты');
            return;
        }
        
        // Закрываем последнюю позицию
        const position = currentAssetPositions[currentAssetPositions.length - 1];
        this.closeSpecificPosition(position.id);
    }
    
    closeSpecificPosition(positionId) {
        const position = this.openPositions.find(p => p.id === positionId);
        if (!position) return;
        
        const currentPrice = window.tradingChart ? window.tradingChart.currentPrices[position.asset] : position.entryPrice;
        const priceDiff = currentPrice - position.entryPrice;
        
        // Рассчитываем P&L
        let pnl;
        if (position.direction === 'long') {
            // Лонг: прибыль при росте цены
            pnl = priceDiff * position.amount * position.leverage;
        } else {
            // Шорт: прибыль при падении цены
            pnl = -priceDiff * position.amount * position.leverage;
        }
        
        const roe = (pnl / position.amount) * 100;
        
        // Обновляем позицию
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
            window.tradingChart.addExitPoint(position.asset, currentPrice);
        }
        
        // Обновляем интерфейс
        this.updatePositionsDisplay();
        this.updateBalanceDisplay();
        
        alert(`🔒 Позиция закрыта:\nP&L: $${pnl.toFixed(2)}\nROE: ${roe.toFixed(2)}%\nНовый баланс: $${newBalance.toFixed(2)}`);
    }
    
    updatePositionsPnL() {
        if (!window.tradingChart) return;
        
        const currentPrice = window.tradingChart.currentPrices[this.currentAsset];
        
        this.openPositions.forEach(position => {
            if (position.asset === this.currentAsset) {
                const priceDiff = currentPrice - position.entryPrice;
                
                if (position.direction === 'long') {
                    position.pnl = priceDiff * position.amount * position.leverage;
                } else {
                    position.pnl = -priceDiff * position.amount * position.leverage;
                }
                
                position.roe = (position.pnl / position.amount) * 100;
                position.currentPrice = currentPrice;
                
                // Проверка стоп-лосса
                if (position.stopLoss && Math.abs(position.roe) >= position.stopLoss) {
                    this.closeSpecificPosition(position.id);
                }
            }
        });
        
        this.updatePositionsDisplay();
    }
    
    updatePositionsDisplay() {
        const container = document.getElementById('openPositionsList');
        if (!container) return;
        
        const currentAssetPositions = this.openPositions.filter(p => p.asset === this.currentAsset);
        
        if (currentAssetPositions.length === 0) {
            container.innerHTML = '<div class="no-positions">Нет открытых позиций для этой валюты</div>';
            return;
        }
        
        container.innerHTML = currentAssetPositions.map(position => {
            // Определяем формат цены
            let priceFormat = 2;
            switch(position.asset) {
                case 'SHIB': priceFormat = 8; break;
                case 'DOGE': priceFormat = 6; break;
            }
            
            return `
            <div class="position-item" data-id="${position.id}">
                <div class="position-info">
                    <span class="position-asset">${position.asset}</span>
                    <span class="position-direction ${position.direction}">
                        ${position.direction === 'long' ? 'Лонг' : 'Шорт'} ${position.leverage}x
                    </span>
                </div>
                <div class="position-details">
                    <div>Вход: $${position.entryPrice.toFixed(priceFormat)}</div>
                    <div>Текущая: $${position.currentPrice.toFixed(priceFormat)}</div>
                    <div class="position-profit ${position.pnl >= 0 ? 'positive' : 'negative'}">
                        P&L: $${position.pnl.toFixed(2)} (${position.roe.toFixed(2)}%)
                    </div>
                </div>
            </div>
        `}).join('');
    }
    
    updateBalanceDisplay() {
        const data = loadFromStorage();
        const balance = data?.balance || 2000;
        
        document.getElementById('userBalance').textContent = `$${balance.toFixed(2)}`;
        
        // Рассчитываем общий ROE
        const totalPnL = this.openPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalInvested = this.openPositions.reduce((sum, pos) => sum + pos.amount, 0);
        const totalROE = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
        
        document.getElementById('roeDisplay').textContent = `ROE: ${totalROE.toFixed(2)}%`;
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
