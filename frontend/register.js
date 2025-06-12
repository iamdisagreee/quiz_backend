const registrationForm = document.getElementById('registration-form');
    const regButton = document.getElementById('reg-button');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.getElementById('close-modal');
    const timerDisplay = document.getElementById('timer');
    const codeMessage = document.getElementById('code-message');
    const emailInput = document.getElementById('register-email');
    const modalSuccess = document.getElementById('modal-success');
    const codeForm = document.getElementById('code-form');
    const resendBtn = document.getElementById('resend-code-btn');
    const countdownElement = document.getElementById('countdown');
    let timerInterval;
    let countdown = 10;
    let countdownInterval;

    // Перехватываем отправку формы регистрации
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Здесь можно выполнить предварительную отправку данных на сервер для отправки письма
      // Если сервер вернул успех, открываем модальное окно для ввода кода
      resetCountdown();
      openModal();
    });

    function openModal() {
      codeMessage.textContent = `Мы отправили код подтверждения на почту ${emailInput.value}`;
      modalOverlay.style.display = 'flex';
    }

    function closeModalWindow() {
      clearInterval(countdownInterval);
      modalOverlay.style.display = 'none';
    }

    function openModalSuccess(){
      modalSuccess.style.display = 'flex';
    }

    // Закрытие модального окна по клику на крестик
    closeModal.addEventListener('click', function() {
      closeModalWindow();
    });

    codeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailCode = document.getElementById('email-code').value;
      
      if (emailCode == '1410') {
         closeModalWindow();
         openModalSuccess();
      }
      else {
        alert("Try again");
        document.getElementById('email-code').value = "";
      }
    });    
    
    // Обработчик клика по кнопке
    resendBtn.addEventListener('click', function() {
      if (this.classList.contains('disabled')) return;
      // Сбрасываем отсчет
      resetCountdown();
    });
    
    function startCountdown() {
      countdown = 10;
      countdownElement.textContent = "(" + countdown + ")";
      updateButtonState();
      
      countdownInterval = setInterval(function() {
        countdown--;
        countdownElement.textContent = "(" + countdown + ")";
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          updateButtonState();
        }
      }, 1000);
    }
    
    function resetCountdown() {
      clearInterval(countdownInterval);
      startCountdown();
      resendBtn.classList.add('disabled');
      resendBtn.disabled = true;
    }
    
    function updateButtonState() {
      if (countdown <= 0) {
        resendBtn.classList.remove('disabled');
        resendBtn.disabled = false;
        countdownElement.textContent = '';
      } else {
        resendBtn.classList.add('disabled');
        resendBtn.disabled = true;
      }
    }