const registrationForm = document.getElementById('registration-form');
    const regButton = document.getElementById('reg-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.getElementById('close-modal');
    const timerDisplay = document.getElementById('timer');
    const codeMessage = document.getElementById('code-message');
    const emailInput = document.getElementById('register-email');
    let timerDuration = 120; // 2 минуты в секундах
    let timerInterval;

    // Перехватываем отправку формы регистрации
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Здесь можно выполнить предварительную отправку данных на сервер для отправки письма
      // Если сервер вернул успех, открываем модальное окно для ввода кода
      openModal();
    });

    function openModal() {
      codeMessage.textContent = `Мы отправили код подтверждения на почту ${emailInput.value}`;
      modalOverlay.style.display = 'flex';
    }

    function closeModalWindow() {
      modalOverlay.style.display = 'none';
      startTimer();
    }

    // Закрытие модального окна по клику на крестик
    closeModal.addEventListener('click', function() {
      closeModalWindow();
    });

    // Обработка отправки кода из модального окна
    const codeForm = document.getElementById('code-form');
    codeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailCode = document.getElementById('email-code').value;
      // Здесь можно отправить данные (регистрационные поля + код) на сервер через fetch
      // Пример (условно):
      const formData = {
        username: document.getElementById('register-username').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        email_code: emailCode
      };

      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка регистрации');
        }
        return response.json();
      })
      .then(data => {
        // Предполагается, что успешный ответ приведёт к перенаправлению на страницу входа
        window.location.href = "/auth.html"; // или нужный URL страницы входа
      })
      .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка. Попробуйте ещё раз.');
      });
    });

    // Таймер в случае, если пользователь закроет модальное окно
    function startTimer() {
      // Блокируем кнопку регистрации
      regButton.disabled = true;
      regButton.classList.add('disabled');
      timerDisplay.style.display = 'block';
      timerDisplay.innerText = `Повторная отправка кода через ${timerDuration} сек.`;

      timerInterval = setInterval(() => {
        timerDuration--;
        timerDisplay.innerText = `Повторная отправка кода через ${timerDuration} сек.`;
        if (timerDuration <= 0) {
          clearInterval(timerInterval);
          timerDisplay.style.display = 'none';
          regButton.disabled = false;
          regButton.classList.remove('disabled');
          // Сбрасываем таймер на первоначальное значение для будущих попыток
          timerDuration = 120;
          // При повторном нажатии на кнопку "Подтвердить" модальное окно будет открываться снова
        }
      }, 1000);
    }