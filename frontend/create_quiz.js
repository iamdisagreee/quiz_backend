// Глобальные переменные
let questionCount = 0;
let hasUnsavedChanges = false;

// Функции авторизации
function getAuthToken() {
  return localStorage.getItem('access_token');
}

function checkAuthAndRedirect() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}

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

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function () {
  console.log('Страница загружена, инициализация...');
  
  // Проверяем авторизацию
  if (!checkAuthAndRedirect()) {
    return;
  }

  // Инициализируем бургер-меню
  initBurgerMenu();
  
  // Инициализируем табы
  initTabs();

  // Проверяем режим редактирования
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const quizId = urlParams.get('id') || sessionStorage.getItem('editQuizId');

  if (mode === 'edit' && quizId) {
    console.log('Режим редактирования, загружаем квиз:', quizId);
    await loadQuizForEditing(quizId);
  } else {
    console.log('Режим создания нового квиза');
    // Добавляем первый вопрос по умолчанию
    createQuestionBlock();
  }

  // Устанавливаем обработчики событий
  setupEventHandlers();
});

// Инициализация бургер-меню
function initBurgerMenu() {
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  const body = document.body;

  if (burgerMenu) {
    burgerMenu.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      body.classList.remove('menu-open');
    });
  }

  document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('menu-open');
    });
  });
}

// Инициализация табов
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const targetId = this.dataset.tab;

      // Убираем активный класс со всех табов и контентов
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      // Добавляем активный класс к выбранному табу и контенту
      this.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Установка обработчиков событий
function setupEventHandlers() {
  // Кнопка добавления вопроса
  const addQuestionBtn = document.getElementById('add-question');
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', createQuestionBlock);
  }

  // Кнопка создания квиза
  const createQuizBtn = document.getElementById('create-quiz');
  if (createQuizBtn) {
    createQuizBtn.addEventListener('click', function(e) {
      e.preventDefault();
      submitQuiz();
    });
  }

  // Отслеживание изменений для предупреждения о несохраненных данных
  document.addEventListener('input', function() {
    hasUnsavedChanges = true;
  });

  document.addEventListener('change', function() {
    hasUnsavedChanges = true;
  });
}

// Создание блока вопроса
function createQuestionBlock() {
  console.log('Создаем новый блок вопроса');
  
  const questionsContainer = document.getElementById('questions-container');
  if (!questionsContainer) {
    console.error('Контейнер questions-container не найден');
    return null;
  }

  questionCount++;

  const questionBlock = document.createElement('div');
  questionBlock.className = 'question-block';
  questionBlock.setAttribute('data-question-id', questionCount);

  questionBlock.innerHTML = `
    <div class="question-header">
      <span class="question-number">Вопрос ${questionCount}</span>
      <button type="button" class="delete-question" onclick="deleteQuestion(this)">Удалить</button>
    </div>
    
    <textarea class="question-text" placeholder="Введите текст вопроса" required></textarea>
    
    <div class="question-type-selector">
      <label>Тип вопроса:</label>
      <select class="question-type" onchange="changeQuestionType(this)">
        <option value="single_choice">Один правильный ответ</option>
        <option value="multiple_choice">Несколько правильных ответов</option>
        <option value="text">Текстовый ответ</option>
      </select>
    </div>
    
    <div class="options-container">
      <!-- Варианты ответов будут добавлены здесь -->
    </div>
    
    <input type="text" class="text-answer" placeholder="Правильный ответ" style="display: none;">
    
    <div class="option-controls">
      <button type="button" class="add-option-button" onclick="addOption(this)">+ Добавить вариант</button>
    </div>
  `;

  questionsContainer.appendChild(questionBlock);

  // Добавляем варианты ответов по умолчанию для первого типа
  changeQuestionType(questionBlock.querySelector('.question-type'));

  console.log('Блок вопроса создан:', questionBlock);
  return questionBlock;
}

// Изменение типа вопроса
function changeQuestionType(selectElement) {
  const questionBlock = selectElement.closest('.question-block');
  const questionType = selectElement.value;
  const optionsContainer = questionBlock.querySelector('.options-container');
  const textAnswer = questionBlock.querySelector('.text-answer');
  const optionControls = questionBlock.querySelector('.option-controls');

  if (questionType === 'text') {
    // Для текстового вопроса показываем поле ввода
    optionsContainer.style.display = 'none';
    optionControls.style.display = 'none';
    textAnswer.style.display = 'block';
    textAnswer.required = true;
  } else {
    // Для вопросов с вариантами
    optionsContainer.style.display = 'block';
    optionControls.style.display = 'block';
    textAnswer.style.display = 'none';
    textAnswer.required = false;

    // Очищаем старые варианты
    optionsContainer.innerHTML = '';

    // Добавляем новые варианты
    addOptionToContainer(optionsContainer, questionType);
    addOptionToContainer(optionsContainer, questionType);
  }
}

// Добавление варианта ответа
function addOption(button) {
  const questionBlock = button.closest('.question-block');
  const questionType = questionBlock.querySelector('.question-type').value;
  const optionsContainer = questionBlock.querySelector('.options-container');

  // Проверяем лимит вариантов
  if (optionsContainer.children.length >= 10) {
    showNotification('Максимальное количество вариантов: 10', 'error');
    return;
  }

  addOptionToContainer(optionsContainer, questionType);
}

// Добавление варианта в контейнер
function addOptionToContainer(container, questionType) {
  const optionItem = document.createElement('div');
  optionItem.className = 'option-item';

  const inputType = questionType === 'single_choice' ? 'radio' : 'checkbox';
  const inputName = questionType === 'single_choice' ? `correct-option-${questionCount}` : '';

  optionItem.innerHTML = `
    <input type="text" class="option-input" placeholder="Вариант ответа" required>
    <input type="${inputType}" ${inputName ? `name="${inputName}"` : ''} 
           class="is-correct-${inputType}" title="Отметить как правильный">
    <button type="button" class="remove-option-button" onclick="removeOption(this)">×</button>
  `;

  container.appendChild(optionItem);
}

// Удаление варианта ответа
function removeOption(button) {
  const optionItem = button.closest('.option-item');
  const container = optionItem.parentElement;

  if (container.children.length <= 2) {
    showNotification('Минимальное количество вариантов: 2', 'error');
    return;
  }

  optionItem.remove();
}

// Удаление вопроса
function deleteQuestion(button) {
  const questionBlock = button.closest('.question-block');
  const questionsContainer = document.getElementById('questions-container');

  if (questionsContainer.children.length <= 1) {
    showNotification('Квиз должен содержать хотя бы один вопрос', 'error');
    return;
  }

  questionBlock.remove();
  updateQuestionNumbers();
}

// Обновление нумерации вопросов
function updateQuestionNumbers() {
  const questionBlocks = document.querySelectorAll('.question-block');
  questionBlocks.forEach((block, index) => {
    const questionNumber = block.querySelector('.question-number');
    if (questionNumber) {
      questionNumber.textContent = `Вопрос ${index + 1}`;
    }
  });
}

// Загрузка квиза для редактирования
async function loadQuizForEditing(quizId) {
  try {
    showLoadingMessage('Загрузка квиза...');

    const response = await fetchWithAuth(`/quizzes/${quizId}`);

    if (!response || !response.ok) {
      throw new Error('Ошибка загрузки квиза');
    }

    const quizData = await response.json();
    console.log('Загруженные данные квиза:', quizData);

    // Заполняем форму данными с сервера
    populateFormWithServerData(quizData);

    // Обновляем заголовок
    document.title = `Редактировать квиз: ${quizData.name}`;

    hideLoadingMessage();
    showNotification('Квиз загружен для редактирования', 'success');

  } catch (error) {
    console.error('Ошибка загрузки квиза:', error);
    hideLoadingMessage();
    showNotification('Не удалось загрузить квиз', 'error');

    // Возвращаемся к списку квизов
    setTimeout(() => {
      window.location.href = 'my_quizzes.html';
    }, 3000);
  }
}

// Заполнение формы данными с сервера
function populateFormWithServerData(quizData) {
  // Заполняем название квиза
  const quizNameInput = document.getElementById('quiz-name');
  if (quizNameInput) {
    quizNameInput.value = quizData.name || '';
  }

  // Заполняем настройки таймера
  const timerEnabledCheckbox = document.getElementById('timer-enabled');
  const timerValueInput = document.getElementById('timer-value');

  if (timerEnabledCheckbox) {
    timerEnabledCheckbox.checked = quizData.settings?.timerEnabled || false;
  }

  if (timerValueInput) {
    timerValueInput.value = quizData.settings?.timerValue || 15;
  }

  // Очищаем существующие вопросы
  const questionsContainer = document.getElementById('questions-container');
  if (questionsContainer) {
    questionsContainer.innerHTML = '';
    questionCount = 0;
  }

  // Заполняем вопросы
  if (quizData.questions && quizData.questions.length > 0) {
    quizData.questions.forEach((question) => {
      const questionBlock = createQuestionBlock();
      if (questionBlock) {
        fillQuestionBlock(questionBlock, question);
      }
    });
  } else {
    // Добавляем один пустой вопрос если нет вопросов
    createQuestionBlock();
  }
}

// Заполнение блока вопроса данными
function fillQuestionBlock(questionBlock, questionData) {
  // Заполняем текст вопроса
  const questionTextArea = questionBlock.querySelector('.question-text');
  if (questionTextArea) {
    questionTextArea.value = questionData.text || '';
  }

  // Заполняем тип вопроса
  const questionTypeSelect = questionBlock.querySelector('.question-type');
  if (questionTypeSelect) {
    questionTypeSelect.value = questionData.type || 'single_choice';
    // Триггерим событие для обновления интерфейса
    changeQuestionType(questionTypeSelect);
  }

  // Заполняем ответы в зависимости от типа вопроса
  setTimeout(() => {
    fillAnswersForQuestion(questionBlock, questionData);
  }, 100); // Небольшая задержка чтобы интерфейс успел обновиться
}

// Заполнение ответов для вопроса
function fillAnswersForQuestion(questionBlock, questionData) {
  const questionType = questionData.type;

  if (questionType === 'text') {
    // Для текстового вопроса
    const textAnswerInput = questionBlock.querySelector('.text-answer');
    if (textAnswerInput && questionData.answers && questionData.answers.length > 0) {
      textAnswerInput.value = questionData.answers[0].text || '';
    }
  } else {
    // Для вопросов с вариантами ответа
    const optionsContainer = questionBlock.querySelector('.options-container');
    if (optionsContainer && questionData.answers) {
      // Очищаем существующие варианты
      optionsContainer.innerHTML = '';

      // Добавляем каждый ответ
      questionData.answers.forEach((answer) => {
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';

        const inputType = questionType === 'single_choice' ? 'radio' : 'checkbox';
        const inputName = questionType === 'single_choice' ? `correct-option-${questionCount}` : '';

        optionItem.innerHTML = `
          <input type="text" class="option-input" placeholder="Вариант ответа" value="${answer.text || ''}" required>
          <input type="${inputType}" ${inputName ? `name="${inputName}"` : ''} 
                 class="is-correct-${inputType}" title="Отметить как правильный" 
                 ${answer.isCorrect ? 'checked' : ''}>
          <button type="button" class="remove-option-button" onclick="removeOption(this)">×</button>
        `;

        optionsContainer.appendChild(optionItem);
      });
    }
  }
}

// Отправка квиза
async function submitQuiz() {
  console.log('Отправка квиза...');
  
  const quizName = document.getElementById("quiz-name").value.trim();
  if (!quizName) {
    showNotification("Пожалуйста, введите название квиза", 'error');
    return;
  }

  // Структура данных для отправки на сервер
  const quizData = {
    name: quizName,
    questions: [],
    settings: {
      timer_enabled: document.getElementById("timer-enabled")?.checked || false,
      timer_value: parseInt(document.getElementById("timer-value")?.value, 10) || 15
    }
  };

  // Собираем данные по каждому вопросу
  const questionBlocks = document.querySelectorAll(".question-block");
  let isValid = true;

  for (const block of questionBlocks) {
    const questionText = block.querySelector(".question-text").value.trim();
    if (!questionText) {
      showNotification("Заполните текст вопроса", 'error');
      isValid = false;
      break;
    }

    const questionType = block.querySelector(".question-type").value;
    const question = {
      text: questionText,
      type: questionType,
      answers: []
    };

    // В зависимости от типа вопроса собираем ответы
    if (questionType === "text") {
      const textAnswer = block.querySelector(".text-answer").value.trim();
      if (!textAnswer) {
        showNotification(`Заполните правильный ответ для вопроса "${questionText}"`, 'error');
        isValid = false;
        break;
      }
      question.answers = [{ text: textAnswer, is_correct: true }];
    } else {
      const optionItems = block.querySelectorAll(".option-item");
      let hasCorrectAnswer = false;

      for (const item of optionItems) {
        const optionText = item.querySelector(".option-input").value.trim();
        if (!optionText) {
          showNotification(`Заполните текст варианта ответа для вопроса "${questionText}"`, 'error');
          isValid = false;
          break;
        }

        let isCorrect;
        if (questionType === "single_choice") {
          isCorrect = item.querySelector(".is-correct-radio").checked;
        } else {
          isCorrect = item.querySelector(".is-correct-checkbox").checked;
        }

        if (isCorrect) {
          hasCorrectAnswer = true;
        }

        question.answers.push({
          text: optionText,
          is_correct: isCorrect
        });
      }

      if (!isValid) break;

      if (!hasCorrectAnswer) {
        showNotification(`Отметьте хотя бы один правильный ответ для вопроса "${questionText}"`, 'error');
        isValid = false;
        break;
      }

      if (question.answers.length < 2) {
        showNotification(`Добавьте хотя бы 2 варианта ответа для вопроса "${questionText}"`, 'error');
        isValid = false;
        break;
      }
    }

    quizData.questions.push(question);
  }

  if (!isValid) return;

  if (quizData.questions.length === 0) {
    showNotification("Добавьте хотя бы один вопрос", 'error');
    return;
  }

  // Отправляем данные на сервер
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id') || sessionStorage.getItem('editQuizId');
    const isEditMode = urlParams.get('mode') === 'edit' && quizId;

    showLoadingMessage(isEditMode ? 'Обновление квиза...' : 'Создание квиза...');

    let response;
    if (isEditMode) {
      // Обновляем существующий квиз
      response = await fetchWithAuth(`/quizzes/${quizId}`, {
        method: 'PUT',
        body: JSON.stringify(quizData)
      });
    } else {
      // Создаем новый квиз
      response = await fetchWithAuth('/quizzes/', {
        method: 'POST',
        body: JSON.stringify(quizData)
      });
    }

    if (!response || !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка сервера');
    }

    const result = await response.json();
    console.log('Ответ сервера:', result);

    hideLoadingMessage();
    showNotification(
      isEditMode ? 'Квиз успешно обновлен!' : 'Квиз успешно создан!',
      'success'
    );

    // Очищаем sessionStorage
    sessionStorage.removeItem('editQuizId');
    hasUnsavedChanges = false;

    // Перенаправляем на страницу со списком квизов
    setTimeout(() => {
      window.location.href = 'my_quizzes.html';
    }, 2000);

  } catch (error) {
    console.error('Ошибка при сохранении квиза:', error);
    hideLoadingMessage();
    showNotification(`Ошибка: ${error.message}`, 'error');
  }
}

// Выход без сохранения
function exitWithoutSaving() {
  if (hasUnsavedChanges && !confirm('Вы уверены, что хотите выйти без сохранения? Все изменения будут потеряны.')) {
    return;
  }
  
  sessionStorage.removeItem('editQuizId');
  window.location.href = 'my_quizzes.html';
}

// Функции для отображения уведомлений и загрузки
function showNotification(message, type = 'info') {
  console.log(`Уведомление [${type}]:`, message);
  
  // Удаляем предыдущие уведомления
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const backgroundColor = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1';
  const borderColor = type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb';
  const textColor = type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460';

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${backgroundColor};
    border: 1px solid ${borderColor};
    color: ${textColor};
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 400px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Убираем уведомление через 5 секунд
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);

  // Добавляем возможность закрыть по клику
  notification.addEventListener('click', () => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  });
}

function showLoadingMessage(message) {
  // Удаляем предыдущий индикатор загрузки
  const existingLoader = document.querySelector('.loading-overlay');
  if (existingLoader) {
    existingLoader.remove();
  }

  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const loadingContent = document.createElement('div');
  loadingContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;

  loadingContent.innerHTML = `
    <div style="
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    "></div>
    <div style="font-size: 16px; color: #333;">${message}</div>
  `;

  // Добавляем CSS анимацию
  if (!document.querySelector('#loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  loadingOverlay.appendChild(loadingContent);
  document.body.appendChild(loadingOverlay);
}

function hideLoadingMessage() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

// Предупреждение при закрытии страницы
window.addEventListener('beforeunload', function (e) {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
  }
});

// Глобальные функции для использования в HTML
window.createQuestionBlock = createQuestionBlock;
window.changeQuestionType = changeQuestionType;
window.addOption = addOption;
window.removeOption = removeOption;
window.deleteQuestion = deleteQuestion;
window.submitQuiz = submitQuiz;
window.exitWithoutSaving = exitWithoutSaving;
