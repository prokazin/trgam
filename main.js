// Основная инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        // Установка цвета темы
        Telegram.WebApp.setBackgroundColor('#0f0f23');
        Telegram.WebApp.setHeaderColor('#1a1a2e');
    }
    
    // Инициализация хранилища
    initStorage();
    
    // Инициализация модулей
    setTimeout(() => {
        initChart();
        initTrading();
        initMarketEvents();
        
        // Загрузка истории и рейтинга
        loadHistory();
        loadRanking();
        
        // Настройка вкладок
        setupTabs();
        
        // Автосохранение при закрытии
        setupAutoSave();
        
        // Инициализация интерфейса
        initUI();
        
        // Показать начальную цену
        if (window.tradingSystem) {
            window.tradingSystem.updateCurrentPriceDisplay();
        }
    }, 100);
});

// Настройка вкладок
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.content-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Обновление активных элементов
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Обновляем контент вкладки
            if (tabName === 'history') {
                loadHistory();
            } else if (tabName === 'ranking') {
                loadRanking();
            }
        });
    });
}

// Загрузка истории сделок
function loadHistory() {
    const data = loadFromStorage();
    const container = document.getElementById('historyList');
    
    if (!container || !data) return;
    
    if (data.history.length === 0) {
        container.innerHTML = '<div class="no-history">История сделок пуста</div>';
        return;
    }
    
    container.innerHTML = data.history.slice(0, 20).map(entry => {
        // Определяем формат цены
        let priceFormat = 2;
        switch(entry.asset) {
            case 'SHIB': priceFormat = 8; break;
            case 'DOGE': priceFormat = 6; break;
        }
        
        const entryPrice = entry.entryPrice || 0;
        const exitPrice = entry.exitPrice || 0;
        const amount = entry.amount || 0;
        const pnl = entry.pnl || 0;
        const roe = entry.roe || 0;
        
        return `
        <div class="history-item ${pnl >= 0 ? 'positive' : 'negative'}">
            <div>
                <span class="history-asset">${entry.asset}</span>
                <span class="history-direction ${entry.direction}">
                    ${entry.direction === 'long' ? 'Лонг' : 'Шорт'} ${entry.leverage}x
                </span>
            </div>
            <div>
                <span class="history-time">${new Date(entry.openTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span class="history-time">${new Date(entry.closeTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div>
                <span>Вход: $${entryPrice.toFixed(priceFormat)}</span>
                <span>Выход: $${exitPrice.toFixed(priceFormat)}</span>
            </div>
            <div>
                <span>Сумма: $${amount.toFixed(2)}</span>
                <span class="history-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                    P&L: $${pnl.toFixed(2)} (ROE: ${roe.toFixed(2)}%)
                </span>
            </div>
        </div>
        `;
    }).join('');
}

// Загрузка рейтинга
function loadRanking() {
    const data = loadFromStorage();
    const container = document.getElementById('rankingList');
    
    if (!container || !data) return;
    
    if (data.ranking.length === 0) {
        container.innerHTML = '<div class="no-ranking">Рейтинг пуст</div>';
        return;
    }
    
    container.innerHTML = data.ranking.slice(0, 20).map((user, index) => {
        const isCurrentUser = user.id === data.userData.userId;
        return `
        <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
            <div>
                <span class="rank">#${index + 1}</span>
                <span class="user-id">${isCurrentUser ? 'Вы' : user.id.substring(0, 8)}</span>
            </div>
            <div class="user-balance">$${user.balance.toFixed(2)}</div>
        </div>
        `;
    }).join('');
}

// Настройка автосохранения
function setupAutoSave() {
    // Сохранение при закрытии вкладки
    window.addEventListener('beforeunload', function() {
        const data = loadFromStorage();
        if (data && window.tradingSystem) {
            data.positions = window.tradingSystem.openPositions;
            saveToStorage(data);
        }
    });
    
    // Автосохранение каждые 30 секунд
    setInterval(() => {
        const data = loadFromStorage();
        if (data && window.tradingSystem) {
            data.positions = window.tradingSystem.openPositions;
            saveToStorage(data);
        }
    }, 30000);
}

// Покупка Stars через Telegram
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

// Добавление баланса за Stars
function addStarsBalance(amount) {
    const data = loadFromStorage();
    if (!data) return;
    
    data.balance += amount;
    saveToStorage(data);
    
    if (window.tradingSystem) {
        window.tradingSystem.updateBalanceDisplay();
    }
    
    alert(`Баланс пополнен на $${amount.toFixed(2)}`);
    loadRanking();
}

// Восстановление после ликвидации
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

// Инициализация интерфейса
function initUI() {
    // Добавление CSS для уведомлений
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
        
        .event-notification {
            font-size: 14px;
        }
        
        .event-notification strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
        }
        
        .event-notification p {
            margin: 0;
            font-size: 12px;
            opacity: 0.9;
        }
        
        .current-user {
            background: #2d2d5a;
            border: 2px solid #00ff88;
        }
        
        .no-positions, .no-history, .no-ranking {
            text-align: center;
            padding: 20px;
            color: #888;
            font-style: italic;
        }
        
        .history-time {
            font-size: 12px;
            color: #888;
        }
    `;
    document.head.appendChild(style);
}

// Экспорт глобальных функций
window.buyStars = buyStars;
window.restoreAccount = restoreAccount;
