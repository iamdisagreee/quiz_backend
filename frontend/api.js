console.log('🚀 api.js НАЧАЛ ЗАГРУЖАТЬСЯ');
// Базовая конфигурация API
const API_BASE_URL = '/api/v1';

// Получение JWT токена из localStorage
function getAuthToken() {
    return localStorage.getItem('access_token');
}

// Общая функция для API запросов
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {},
    };
    
    // Добавляем Authorization header если токен есть
    const token = getAuthToken();
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Если не передан Content-Type и есть body (но не FormData), добавляем JSON
    if (!options.headers?.['Content-Type'] && options.body && !(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, config);
        
        // Если 401 - перенаправляем на авторизацию
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/auth.html';
            return;
        }
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Обработка ошибок валидации (422)
            if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
                const validationErrors = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
                throw new Error(`Ошибка валидации: ${validationErrors}`);
            }
            
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// API методы
const API = {
    // Авторизация
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: formData
        });
    },

    // Регистрация
    async register(username, email, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: formData
        });
    },

    // Подтверждение регистрации
    async confirmRegistration(code, email) {
        const formData = new FormData();
        formData.append('entered_code', code);
        formData.append('email', email);
        
        return await apiRequest('/auth/confirm-register', {
            method: 'PATCH',
            body: formData
        });
    },

    // Отправка кода подтверждения
    async sendConfirmationCode(email) {
        return await apiRequest(`/auth/sending-code?email=${encodeURIComponent(email)}`, {
            method: 'POST'
        });
    },

    // Закрытие окна подтверждения
    async closeConfirmationBox(email) {
        return await apiRequest(`/auth/close-code-confirm-box?email=${encodeURIComponent(email)}`, {
            method: 'DELETE'
        });
    },

    // Получение информации о текущем пользователе
    async getCurrentUser() {
        return await apiRequest('/auth/read-current-user', {
            method: 'GET'
        });
    },
    
    // Создание квиза
    async createQuiz(quizData) {
        return await apiRequest('/quiz/', {
            method: 'POST',
            body: JSON.stringify(quizData)
        });
    },
    
    // Получение квизов пользователя
    async getUserQuizzes() {
        return await apiRequest('/quiz/', {
            method: 'GET'
        });
    }
};
console.log('✅ api.js ЗАГРУЖЕН ПОЛНОСТЬЮ');