document.addEventListener('DOMContentLoaded', function() {
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  const body = document.body;

  burgerMenu.addEventListener('click', function() {
    body.classList.toggle('menu-open');
  });

  overlay.addEventListener('click', function() {
    body.classList.remove('menu-open');
  });

  // Закрытие меню при клике на ссылку
  document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('menu-open');
    });
  });
});

let localQuizzes = {};

    // Загружаем данные из JSON-файла при загрузке страницы
    fetch('./quiz-data.json')
      .then(response => response.json())
      .then(data => {
        localQuizzes = data;
      })
      .catch(error => {
        console.log('Ошибка загрузки данных:', error);
      });

    // Функция для поиска квиза по коду
    document.getElementById('find-quiz-btn').addEventListener('click', function() {
    const quizCode = document.getElementById('quiz-code').value.trim();
    if (!quizCode) {
      showError('Пожалуйста, введите код квиза');
      return;
    }
    
    const quiz = Object.values(localQuizzes).find(q => q.code === quizCode);
    
    if (!quiz) {
      showError('Квиз с таким кодом не найден');
      return;
    }
    showError("");
      
      // Отобразить информацию о квизе
      document.getElementById('quiz-title').textContent = quiz.title;
      document.getElementById('quiz-description').textContent = quiz.description || 'Без описания';
      document.getElementById('questions-value').textContent = quiz.questions.length;
      
      if (quiz.settings.timerEnabled) {
        document.getElementById('timer-value').textContent = formatTime(quiz.settings.timerValue);
      } else {
        document.getElementById('timer-value').textContent = 'Не ограничено';
      }
      
      // Сохраняем данные квиза
      window.quizData = quiz;
      
      // Показываем информацию о квизе
      document.getElementById('code-entry-form').classList.add('hidden');
      document.getElementById('quiz-info').classList.remove('hidden');
    });
    
    // Функция для начала квиза
    document.getElementById('start-quiz-btn').addEventListener('click', function() {
      document.getElementById('quiz-info').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');
      
      // Инициализация квиза
      initializeQuiz(window.quizData);
    });
    
    // Функция для отображения ошибок
    function showError(message) {
      const errorEl = document.getElementById('error-message');
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
    
    // Функция для форматирования времени
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    }
    
    // Функция для инициализации квиза
    function initializeQuiz(quiz) {
      // Настройка общего состояния квиза
      const totalQuestions = quiz.questions.length;
      document.getElementById('total-questions').textContent = totalQuestions;
      window.currentQuestionIndex = 0;
      window.userAnswers = new Array(totalQuestions).fill('');
      
      // Если включен таймер, запускаем его
      if (quiz.settings.timerEnabled) {
        startTimer(quiz.settings.timerValue);
      }
      
      // Отображаем первый вопрос
      showQuestion(0);
      
      // Обработчики навигации по вопросам
      document.getElementById('next-question-btn').addEventListener('click', function() {
        saveCurrentAnswer();
        
        if (window.currentQuestionIndex < totalQuestions - 1) {
          showQuestion(window.currentQuestionIndex + 1);
        }
      });
      
      document.getElementById('prev-question-btn').addEventListener('click', function() {
        saveCurrentAnswer();
        
        if (window.currentQuestionIndex > 0) {
          showQuestion(window.currentQuestionIndex - 1);
        }
      });
      
      // Обработчик завершения квиза
      document.getElementById('finish-quiz-btn').addEventListener('click', function() {
        saveCurrentAnswer();
        showConfirmationModal()
      });
    }

    // Показ модального окна завершения квиза
    function showConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        modal.classList.remove('hidden');
        
        // Обработчики для кнопок
        document.getElementById('confirm-submit').onclick = function() {
        modal.classList.add('hidden');
        submitQuiz();
        };
        
        document.getElementById('cancel-submit').onclick = function() {
        modal.classList.add('hidden');
        };
    }
    
    // Функция для отображения текущего вопроса
    function showQuestion(index) {
      const quiz = window.quizData;
      const question = quiz.questions[index];
      
      // Обновляем индекс текущего вопроса
      window.currentQuestionIndex = index;
      
      // Обновляем номер вопроса и прогресс
      document.getElementById('current-question').textContent = index + 1;
      const progressPercent = Math.round(((index + 1) / quiz.questions.length) * 100);
      document.getElementById('progress-value').textContent = `${progressPercent}%`;
      document.getElementById('progress-bar').style.width = `${progressPercent}%`;
      
      // Устанавливаем текст вопроса
      document.getElementById('question-text').textContent = question.text;
      
      // Показываем или скрываем соответствующие блоки для ответа
      const textAnswerBlock = document.getElementById('text-answer-block');
      const optionsBlock = document.getElementById('options-block');
      
      if (question.hasOptions) {
        textAnswerBlock.classList.add('hidden');
        optionsBlock.classList.remove('hidden');
        optionsBlock.classList.add("option-block-margin");
        optionsBlock.innerHTML = ''; // Очищаем старые варианты
        
        // Добавляем варианты ответов
        question.options.forEach((option, optIndex) => {
          const optionId = `option-${optIndex}`;
          const optionDiv = document.createElement('div');
          optionDiv.classList.add('option-margin');
          optionDiv.innerHTML = `
            <input type="radio" id="${optionId}" name="question-option" value="${option}" 
                   ${window.userAnswers[index] === option ? 'checked' : ''}>
            <label for="${optionId}">${option}</label>
          `;
          optionsBlock.appendChild(optionDiv);
        });
      } else {
        optionsBlock.classList.add('hidden');
        textAnswerBlock.classList.remove('hidden');
        document.getElementById('text-answer-input').value = window.userAnswers[index] || '';
      }
      
      // Управление кнопками навигации
      document.getElementById('prev-question-btn').disabled = index === 0;
      
      if (index === quiz.questions.length - 1) {
        document.getElementById('next-question-btn').classList.add('hidden');
        document.getElementById('finish-quiz-btn').classList.remove('hidden');
      } else {
        document.getElementById('next-question-btn').classList.remove('hidden');
        document.getElementById('finish-quiz-btn').classList.add('hidden');
      }
    }
    
    // Функция для сохранения ответа на текущий вопрос
    function saveCurrentAnswer() {
      const index = window.currentQuestionIndex;
      const question = window.quizData.questions[index];
      
      if (question.hasOptions) {
        const selectedOption = document.querySelector('input[name="question-option"]:checked');
        window.userAnswers[index] = selectedOption ? selectedOption.value : '';
      } else {
        window.userAnswers[index] = document.getElementById('text-answer-input').value.trim();
      }
    }
    
    // Функция для запуска таймера
    function startTimer(seconds) {
      const timerBlock = document.getElementById('timer-block');
      const countdownEl = document.getElementById('countdown');
      countdownEl.textContent = formatTime(seconds);
      const progressBar = document.getElementById('timer-progress');
      
      timerBlock.classList.remove('hidden');
      let timeLeft = seconds;
      const totalTime = seconds;
      
      window.quizTimer = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = formatTime(timeLeft);
        const percent = (timeLeft / totalTime) * 100;
        progressBar.style.width = `${percent}%`;
        
        // Изменение цвета в зависимости от оставшегося времени
        if (percent < 25) {
          progressBar.classList.remove('bg-blue-600', 'bg-yellow-500');
          progressBar.classList.add('bg-red-500');
        } else if (percent < 50) {
          progressBar.classList.remove('bg-blue-600', 'bg-red-500');
          progressBar.classList.add('bg-yellow-500');
        }
        
        if (timeLeft <= 0) {
          clearInterval(window.quizTimer);
          submitQuiz(true); // Автоматическая отправка при истечении времени
        }
      }, 1000);
    }
    
    // Функция для отправки результатов квиза
    function submitQuiz(timeExpired = false) {
      // Останавливаем таймер, если он запущен
      if (window.quizTimer) {
        clearInterval(window.quizTimer);
      }
      
      // Формируем данные для отправки
      const submissionData = {
        quizId: window.quizData.id,
        answers: window.userAnswers.map((answer, index) => ({
          questionId: window.quizData.questions[index].id,
          answer: answer
        })),
        timeExpired: timeExpired
      };
      
      // Отправляем результаты на сервер
      fetch('/api/quiz-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })
      .then(response => {
        if (!response.ok) throw new Error('Ошибка при отправке результатов');
        return response.json();
      })
      .then(data => {
        // Показываем сообщение о завершении
        document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('completion-message').classList.remove('hidden');
      })
      .catch(error => {
        console.error('Ошибка:', error);
        /* alert('Произошла ошибка при отправке результатов. Пожалуйста, попробуйте еще раз.'); */
         document.getElementById('quiz-container').classList.add('hidden');
        document.getElementById('completion-message').classList.remove('hidden');
      });
    }