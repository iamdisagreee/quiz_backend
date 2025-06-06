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

 // Переключение табов
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });

  // Работа с динамическим добавлением вопросов
  const questionsContainer = document.getElementById("questions-container");
  const addQuestionButton = document.getElementById("add-question");
  const createQuizButton = document.getElementById("create-quiz");
  let questionCount = 0;
  const MAX_QUESTIONS = 30;

  // Функция для создания нового блока вопроса
  function createQuestionBlock() {
    if (questionCount >= MAX_QUESTIONS) {
      alert("Достигнуто максимальное число вопросов (" + MAX_QUESTIONS + ").");
      return;
    }
    
    questionCount++;
    const questionBlock = document.createElement("div");
    questionBlock.className = "question-block";
    questionBlock.dataset.questionIndex = questionCount;
    
    // Основная структура блока вопроса
    questionBlock.innerHTML = `
      <div class="question-header ">
        <span class="question-number">Вопрос ${questionCount}</span>
        <button type="button" class="delete-question" title="Удалить вопрос">× Удалить</button>
      </div>
      
      <textarea class="question-text" placeholder="Введите вопрос" required></textarea>
      
      <div class="question-type-selector">
        <select class="question-type">
          <option value="text">Текстовый ответ</option>
          <option value="single_choice">Единственный верный ответ</option>
          <option value="multiple_choice">Несколько верных ответов</option>
        </select>
      </div>
      
      
      <!-- Контейнер для текстового ответа -->
      <div class="text-answer-container">
        <input type="text" class="text-answer" placeholder="Введите правильный ответ" required>
      </div>
      
      <!-- Контейнер для вариантов ответа (скрыт по умолчанию) -->
      <div class="options-container" style="display: none;">
        <div class="option-item">
          <input type="text" class="option-input" placeholder="Вариант ответа">
          <input type="radio" name="correct-option-${questionCount}" class="is-correct-radio" title="Отметить как правильный" checked>
          <button type="button" class="remove-option-button" title="Удалить вариант">×</button>
        </div>
        <div class="option-controls">
          <button type="button" class="add-option-button">+ Добавить вариант</button>
        </div>
      </div>
    `;

    // Обработчик выбора типа вопроса
    const questionTypeSelect = questionBlock.querySelector(".question-type");
    const textAnswerContainer = questionBlock.querySelector(".text-answer-container");
    const optionsContainer = questionBlock.querySelector(".options-container");
    
    questionTypeSelect.addEventListener("change", function() {
      const questionType = questionTypeSelect.value;
      
      // Скрываем все контейнеры
      textAnswerContainer.style.display = "none";
      optionsContainer.style.display = "none";
      
      // Показываем нужный контейнер в зависимости от типа вопроса
      switch (questionType) {
        case "text":
          textAnswerContainer.style.display = "block";
          break;
          
        case "single_choice":
          optionsContainer.style.display = "block";
          // Обновляем на радиокнопки для одиночного выбора
          updateOptionsForSingleChoice(optionsContainer, questionCount);
          break;
          
        case "multiple_choice":
          optionsContainer.style.display = "block";
          // Обновляем на чекбоксы для множественного выбора
          updateOptionsForMultipleChoice(optionsContainer);
          break;
      }
    });
    
    // Обработчик кнопки добавления варианта ответа
    const addOptionButton = questionBlock.querySelector(".add-option-button");
    addOptionButton.addEventListener("click", function() {
      const optionItems = optionsContainer.querySelectorAll(".option-item");
      if (optionItems.length >= 10) {
        alert("Можно добавить не более 10 вариантов ответа.");
        return;
      }
      
      const questionType = questionTypeSelect.value;
      const newOptionItem = document.createElement("div");
      newOptionItem.className = "option-item";
      
      if (questionType === "single_choice") {
        newOptionItem.innerHTML = `
          <input type="text" class="option-input" placeholder="Вариант ответа">
          <input type="radio" name="correct-option-${questionCount}" class="is-correct-radio" title="Отметить как правильный">
          <button type="button" class="remove-option-button" title="Удалить вариант">×</button>
        `;
      } else {
        newOptionItem.innerHTML = `
          <input type="text" class="option-input" placeholder="Вариант ответа">
          <input type="checkbox" class="is-correct-checkbox" title="Отметить как правильный">
          <button type="button" class="remove-option-button" title="Удалить вариант">×</button>
        `;
      }
      
      // Добавляем обработчик для кнопки удаления варианта
      const removeOptionButton = newOptionItem.querySelector(".remove-option-button");
      removeOptionButton.addEventListener("click", function() {
        newOptionItem.remove();
      });
      
      // Добавляем новый вариант перед контролами
      optionsContainer.insertBefore(newOptionItem, optionsContainer.querySelector(".option-controls"));
    });
    
    // Добавляем обработчик для кнопки удаления первого варианта
    const removeOptionButtons = questionBlock.querySelectorAll(".remove-option-button");
    removeOptionButtons.forEach(button => {
      button.addEventListener("click", function() {
        const optionItem = button.closest(".option-item");
        optionItem.remove();
      });
    });
    
    // Обработчик кнопки удаления вопроса
    const removeQuestionButton = questionBlock.querySelector(".delete-question");
    removeQuestionButton.addEventListener("click", function() {
      if (confirm("Вы уверены, что хотите удалить этот вопрос?")) {
        questionBlock.remove();
        questionCount--;
        // Обновляем нумерацию вопросов
        updateQuestionNumbers();
      }
    });

    questionsContainer.appendChild(questionBlock);
    return questionBlock;
  }
  
  // Функция для обновления нумерации вопросов
  function updateQuestionNumbers() {
    const questionBlocks = document.querySelectorAll(".question-block");
    questionBlocks.forEach((block, index) => {
      block.querySelector(".question-number").textContent = `Вопрос ${index + 1}`;
    });
  }
  
  // Функция для обновления вариантов на радиокнопки (одиночный выбор)
  function updateOptionsForSingleChoice(container, questionIndex) {
    const optionItems = container.querySelectorAll(".option-item");
    
    optionItems.forEach(item => {
      // Заменяем чекбокс на радиокнопку
      const oldInput = item.querySelector("input[type='checkbox']");
      if (oldInput) {
        const wasChecked = oldInput.checked;
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.className = "is-correct-radio";
        radioInput.name = `correct-option-${questionIndex}`;
        radioInput.title = "Отметить как правильный";
        radioInput.checked = wasChecked;
        
        oldInput.replaceWith(radioInput);
      }
    });
  }
  
  // Функция для обновления вариантов на чекбоксы (множественный выбор)
  function updateOptionsForMultipleChoice(container) {
    const optionItems = container.querySelectorAll(".option-item");
    
    optionItems.forEach(item => {
      // Заменяем радиокнопку на чекбокс
      const oldInput = item.querySelector("input[type='radio']");
      if (oldInput) {
        const wasChecked = oldInput.checked;
        const checkboxInput = document.createElement("input");
        checkboxInput.type = "checkbox";
        checkboxInput.className = "is-correct-checkbox";
        checkboxInput.title = "Отметить как правильный";
        checkboxInput.checked = wasChecked;
        
        oldInput.replaceWith(checkboxInput);
      }
    });
  }

  // Добавляем первый вопрос при загрузке страницы
  createQuestionBlock();
  
  // Обработчик кнопки добавления вопроса
  addQuestionButton.addEventListener("click", createQuestionBlock);

  // Обработка кнопки "Создать квиз"
  createQuizButton.addEventListener("click", function() {
    // Получаем название квиза
    const quizName = document.getElementById("quiz-name").value.trim();
    if (!quizName) {
      alert("Пожалуйста, введите название квиза");
      return;
    }
    
    // Структура данных для отправки на сервер
    const quizData = {
      name: quizName,
      questions: [],
      settings: {}
    };
    
    // Собираем данные по каждому вопросу
    const questionBlocks = document.querySelectorAll(".question-block");
    let isValid = true;
    
    questionBlocks.forEach((block) => {
      const questionText = block.querySelector(".question-text").value.trim();
      if (!questionText) {
        alert("Заполните текст вопроса");
        isValid = false;
        return;
      }
      
      const questionType = block.querySelector(".question-type").value;
      const question = {
        text: questionText,
        type: questionType,
        answers: []
      };
      
      // В зависимости от типа вопроса собираем ответы
      switch (questionType) {
        case "text":
          const textAnswer = block.querySelector(".text-answer").value.trim();
          if (!textAnswer) {
            alert(`Заполните правильный ответ для вопроса "${questionText}"`);
            isValid = false;
            return;
          }
          question.answers = [{ text: textAnswer, isCorrect: true }];
          break;
          
        case "single_choice":
        case "multiple_choice":
          const optionItems = block.querySelectorAll(".option-item");
          let hasCorrectAnswer = false;
          
          optionItems.forEach(item => {
            const optionText = item.querySelector(".option-input").value.trim();
            if (!optionText) {
              alert(`Заполните текст варианта ответа для вопроса "${questionText}"`);
              isValid = false;
              return;
            }
            
            let isCorrect;
            if (questionType === "single_choice") {
              isCorrect = item.querySelector(".is-correct-radio").checked;
            } else {
              isCorrect = item.querySelector(".is-correct-checkbox").checked;
            }
            
            if (isCorrect) hasCorrectAnswer = true;
            
            question.answers.push({
              text: optionText,
              isCorrect: isCorrect
            });
          });
          
          // Проверяем, что у вопроса с вариантами есть хотя бы два варианта
          if (optionItems.length < 2) {
            alert(`Добавьте минимум два варианта ответа для вопроса "${questionText}"`);
            isValid = false;
            return;
          }
          
          // Проверяем, что есть хотя бы один правильный ответ
          if (!hasCorrectAnswer) {
            alert(`Отметьте хотя бы один правильный ответ для вопроса "${questionText}"`);
            isValid = false;
            return;
          }
          break;
      }
      
      quizData.questions.push(question);
    });
    
    if (!isValid) return;
    
    // Проверяем, что в квизе есть вопросы
    if (quizData.questions.length === 0) {
      alert("Добавьте хотя бы один вопрос в квиз");
      return;
    }
    
    // Собираем настройки из второго таба
    const timerEnabled = document.getElementById("timer-enabled").checked;
    quizData.settings.timerEnabled = timerEnabled;
    if (timerEnabled) {
      quizData.settings.timerValue = parseInt(document.getElementById("timer-value").value, 10) || 15;
    }

    console.log("Данные квиза для отправки:", JSON.stringify(quizData, null, 2));

    // Отправка данных на сервер
    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData)
    })
    .then(response => {
      if (!response.ok) throw new Error('Ошибка создания квиза');
      return response.json();
    })
    .then(data => {
      alert("Квиз успешно создан!");
      window.location.href = "/cabinet.html";
    })
    .catch(error => {
      console.error("Ошибка:", error);
      alert("Ошибка при создании квиза. Попробуйте снова.");
    });
  });