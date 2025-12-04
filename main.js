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
    initChart();
    initTrading();
    initMarketEvents();
    
    // Загрузка истории
    loadHistory();
    
    // Загрузка рейтинга
    loadRanking();
    
    // Настройка вкладок
    setupTabs();
    
    // Автосохранение при закрытии
    setupAutoSave();
    
    // Инициализация интерфейса
    initUI();
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
    
    container.innerHTML = data.history.slice(0, 20).map(entry => `
        <div class="history-item ${entry.pnl >= 0 ? 'positive' : 'negative'}">
            <div>
                <span class="history-asset">${entry.asset}</span>
                <span class="history-direction ${entry.direction}">${entry.direction === 'long' ? 'Лонг' : 'Шорт'} ${entry.leverage}x</span>
            </div>
            <div>
                <span>Открытие: ${new Date(entry.openTime).toLocaleString()}</span>
                <span>Закрытие: ${new Date(entry.closeTime).toLocaleString()}</span>
            </div>
            <div>
                <span>Вход: $${entry.entryPrice.toFixed(2)}</span>
                <span>Выход: $${entry.exitPrice.toFixed(2)}</span>
            </div>
            <div>
                <span>Сумма: $${entry.amount.toFixed(2)}</span>
                <span class="history-pnl ${entry.pnl >= 0 ? 'positive' : 'negative'}">
                    P&L: $${entry.pnl.toFixed(2)} (ROE: ${entry.roe.toFixed(2)}%)
                </span>
            </div>
        </div>
    `).join('');
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

// Настройка автосохранения
function setupAutoSave() {
    // Сохранение при закрытии вкладки
    window.addEventListener('beforeunload', function() {
        const data = loadFromStorage();
        if (data && tradingSystem) {
            data.positions = tradingSystem.openPositions;
            saveToStorage(data);
        }
    });
    
    // Автосохранение каждые 30 секунд
    setInterval(() => {
        const data = loadFromStorage();
        if (data && tradingSystem) {
            data.positions = tradingSystem.openPositions;
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
                // Здесь должна быть интеграция с платежной системой Telegram
                // В демо-версии просто добавляем баланс
                addStarsBalance(1000);
            }
        });
    } else {
        // Для тестирования вне Telegram
        addStarsBalance(1000);
    }
}

// Добавление баланса за Stars
function addStarsBalance(amount) {
    const data = loadFromStorage();
    if (!data) return;
    
    data.balance += amount;
    saveToStorage(data);
    
    if (tradingSystem) {
        tradingSystem.updateBalanceDisplay();
    }
    
    alert(`Баланс пополнен на $${amount.toFixed(2)}`);
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
    
    if (tradingSystem) {
        tradingSystem.updateBalanceDisplay();
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
    
    // Обновление данных каждую секунду
    setInterval(() => {
        if (tradingSystem) {
            tradingSystem.updateBalanceDisplay();
        }
    }, 1000);
}

// Экспорт глобальных функций
window.buyStars = buyStars;
window.restoreAccount = restoreAccount;
