// Функция для получения JWT токена из localStorage
function getAuthToken() {
    return localStorage.getItem('access_token');
}

// Функция для проверки авторизации и редиректа
function checkAuthAndRedirect() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Функция для выполнения авторизованного запроса
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const response = await fetch(url, mergedOptions);
    
    // Если токен недействителен, редиректим на авторизацию
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = 'auth.html';
        return null;
    }
    
    return response;
}

document.addEventListener("DOMContentLoaded", async () => {
    // Проверяем авторизацию
    if (!checkAuthAndRedirect()) {
        return;
    }

    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');

    // Исправляем селекторы для статистики
    const countCreatedEl = document.querySelector('.profile-statistics p:nth-child(2) span');
    const countCompletedEl = document.querySelector('.profile-statistics p:nth-child(3) span');
    const percentageEl = document.querySelector('.profile-statistics p:nth-child(4) span');

    const profileImageNameEl = document.querySelector('.profile-image-name');

    try {
        // Загружаем данные пользователя с API
        const response = await fetchWithAuth('/api/v1/users/me/stats');
        
        if (!response || !response.ok) {
            throw new Error('Ошибка загрузки данных пользователя');
        }
        
        const data = await response.json();
        
        // Заполняем поля
        if (usernameEl) usernameEl.value = data.username;
        if (emailEl) emailEl.value = data.email;

        if (countCreatedEl) countCreatedEl.textContent = data.countCreated;
        if (countCompletedEl) countCompletedEl.textContent = data.countCompleted;
        if (percentageEl) percentageEl.textContent = `${data.percentage}%`;

        // Имя пользователя в аватарке
        if (profileImageNameEl && data.username) {
            profileImageNameEl.textContent = data.username.charAt(0).toUpperCase();
        }

        console.log('Данные пользователя загружены:', data);

    } catch (error) {
        console.error('Не удалось загрузить данные пользователя:', error);

        // Показываем fallback данные при ошибке
        if (countCreatedEl) countCreatedEl.textContent = '—';
        if (countCompletedEl) countCompletedEl.textContent = '—';
        if (percentageEl) percentageEl.textContent = '—%';
        
        // Показываем сообщение об ошибке пользователю
        showErrorMessage('Не удалось загрузить данные профиля. Попробуйте обновить страницу.');
    }
});

// Функция для показа сообщений об ошибках
function showErrorMessage(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Убираем уведомление через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);

    // Добавляем возможность закрыть по клику
    notification.addEventListener('click', () => {
        notification.remove();
    });
}

// Обработка бургер-меню (оставляем как было)
document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const body = document.body;

    if (burgerMenu) {
        burgerMenu.addEventListener('click', function() {
            body.classList.toggle('menu-open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            body.classList.remove('menu-open');
        });
    }

    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            body.classList.remove('menu-open');
        });
    });
});

// Функция выхода из системы
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = 'auth.html';
}

// Добавляем обработчик для кнопки выхода (если будет нужна)
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});
