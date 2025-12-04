// Инициализация данных
function initStorage() {
    if (!localStorage.getItem('tradingData')) {
        const initialData = {
            balance: 2000,
            positions: [],
            history: [],
            userData: {
                userId: generateUserId(),
                joinDate: new Date().toISOString()
            },
            market: {
                prices: {
                    BTC: 50000,
                    SHIB: 0.00001,
                    DOGE: 0.15
                },
                volatility: {
                    BTC: 0.02,
                    SHIB: 0.05,
                    DOGE: 0.03
                }
            },
            ranking: []
        };
        localStorage.setItem('tradingData', JSON.stringify(initialData));
    }
}

// Генерация ID пользователя
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Сохранение данных
function saveToStorage(data) {
    try {
        localStorage.setItem('tradingData', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return false;
    }
}

// Загрузка данных
function loadFromStorage() {
    try {
        const data = localStorage.getItem('tradingData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return null;
    }
}

// Сохранение позиции
function savePosition(position) {
    const data = loadFromStorage();
    if (!data) return false;
    
    data.positions.push(position);
    return saveToStorage(data);
}

// Сохранение в историю при закрытии позиции
function saveToHistory(position) {
    const data = loadFromStorage();
    if (!data) return false;
    
    const historyEntry = {
        id: generateId(),
        asset: position.asset,
        direction: position.direction,
        openTime: position.openTime,
        closeTime: new Date().toISOString(),
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        amount: position.amount,
        leverage: position.leverage,
        pnl: position.pnl,
        roe: position.roe
    };
    
    data.history.unshift(historyEntry);
    data.history = data.history.slice(0, 100); // Храним только последние 100 записей
    
    return saveToStorage(data);
}

// Обновление баланса
function updateBalance(newBalance) {
    const data = loadFromStorage();
    if (!data) return false;
    
    data.balance = newBalance;
    
    // Обновление в рейтинге
    const userIndex = data.ranking.findIndex(u => u.id === data.userData.userId);
    if (userIndex !== -1) {
        data.ranking[userIndex].balance = newBalance;
    } else {
        data.ranking.push({
            id: data.userData.userId,
            balance: newBalance
        });
    }
    
    // Сортировка рейтинга
    data.ranking.sort((a, b) => b.balance - a.balance);
    
    return saveToStorage(data);
}

// Генерация ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Очистка данных (для тестирования)
function clearStorage() {
    localStorage.removeItem('tradingData');
    initStorage();
}

// Экспорт функций
window.initStorage = initStorage;
window.loadFromStorage = loadFromStorage;
window.savePosition = savePosition;
window.saveToHistory = saveToHistory;
window.updateBalance = updateBalance;
window.clearStorage = clearStorage;
