// Функция для получения JWT токена
function getAuthToken() {
  return localStorage.getItem('access_token');
}

// Функция для проверки авторизации
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

  const response = await fetch(`/api/v1${url}`, mergedOptions);

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'auth.html';
    return null;
  }

  return response;
}

// Глобальные переменные
window.quizData = null;
window.currentQuestionIndex = -1;
window.userAnswers = [];
window.quizTimer = null;
window.gameId = null;
window.hasTimer = false;
window.quizCompleted = false;

document.addEventListener('DOMContentLoaded', function () {
  // Проверяем авторизацию при загрузке страницы
  if (!checkAuthAndRedirect()) {
    return;
  }

  // Инициализация мобильного меню
  initializeMobileMenu();

  // Инициализация всех обработчиков
  initializeEventHandlers();
});

function initializeMobileMenu() {
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  const body = document.body;

  if (burgerMenu && mobileMenu && overlay) {
    burgerMenu.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });

    overlay.addEventListener('click', function () {
      body.classList.remove('menu-open');
    });

    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.mobile-menu a').forEach(link => {
      link.addEventListener('click', () => {
        body.classList.remove('menu-open');
      });
    });
  }
}

function initializeEventHandlers() {
  // Поиск квиза
  const findQuizBtn = document.getElementById('find-quiz-btn');
  if (findQuizBtn) {
    findQuizBtn.addEventListener('click', handleFindQuiz);
  }

  // Enter в поле кода
  const quizCodeInput = document.getElementById('quiz-code');
  if (quizCodeInput) {
    quizCodeInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        handleFindQuiz();
      }
    });
  }

  // Начало квиза
  const startQuizBtn = document.getElementById('start-quiz-btn');
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', handleStartQuiz);
  }

  // Навигация по вопросам - глобальные обработчики
  const nextBtn = document.getElementById('next-question-btn');
  const prevBtn = document.getElementById('prev-question-btn');
  const finishBtn = document.getElementById('finish-quiz-btn');

  if (nextBtn) {
    nextBtn.addEventListener('click', handleNextQuestion);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', handlePrevQuestion);
  }

  if (finishBtn) {
    finishBtn.addEventListener('click', handleFinishQuiz);
  }
}

async function handleFindQuiz() {
  const quizCode = document.getElementById('quiz-code').value.trim();
  const findQuizBtn = document.getElementById('find-quiz-btn');

  if (!quizCode) {
    showError('Пожалуйста, введите код квиза');
    return;
  }

  // Показываем состояние загрузки
  const originalText = findQuizBtn.textContent;
  findQuizBtn.textContent = 'Поиск...';
  findQuizBtn.disabled = true;

  try {
    const response = await fetchWithAuth(`/quizzes/by-code/${quizCode}`);

    if (!response || !response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Квиз с таким кодом не найден');
    }

    const quiz = await response.json();
    showError(""); // Очищаем ошибки

    // Отображаем информацию о квизе
    document.getElementById('quiz-title').textContent = quiz.title || 'Без названия';
    document.getElementById('quiz-description').textContent = quiz.description || 'Без описания';
    document.getElementById('questions-value').textContent = quiz.questions ? quiz.questions.length : 0;

    // Исправляем отображение времени (timer_value в минутах, конвертируем в секунды для отображения)
    if (quiz.settings && quiz.settings.timerEnabled && quiz.settings.timerValue > 0) {
      const timeInSeconds = quiz.settings.timerValue * 60;
      document.getElementById('timer-value').textContent = formatTime(timeInSeconds);
    } else {
      document.getElementById('timer-value').textContent = 'Не ограничено';
    }

    // Сохраняем данные квиза
    window.quizData = quiz;

    // Показываем информацию о квизе
    document.getElementById('code-entry-form').classList.add('hidden');
    document.getElementById('quiz-info').classList.remove('hidden');

  } catch (error) {
    console.error('Ошибка поиска квиза:', error);
    showError(error.message || 'Ошибка при поиске квиза');
  } finally {
    findQuizBtn.textContent = originalText;
    findQuizBtn.disabled = false;
  }
}

function handleStartQuiz() {
  document.getElementById('quiz-info').classList.add('hidden');
  document.getElementById('quiz-container').classList.remove('hidden');

  // Инициализация квиза
  initializeQuiz(window.quizData);
}

function handleNextQuestion() {
  saveCurrentAnswer();
  const totalQuestions = window.quizData.questions.length;

  if (window.currentQuestionIndex < totalQuestions - 1) {
    showQuestion(window.currentQuestionIndex + 1);
  }
}

function handlePrevQuestion() {
  saveCurrentAnswer();

  if (window.currentQuestionIndex > 0) {
    showQuestion(window.currentQuestionIndex - 1);
  }
}

function handleFinishQuiz() {
  saveCurrentAnswer();
  showConfirmationModal();
}

// Функция для отображения ошибок
function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    if (message) {
      errorEl.classList.remove('hidden');
    } else {
      errorEl.classList.add('hidden');
    }
  }
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
  const totalQuestions = quiz.questions ? quiz.questions.length : 0;
  document.getElementById('total-questions').textContent = totalQuestions;
  window.currentQuestionIndex = 0;
  window.userAnswers = new Array(totalQuestions).fill(null);

  // Сохраняем ID игры если есть
  if (quiz.gameId) {
    window.gameId = quiz.gameId;
  }

  // Проверяем, есть ли таймер
  window.hasTimer = quiz.settings && quiz.settings.timerEnabled && quiz.settings.timerValue > 0;

  // Если включен таймер, запускаем его (конвертируем минуты в секунды)
  if (window.hasTimer) {
    startTimer(quiz.settings.timerValue * 60);
  }

  // Отображаем первый вопрос
  showQuestion(0);
}

// Показ модального окна завершения квиза
function showConfirmationModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.classList.remove('hidden');

    // Обработчики для кнопок
    const confirmBtn = document.getElementById('confirm-submit');
    const cancelBtn = document.getElementById('cancel-submit');

    if (confirmBtn) {
      confirmBtn.onclick = function () {
        modal.classList.add('hidden');
        submitQuiz();
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = function () {
        modal.classList.add('hidden');
      };
    }
  }
}

// Функция для отображения текущего вопроса
function showQuestion(index) {
  const quiz = window.quizData;

  if (!quiz || !quiz.questions || !quiz.questions[index]) {
    console.error('Вопрос не найден:', index);
    return;
  }

  const question = quiz.questions[index];
  console.log('Показываем вопрос:', index, question); // Для отладки

  // Обновляем индекс текущего вопроса
  window.currentQuestionIndex = index;

  // Обновляем номер вопроса
  document.getElementById('current-question').textContent = index + 1;

  // Если есть таймер, время будет отображаться в progress-value, иначе показываем прогресс
  if (!window.hasTimer) {
    document.getElementById('progress-value').textContent = `Вопрос ${index + 1} из ${quiz.questions.length}`;
  }

  const progressPercent = Math.round(((index + 1) / quiz.questions.length) * 100);
  document.getElementById('progress-bar').style.width = `${progressPercent}%`;

  // Устанавливаем текст вопроса
  document.getElementById('question-text').textContent = question.text || 'Текст вопроса отсутствует';

  // Показываем или скрываем соответствующие блоки для ответа
  const textAnswerBlock = document.getElementById('text-answer-block');
  const optionsBlock = document.getElementById('options-block');

  if (question.type === 'text') {
    // Текстовый вопрос
    if (textAnswerBlock) textAnswerBlock.classList.remove('hidden');
    if (optionsBlock) optionsBlock.classList.add('hidden');

    const textInput = document.getElementById('text-answer-input');
    if (textInput) {
      textInput.value = window.userAnswers[index] || '';
    }
  } else {
    // Вопрос с вариантами ответов
    if (textAnswerBlock) textAnswerBlock.classList.add('hidden');
    if (optionsBlock) {
      optionsBlock.classList.remove('hidden');
      optionsBlock.classList.add("option-block-margin");
      optionsBlock.innerHTML = ''; // Очищаем старые варианты

      // Проверяем наличие options
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        // Добавляем варианты ответов
        question.options.forEach((option, optIndex) => {
          const optionId = `option-${optIndex}`;
          const optionDiv = document.createElement('div');
          optionDiv.classList.add('option-margin');
          if (question.type === 'single_choice') {
            optionDiv.innerHTML = `
                <input type="radio" id="${optionId}" name="question-option" value="${optIndex}"
                        ${window.userAnswers[index] == optIndex ? 'checked' : ''}>
                <label for="${optionId}">${option}</label>
            `;
          } else if (question.type === 'multiple_choice') {
            const isChecked = Array.isArray(window.userAnswers[index]) &&
              window.userAnswers[index].includes(optIndex);
            optionDiv.innerHTML = `
                <input type="checkbox" id="${optionId}" name="question-option-${optIndex}" value="${optIndex}"
                        ${isChecked ? 'checked' : ''}>
                <label for="${optionId}">${option}</label>
            `;
          }

          optionsBlock.appendChild(optionDiv);
        });
      } else {
        // Если нет вариантов ответов, показываем сообщение
        optionsBlock.innerHTML = '<div class="option-margin">Варианты ответов не загружены</div>';
      }
    }
  }

  // Управление кнопками навигации
  const prevBtn = document.getElementById('prev-question-btn');
  const nextBtn = document.getElementById('next-question-btn');
  const finishBtn = document.getElementById('finish-quiz-btn');

  if (prevBtn) prevBtn.disabled = index === 0;

  if (index === quiz.questions.length - 1) {
    if (nextBtn) nextBtn.classList.add('hidden');
    if (finishBtn) finishBtn.classList.remove('hidden');
  } else {
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (finishBtn) finishBtn.classList.add('hidden');
  }
}

// Функция для сохранения ответа на текущий вопрос
function saveCurrentAnswer() {
  const index = window.currentQuestionIndex;
  const question = window.quizData.questions[index];

  if (!question) return;

  if (question.type === 'text') {
    const textInput = document.getElementById('text-answer-input');
    window.userAnswers[index] = textInput ? textInput.value.trim() : '';
  } else if (question.type === 'single_choice') {
    const selectedOption = document.querySelector('input[name="question-option"]:checked');
    window.userAnswers[index] = selectedOption ? parseInt(selectedOption.value) : null
  } else if (question.type === 'multiple_choice') {
    const selectedOptions = document.querySelectorAll('input[name^="question-option-"]:checked');
    window.userAnswers[index] = Array.from(selectedOptions).map(option => parseInt(option.value));
  }
}

// Функция для запуска таймера
function startTimer(seconds) {
  const progressValueEl = document.getElementById('progress-value');
  const progressBar = document.getElementById('timer-progress');

  if (progressValueEl) progressValueEl.textContent = `Осталось времени: ${formatTime(seconds)}`;

  let timeLeft = seconds;
  const totalTime = seconds;

  window.quizTimer = setInterval(() => {
    timeLeft--;
    if (progressValueEl) progressValueEl.textContent = `Осталось времени: ${formatTime(timeLeft)}`;

    if (progressBar) {
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
    }

    if (timeLeft <= 0) {
      clearInterval(window.quizTimer);
      submitQuiz(true); // Автоматическая отправка при истечении времени
    }
  }, 1000);
}

// Функция для отправки результатов квиза
async function submitQuiz(timeExpired = false) {
  // Останавливаем таймер, если он запущен
  if (window.quizTimer) {
    clearInterval(window.quizTimer);
  }

  // Сохраняем последний ответ
  saveCurrentAnswer();

  try {
    // Формируем данные для отправки в соответствии с API
    const answers = window.userAnswers.map((answer, index) => {
      const question = window.quizData.questions[index];

      if (!question) return null;

      if (question.type === 'text') {
        return {
          question_id: question.questionId || question.id,
          type: 'text',
          answer_text: answer || ''
        };
      } else if (question.type === 'single_choice') {
        return {
          question_id: question.questionId || question.id,
          type: 'single_choice',
          answer_id: answer !== null ? answer : 0
        };
      } else if (question.type === 'multiple_choice') {
        return {
          question_id: question.questionId || question.id,
          type: 'multiple_choice',
          answer_ids: Array.isArray(answer) ? answer : []
        };
      }
    }).filter(answer => answer !== null && answer !== undefined);

    const submissionData = {
      answers: answers,
      time_expired: timeExpired
    };

    console.log('Отправляем данные:', submissionData); // Для отладки

    // Исправляем endpoint для отправки результатов
    const gameId = window.gameId || window.quizData.gameId || window.quizData.id;
    const response = await fetchWithAuth(`/quizzes/${gameId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData)
    });

    if (!response || !response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка при отправке результатов');
    }

    const result = await response.json();
    console.log('Результаты отправлены:', result);

    // Показываем сообщение о завершении
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('completion-message').classList.remove('hidden');
    window.quizCompleted = true;

  } catch (error) {
    console.error('Ошибка при отправке результатов:', error);

    // Даже при ошибке показываем завершение
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('completion-message').classList.remove('hidden');

    // Показываем уведомление об ошибке
    showNotification('Произошла ошибка при отправке результатов, но квиз завершен.', 'error');
  }
}

// Функция выхода из системы
function logout() {
  if (window.quizTimer) {
    clearInterval(window.quizTimer);
  }
  localStorage.removeItem('access_token');
  window.location.href = 'auth.html';
}

// Обработка закрытия страницы во время прохождения квиза
window.addEventListener('beforeunload', function (e) {
  if (window.quizData && window.currentQuestionIndex >= 0 && window.quizTimer && !window.quizCompleted) {
    e.preventDefault();
    e.returnValue = 'Вы уверены, что хотите покинуть страницу? Прогресс прохождения квиза будет потерян.';
    return e.returnValue;
  }
});

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
