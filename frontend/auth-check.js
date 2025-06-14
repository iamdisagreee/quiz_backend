// Функция для получения JWT токена из localStorage
function getAuthToken() {
    return localStorage.getItem('access_token');
}

// Функция для сохранения токена
function setAuthToken(token) {
    localStorage.setItem('access_token', token);
}

// Функция для удаления токена
function removeAuthToken() {
    localStorage.removeItem('access_token');
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
        removeAuthToken();
        window.location.href = 'auth.html';
        return null;
    }
    
    return response;
}

// Функция выхода из системы
function logout() {
    removeAuthToken();
    window.location.href = 'auth.html';
}

// Функция для показа уведомлений
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    
    const baseStyles = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
        cursor: pointer;
        transition: opacity 0.3s ease;
    `;
    
    const typeStyles = {
        error: `
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        `,
        success: `
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        `,
        info: `
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        `
    };
    
    notification.style.cssText = baseStyles + (typeStyles[type] || typeStyles.error);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Убираем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);

    // Добавляем возможность закрыть по клику
    notification.addEventListener('click', () => {
        notification.remove();
    });
}

// Функция для проверки, авторизован ли пользователь
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    
    // Простая проверка валидности токена
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.expire > currentTime;
    } catch (error) {
        console.error('Invalid token format:', error);
        return false;
    }
}
