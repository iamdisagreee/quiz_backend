document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли уже пользователь
    if (localStorage.getItem('access_token')) {
        window.location.href = '/index.html';
        return;
    }

    // Элементы формы регистрации
    const registerForm = document.getElementById('register-form');
    const regButton = document.getElementById('reg-button');
    
    // Элементы модального окна подтверждения
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.getElementById('close-modal');
    const confirmationCodeInput = document.getElementById('confirmation-code');
    const confirmBtn = document.getElementById('confirm-btn');
    const resendCodeBtn = document.getElementById('resend-code-btn');
    const timer = document.getElementById('timer');
    const countdown = document.getElementById('countdown');
    
    // Элементы модального окна успеха
    const modalSuccess = document.getElementById('modal-success');
    
    // Переменные для таймера
    let resendTimer = null;
    let timeLeft = 60;
    let currentUserEmail = '';

    // Обработчик формы регистрации
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const username = formData.get('username').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        
        // Валидация на клиенте
        if (!username || !email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        if (password.length < 6) {
            alert('Пароль должен содержать минимум 6 символов');
            return;
        }
        
        try {
            // Показываем состояние загрузки
            const originalText = regButton.textContent;
            regButton.textContent = 'РЕГИСТРАЦИЯ...';
            regButton.disabled = true;
            
            // Отправляем запрос на регистрацию
            await API.register(username, email, password);
            
            // Сохраняем email для подтверждения
            currentUserEmail = email;
            
            // Показываем модальное окно подтверждения
            showConfirmationModal();
            
            // Запускаем таймер для повторной отправки
            startResendTimer();
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            
            // Показываем ошибку пользователю
            let errorMessage = 'Ошибка регистрации. Попробуйте снова.';
            
            if (error.message.includes('User already exists')) {
                errorMessage = 'Пользователь с таким логином уже существует';
            } else if (error.message.includes('Email already exists')) {
                errorMessage = 'Пользователь с таким email уже существует';
            }
            
            alert(errorMessage);
            
        } finally {
            // Восстанавливаем кнопку
            regButton.textContent = 'ЗАРЕГИСТРИРОВАТЬСЯ';
            regButton.disabled = false;
        }
    });

    // Обработчик подтверждения кода
    confirmBtn.addEventListener('click', async function() {
        const code = confirmationCodeInput.value.trim();
        
        if (!code) {
            alert('Введите код подтверждения');
            return;
        }
        
        if (code.length !== 6) {
            alert('Код должен состоять из 6 цифр');
            return;
        }
        
        try {
            // Показываем состояние загрузки
            const originalText = confirmBtn.textContent;
            confirmBtn.textContent = 'ПОДТВЕРЖДЕНИЕ...';
            confirmBtn.disabled = true;
            
            // Отправляем код подтверждения
            await API.confirmRegistration(parseInt(code), currentUserEmail);
            
            // Скрываем модальное окно подтверждения
            hideConfirmationModal();
            
            // Показываем модальное окно успеха
            showSuccessModal();
            
            // Останавливаем таймер
            stopResendTimer();
            
        } catch (error) {
            console.error('Ошибка подтверждения:', error);
            
            let errorMessage = 'Ошибка подтверждения. Попробуйте снова.';
            
            if (error.message.includes('Wrong email sent')) {
                errorMessage = 'Неверный email';
            } else if (error.message.includes('Incorrect code entered')) {
                errorMessage = 'Неверный код подтверждения';
            }
            
            alert(errorMessage);
            
        } finally {
            // Восстанавливаем кнопку
            confirmBtn.textContent = 'Подтвердить';
            confirmBtn.disabled = false;
        }
    });

    // Обработчик повторной отправки кода
    resendCodeBtn.addEventListener('click', async function() {
        try {
            // Показываем состояние загрузки
            const originalText = resendCodeBtn.textContent;
            resendCodeBtn.textContent = 'ОТПРАВКА...';
            resendCodeBtn.disabled = true;
            
            // Отправляем код повторно
            await API.sendConfirmationCode(currentUserEmail);
            
            alert('Код отправлен повторно');
            
            // Перезапускаем таймер
            startResendTimer();
            
        } catch (error) {
            console.error('Ошибка повторной отправки:', error);
            alert('Ошибка отправки кода. Попробуйте снова.');
            
        } finally {
            // Восстанавливаем кнопку
            resendCodeBtn.textContent = 'Отправить код повторно';
            resendCodeBtn.disabled = false;
        }
    });

    // Обработчик закрытия модального окна
    closeModal.addEventListener('click', async function() {
        if (confirm('Вы уверены, что хотите отменить регистрацию?')) {
            try {
                // Удаляем неподтвержденного пользователя
                await API.closeConfirmationBox(currentUserEmail);
                
                // Скрываем модальное окно
                hideConfirmationModal();
                
                // Останавливаем таймер
                stopResendTimer();
                
                // Очищаем форму
                registerForm.reset();
                currentUserEmail = '';
                
            } catch (error) {
                console.error('Ошибка отмены регистрации:', error);
                hideConfirmationModal();
            }
        }
    });

    // Обработчик нажатия Enter в поле кода
    confirmationCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    // Функция показа модального окна подтверждения
    function showConfirmationModal() {
        modalOverlay.style.display = 'flex';
        confirmationCodeInput.focus();
    }

    // Функция скрытия модального окна подтверждения
    function hideConfirmationModal() {
        modalOverlay.style.display = 'none';
        confirmationCodeInput.value = '';
    }

    // Функция показа модального окна успеха
    function showSuccessModal() {
        modalSuccess.style.display = 'flex';
    }

    // Функция запуска таймера повторной отправки
    function startResendTimer() {
        timeLeft = 60;
        resendCodeBtn.disabled = true;
        resendCodeBtn.classList.add('disabled');
        timer.style.display = 'block';
        
        resendTimer = setInterval(function() {
            timeLeft--;
            countdown.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                stopResendTimer();
            }
        }, 1000);
    }

    // Функция остановки таймера
    function stopResendTimer() {
        if (resendTimer) {
            clearInterval(resendTimer);
            resendTimer = null;
        }
        
        resendCodeBtn.disabled = false;
        resendCodeBtn.classList.remove('disabled');
        timer.style.display = 'none';
        timeLeft = 60;
    }

    // Закрытие модального окна при клике на overlay
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal.click();
        }
    });
});
