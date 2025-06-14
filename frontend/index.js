console.log('🚀 index.js НАЧАЛ ЗАГРУЖАТЬСЯ');
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен из index.js');
    
    // Элементы DOM
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;
    
    // Элементы для переключения контента
    const guestContent = document.getElementById('guest-content');
    const userContent = document.getElementById('user-content');
    const guestButtons = document.getElementById('guest-buttons');
    const userButtons = document.getElementById('user-buttons');
    const authNav = document.getElementById('auth-nav');
    const mobileGuestMenu = document.getElementById('mobile-guest-menu');
    const mobileUserMenu = document.getElementById('mobile-user-menu');
    
    // Элементы пользовательского меню
    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const usernameDisplay = document.getElementById('username-display');
    const userWelcomeName = document.getElementById('user-welcome-name');
    
    // Элементы статистики
    const createdCount = document.getElementById('created-count');
    const completedCount = document.getElementById('completed-count');
    const averageScore = document.getElementById('average-score');

    // Инициализация при загрузке
    initializePage();

    // Обработчики бургер-меню с проверками
    if (burgerMenu) {
        burgerMenu.addEventListener('click', function() {
            body.classList.toggle('menu-open');
        });
        console.log('✅ Обработчик burgerMenu добавлен');
    } else {
        console.log('⚠️ burgerMenu не найден');
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            body.classList.remove('menu-open');
        });
        console.log('✅ Обработчик overlay добавлен');
    } else {
        console.log('⚠️ overlay не найден');
    }

    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('menu-open');
        });
    });

    // Обработчик пользовательского меню
    if (userMenuToggle) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (userDropdown) {
                userDropdown.classList.toggle('show');
            }
        });
    }

    // Закрытие выпадающего меню при клике вне его
    document.addEventListener('click', function() {
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
    });

    // Основная функция инициализации
    async function initializePage() {
        console.log('🚀 Инициализация страницы...');
        
        const token = localStorage.getItem('access_token');
        console.log('🔑 Токен в localStorage:', token ? 'найден' : 'не найден');
        
        if (!token) {
            console.log('❌ Токен отсутствует, показываем гостевой контент');
            showGuestContent();
            return;
        }

        try {
            // Проверяем валидность токена
            console.log('🔍 Проверяем валидность токена...');
            if (!isTokenValid(token)) {
                console.log('❌ Токен невалидный или истек');
                localStorage.removeItem('access_token');
                showGuestContent();
                return;
            }
            console.log('✅ Токен валидный');

            // Получаем данные пользователя
            console.log('👤 Получаем данные пользователя...');
            const userData = await API.getCurrentUser();
            console.log('✅ Данные пользователя получены:', userData);
            
            // Показываем контент для авторизованных
            showUserContent(userData);
            
            // Загружаем статистику
            console.log('📊 Загружаем статистику...');
            loadUserStats();
            
        } catch (error) {
            console.error('❌ Ошибка при загрузке данных пользователя:', error);
            // НЕ удаляем токен при ошибке API, показываем базовый авторизованный контент
            
            // Пробуем показать авторизованный контент с базовыми данными
            try {
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                showUserContent({
                    User: {
                        username: tokenPayload.username || 'Пользователь'
                    }
                });
                console.log('✅ Показан авторизованный контент с данными из токена');
            } catch (tokenError) {
                console.error('❌ Ошибка парсинга токена:', tokenError);
                localStorage.removeItem('access_token');
                showGuestContent();
            }
        }
    }

    // Показать контент для неавторизованных пользователей
    function showGuestContent() {
        console.log('👻 Показываем гостевой контент');
        
        // Показываем гостевой контент
        if (guestContent) guestContent.classList.remove('hidden');
        if (guestButtons) guestButtons.classList.remove('hidden');
        if (mobileGuestMenu) mobileGuestMenu.classList.remove('hidden');
        
        // Скрываем пользовательский контент
        if (userContent) userContent.classList.add('hidden');
        if (userButtons) userButtons.classList.add('hidden');
        if (authNav) authNav.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
    }

    // Показать контент для авторизованных пользователей
    function showUserContent(userData) {
        console.log('👤 Показываем пользовательский контент');
        
        // Скрываем гостевой контент
        if (guestContent) guestContent.classList.add('hidden');
        if (guestButtons) guestButtons.classList.add('hidden');
        if (mobileGuestMenu) mobileGuestMenu.classList.add('hidden');
        
        // Показываем пользовательский контент
        if (userContent) userContent.classList.remove('hidden');
        if (userButtons) userButtons.classList.remove('hidden');
        if (authNav) authNav.classList.remove('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
        
        // Обновляем имя пользователя
        if (userData && userData.User) {
            const username = userData.User.username;
            if (usernameDisplay) usernameDisplay.textContent = username;
            if (userWelcomeName) userWelcomeName.textContent = username;
            console.log('✅ Имя пользователя обновлено:', username);
        }
    }

    // Проверка валидности токена
    function isTokenValid(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            console.log('🕐 Время токена:', new Date(payload.expire * 1000));
            console.log('🕐 Текущее время:', new Date(currentTime * 1000));
            console.log('⏰ Токен истекает через:', Math.floor((payload.expire - currentTime) / 60), 'минут');
            
            return payload.expire > currentTime;
        } catch (error) {
            console.error('❌ Ошибка проверки токена:', error);
            return false;
        }
    }

    // Загрузка статистики пользователя
    async function loadUserStats() {
        try {
            console.log('📊 Запрашиваем статистику...');
            const response = await fetch('/api/v1/users/me/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                console.log('✅ Статистика получена:', stats);
                updateStatsDisplay(stats);
            } else {
                console.log('⚠️ Статистика недоступна, статус:', response.status);
                updateStatsDisplay({
                    countCreated: 0,
                    countCompleted: 0,
                    percentage: 0
                });
            }
        } catch (error) {
            console.log('⚠️ Ошибка загрузки статистики:', error);
            // Показываем значения по умолчанию
            updateStatsDisplay({
                countCreated: 0,
                countCompleted: 0,
                percentage: 0
            });
        }
    }

    // Обновление отображения статистики
    function updateStatsDisplay(stats) {
        if (createdCount) {
            createdCount.textContent = stats.countCreated || 0;
            console.log('📊 Создано квизов:', stats.countCreated || 0);
        }
        if (completedCount) {
            completedCount.textContent = stats.countCompleted || 0;
            console.log('📊 Пройдено квизов:', stats.countCompleted || 0);
        }
        if (averageScore) {
            averageScore.textContent = (stats.percentage || 0) + '%';
            console.log('📊 Средний балл:', (stats.percentage || 0) + '%');
        }
    }

    // Функция выхода (глобальная)
    window.logout = function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            console.log('👋 Выход из системы');
            localStorage.removeItem('access_token');
            location.reload(); // Перезагружаем страницу для сброса состояния
        }
    };
});
console.log('✅ index.js ЗАГРУЖЕН ПОЛНОСТЬЮ');
