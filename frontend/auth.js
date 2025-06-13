document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли уже пользователь
    if (localStorage.getItem('access_token')) {
        window.location.href = '/index.html';
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        
        // Валидация на клиенте
        if (!username || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        try {
            // Показываем состояние загрузки
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'ВХОД...';
            loginBtn.disabled = true;
            
            // Отправляем запрос на авторизацию
            const response = await API.login(username, password);
            
            // Сохраняем токен
            localStorage.setItem('access_token', response.access_token);
            
            // Показываем успешное сообщение
            alert('Вход выполнен успешно!');
            
            // Перенаправляем на страницу квизов
            window.location.href = '/index.html';
            
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            
            // Показываем ошибку пользователю
            let errorMessage = 'Ошибка входа. Попробуйте снова.';
            
            if (error.message.includes('User is not registered')) {
                errorMessage = 'Пользователь не зарегистрирован';
            } else if (error.message.includes('Invalid authentication credentials')) {
                errorMessage = 'Неверный логин или пароль';
            }
            
            alert(errorMessage);
            
        } finally {
            // Восстанавливаем кнопку
            loginBtn.textContent = 'ВОЙТИ';
            loginBtn.disabled = false;
        }
    });
});
