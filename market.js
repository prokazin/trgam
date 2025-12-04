class MarketEvents {
    constructor() {
        this.events = [
            { id: 1, type: 'positive', title: 'Принят биткоин-ETF', description: 'SEC одобрила биткоин-ETF', priceImpact: 0.15, volatilityImpact: 0.05 },
            { id: 2, type: 'positive', title: 'Халвинг биткоина', description: 'Прошел очередной халвинг', priceImpact: 0.12, volatilityImpact: 0.04 },
            { id: 3, type: 'positive', title: 'Крупная инвестиция', description: 'Институциональный инвестор купил биткоин', priceImpact: 0.10, volatilityImpact: 0.03 },
            { id: 4, type: 'positive', title: 'Принятие регуляции', description: 'Принята позитивная регуляция', priceImpact: 0.08, volatilityImpact: 0.02 },
            { id: 5, type: 'positive', title: 'Технологическое обновление', description: 'Важное обновление сети', priceImpact: 0.07, volatilityImpact: 0.03 },
            { id: 6, type: 'positive', title: 'Партнерство', description: 'Крупное партнерство анонсировано', priceImpact: 0.06, volatilityImpact: 0.02 },
            { id: 7, type: 'positive', title: 'Листинг на бирже', description: 'Токен добавлен на крупную биржу', priceImpact: 0.09, volatilityImpact: 0.04 },
            { id: 8, type: 'positive', title: 'Сжигание токенов', description: 'Процедура сжигания токенов', priceImpact: 0.05, volatilityImpact: 0.02 },
            { id: 9, type: 'positive', title: 'Интеграция', description: 'Интеграция с крупным сервисом', priceImpact: 0.04, volatilityImpact: 0.01 },
            { id: 10, type: 'positive', title: 'Позитивные новости', description: 'Позитивные новости в СМИ', priceImpact: 0.03, volatilityImpact: 0.02 },
            { id: 11, type: 'positive', title: 'Увеличение активности', description: 'Рост числа пользователей', priceImpact: 0.02, volatilityImpact: 0.01 },
            { id: 12, type: 'positive', title: 'Технический прорыв', description: 'Важное техническое достижение', priceImpact: 0.06, volatilityImpact: 0.03 },
            { id: 13, type: 'positive', title: 'Кросс-чейн интеграция', description: 'Добавлена кросс-чейн совместимость', priceImpact: 0.05, volatilityImpact: 0.02 },
            { id: 14, type: 'positive', title: 'Геймификация', description: 'Добавлены игровые элементы', priceImpact: 0.03, volatilityImpact: 0.01 },
            { id: 15, type: 'positive', title: 'Стейкинг', description: 'Запущен стейкинг', priceImpact: 0.04, volatilityImpact: 0.02 },
            
            { id: 16, type: 'negative', title: 'Запрет регулятора', description: 'Регулятор запретил криптовалюты', priceImpact: -0.20, volatilityImpact: 0.08 },
            { id: 17, type: 'negative', title: 'Взлом биржи', description: 'Крупная биржа взломана', priceImpact: -0.18, volatilityImpact: 0.07 },
            { id: 18, type: 'negative', title: 'Мошенничество', description: 'Обнаружено крупное мошенничество', priceImpact: -0.15, volatilityImpact: 0.06 },
            { id: 19, type: 'negative', title: 'Технические проблемы', description: 'Критические проблемы в сети', priceImpact: -0.12, volatilityImpact: 0.05 },
            { id: 20, type: 'negative', title: 'Негативные новости', description: 'Негативные публикации в СМИ', priceImpact: -0.10, volatilityImpact: 0.04 },
            { id: 21, type: 'negative', title: 'Крах проекта', description: 'Крупный проект закрылся', priceImpact: -0.08, volatilityImpact: 0.03 },
            { id: 22, type: 'negative', title: 'Проблемы с ликвидностью', description: 'Снижение ликвидности на рынке', priceImpact: -0.07, volatilityImpact: 0.03 },
            { id: 23, type: 'negative', title: 'Скамеры', description: 'Активность скамеров выросла', priceImpact: -0.05, volatilityImpact: 0.02 },
            { id: 24, type: 'negative', title: 'Технический сбой', description: 'Технический сбой в сети', priceImpact: -0.06, volatilityImpact: 0.03 },
            { id: 25, type: 'negative', title: 'Снижение активности', description: 'Снижение числа пользователей', priceImpact: -0.04, volatilityImpact: 0.02 },
            { id: 26, type: 'negative', title: 'Проблемы партнеров', description: 'Проблемы у ключевых партнеров', priceImpact: -0.05, volatilityImpact: 0.02 },
            { id: 27, type: 'negative', title: 'Конкуренция', description: 'Появление сильного конкурента', priceImpact: -0.03, volatilityImpact: 0.01 },
            { id: 28, type: 'negative', title: 'Изменение алгоритма', description: 'Негативные изменения алгоритма', priceImpact: -0.04, volatilityImpact: 0.02 },
            { id: 29, type: 'negative', title: 'Снижение безопасности', description: 'Проблемы с безопасностью', priceImpact: -0.05, volatilityImpact: 0.03 },
            { id: 30, type: 'negative', title: 'Рыночная паника', description: 'Паника на рынке', priceImpact: -0.10, volatilityImpact: 0.05 }
        ];
        
        this.activeEvents = [];
        this.eventInterval = null;
        
        this.initEvents();
    }
    
    initEvents() {
        this.startRandomEvents();
    }
    
    startRandomEvents() {
        // Случайное событие каждые 30-60 секунд
        this.eventInterval = setInterval(() => {
            this.triggerRandomEvent();
        }, 30000 + Math.random() * 30000);
    }
    
    triggerRandomEvent() {
        const randomEvent = this.events[Math.floor(Math.random() * this.events.length)];
        this.activeEvents.push(randomEvent);
        
        this.showEventNotification(randomEvent);
        
        // Удаление события через 30 секунд
        setTimeout(() => {
            this.activeEvents = this.activeEvents.filter(e => e.id !== randomEvent.id);
        }, 30000);
    }
    
    showEventNotification(event) {
        const notification = document.createElement('div');
        notification.className = `event-notification ${event.type}`;
        notification.innerHTML = `
            <strong>${event.type === 'positive' ? '📈' : '📉'} ${event.title}</strong>
            <p>${event.description}</p>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${event.type === 'positive' ? '#1a3a1a' : '#3a1a1a'};
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            border-left: 4px solid ${event.type === 'positive' ? '#00ff88' : '#ff4444'};
        `;
        
        document.body.appendChild(notification);
        
        // Удаление через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

let marketEvents = null;

function initMarketEvents() {
    marketEvents = new MarketEvents();
    return marketEvents;
}

window.initMarketEvents = initMarketEvents;
window.MarketEvents = MarketEvents;
