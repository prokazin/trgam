document.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        Telegram.WebApp.setBackgroundColor('#0f0f23');
        Telegram.WebApp.setHeaderColor('#1a1a2e');
    }
    
    initStorage();
    
    initChart();
    initTrading();
    initMarketEvents();
    
    loadHistory();
    loadRanking();
    
    setupTabs();
    setupAutoSave();
    
    initUI();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.content-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

function loadHistory() {
    const data = loadFromStorage();
    const container = document.getElementById('historyList');
    
    if (!container || !data) return;
    
    if (data.history.length === 0) {
        container.innerHTML = '<div class="no-history">История сделок пуста</div>';
        return;
    }
    
    container.innerHTML = data.history.slice(0, 20).map(entry => {
        const entryPrice = entry.entryPrice || 0;
        const exitPrice = entry.exitPrice || 0;
        const amount = entry.amount || 0;
        const pnl = entry.pnl || 0;
        const roe = entry.roe || 0;
        
        return `
        <div class="history-item ${pnl >= 0 ? 'positive' : 'negative'}">
            <div>
                <span class="history-asset">${entry.asset}</span>
                <span class="history-direction ${entry.direction}">${entry.direction === 'long' ? 'Лонг' : 'Шорт'} ${entry.leverage}x</span>
            </div>
            <div>
                <span>Открытие: ${new Date(entry.openTime).toLocaleString()}</span>
                <span>Закрытие: ${new Date(entry.closeTime).toLocaleString()}</span>
            </div>
            <div>
                <span>Вход: $${entryPrice.toFixed(2)}</span>
                <span>Выход: $${exitPrice.toFixed(2)}</span>
            </div>
            <div>
                <span>Сумма: $${amount.toFixed(2)}</span>
                <span class="history-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                    P&L: $${pnl.toFixed(2)} (ROE: ${roe.toFixed(2)}%)
                </span>
            </div>
        </div>
    `}).join('');
}

function loadRanking() {
    const data = loadFromStorage();
    const container = document.getElementById('rankingList');
    
    if (!container || !data) return;
    
    if (data.ranking.length === 0) {
        container.innerHTML = '<div class="no-ranking">Рейтинг пуст</div>';
        return;
    }
    
    container.innerHTML = data.ranking.slice(0, 20).map((user, index) => `
        <div class="ranking-item ${user.id === data.userData.userId ? 'current-user' : ''}">
            <div>
                <span class="rank">#${index + 1}</span>
                <span class="user-id">${user.id.substring(0, 8)}...</span>
            </div>
            <div class="user-balance">$${user.balance.toFixed(2)}</div>
        </div>
    `).join('');
}

function setupAutoSave() {
    window.addEventListener('beforeunload', function() {
        const data = loadFromStorage();
        if (data && window.tradingSystem) {
            data.positions = window.tradingSystem.openPositions;
            saveToStorage(data);
        }
    });
    
    setInterval(() => {
        const data = loadFromStorage();
        if (data && window.tradingSystem) {
            data.positions = window.tradingSystem.openPositions;
            saveToStorage(data);
        }
    }, 30000);
}

function buyStars() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showPopup({
            title: 'Покупка Stars',
            message: 'Вы будете перенаправлены на покупку Telegram Stars',
            buttons: [
                { type: 'ok', text: 'Купить' },
                { type: 'cancel', text: 'Отмена' }
            ]
        }, function(buttonId) {
            if (buttonId === 'ok') {
                addStarsBalance(1000);
            }
        });
    } else {
        addStarsBalance(1000);
    }
}

function addStarsBalance(amount) {
    const data = loadFromStorage();
    if (!data) return;
    
    data.balance += amount;
    saveToStorage(data);
    
    if (window.tradingSystem) {
        window.tradingSystem.updateBalanceDisplay();
    }
    
    alert(`Баланс пополнен на $${amount.toFixed(2)}`);
}

function restoreAccount() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showPopup({
            title: 'Восстановление аккаунта',
            message: 'Восстановить баланс за 100 Stars?',
            buttons: [
                { type: 'ok', text: 'Восстановить' },
                { type: 'cancel', text: 'Отмена' }
            ]
        }, function(buttonId) {
            if (buttonId === 'ok') {
                restoreBalance();
            }
        });
    } else {
        restoreBalance();
    }
}

function restoreBalance() {
    const data = loadFromStorage();
    if (!data) return;
    
    data.balance = 2000;
    saveToStorage(data);
    
    if (window.tradingSystem) {
        window.tradingSystem.updateBalanceDisplay();
    }
    
    loadRanking();
    alert('Баланс восстановлен до $2,000');
}

function initUI() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .event-notification.positive {
            border-left: 4px solid #00ff88;
        }
        
        .event-notification.negative {
            border-left: 4px solid #ff4444;
        }
        
        .current-user {
            background: #2d2d5a;
            border: 2px solid #00ff88;
        }
    `;
    document.head.appendChild(style);
    
    setInterval(() => {
        if (window.tradingSystem) {
            window.tradingSystem.updateBalanceDisplay();
        }
    }, 1000);
}

window.buyStars = buyStars;
window.restoreAccount = restoreAccount;
