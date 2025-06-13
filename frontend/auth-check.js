// Список страниц, не требующих авторизации
const PUBLIC_PAGES = [
    '/index.html',
    '/auth.html', 
    '/register.html',
    '/',
    ''
];

// Функция проверки авторизации
function checkAuth() {
    const currentPage = window.location.pathname;
    const token = localStorage.getItem('access_token');
    
    // Если страница публичная, авторизация не нужна
    if (PUBLIC_PAGES.includes(currentPage)) {
        return;
    }
    
    // Если нет токена, перенаправляем на авторизацию
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }
    
    // Можно добавить проверку валидности токена
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.expire < currentTime) {
            // Токен истек
            localStorage.removeItem('access_token');
            window.location.href = '/auth.html';
            return;
        }
    } catch (error) {
        // Токен поврежден
        localStorage.removeItem('access_token');
        window.location.href = '/auth.html';
        return;
    }
}

// Функция выхода из системы
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/index.html';
}

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', checkAuth);
