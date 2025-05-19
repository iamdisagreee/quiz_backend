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

// Работа с динамическим добавлением вопросов
const questionsContainer = document.getElementById("questions-container");
const addQuestionButton = document.getElementById("add-question");
const createQuizButton = document.getElementById("create-quiz");
let questionCount = 0;
const MAX_QUESTIONS = 30;

    // Переключение между вкладками "Квиз" и "Настройка"
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        tabs.forEach(t => t.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(target).classList.add("active");
      });
    });

    // Функция для обновления нумерации всех вопросов
    function updateQuestionNumbers() {
  const questionBlocks = document.querySelectorAll(".question-block");
  questionBlocks.forEach((block, index) => {
    const numberElement = block.querySelector(".question-number");
    if (numberElement) {
      numberElement.textContent = `Вопрос ${index + 1}:`;
    }
  });
  // Обновляем глобальный счетчик вопросов
  questionCount = questionBlocks.length;
}


    // Функция для создания нового блока вопроса
    function createQuestionBlock() {
      if (questionCount >= MAX_QUESTIONS) {
        alert("Достигнуто максимальное число вопросов (" + MAX_QUESTIONS + ").");
        return;
      }
      questionCount++;
      const questionBlock = document.createElement("div");
      questionBlock.className = "question-block";
      questionBlock.innerHTML = `
       <div class="question-header">
          <p class="question-number">Вопрос</p>
          <button type="button" class="delete-question">× Удалить</button>
        </div>
        <textarea class="question-text" placeholder="Введите вопрос" required></textarea>
        <input type="text" class="correct-answer" placeholder="Введите корректный ответ" required>
        <div class="options-toggle">
          <label>
            <input type="checkbox" class="has-options"> Вопрос с вариантами ответа
          </label>
        </div>
        <div class="options-container">
          <div class="option">
            <input type="text" class="answer-option" placeholder="Вариант ответа">
          </div>
          <button type="button" class="add-option-button">+ Добавить вариант</button>
        </div>
      `;

      const hasOptionsCheckbox = questionBlock.querySelector(".has-options");
      const correctAnswerField = questionBlock.querySelector(".correct-answer");
      let optionsContainer = questionBlock.querySelector(".options-container");
      const addOptionButton = questionBlock.querySelector(".add-option-button");

      // Добавление вариантов ответа и проверка на превышение лимита
      function attachAddOptionHandler(container, button) {
        button.addEventListener("click", function() {
          const optionInputs = container.querySelectorAll(".answer-option");
          if (optionInputs.length >= 5) {
            alert("Можно добавить не более 5 вариантов ответа.");
            return;
          }
          const newOptionDiv = document.createElement("div");
          newOptionDiv.className = "option";
          newOptionDiv.innerHTML = `<input type="text" class="answer-option" placeholder="Вариант ответа">`;
          container.insertBefore(newOptionDiv, button);
        });
      }
      attachAddOptionHandler(optionsContainer, addOptionButton);

      // Обработка переключения чекбокса "Вопрос с вариантами ответа"
      hasOptionsCheckbox.addEventListener("change", function() {
        if (this.checked) {
          // При включении — показываем контейнер вариантов, но поле корректного ответа остаётся видимым
          optionsContainer.style.display = "block";
        } else {
          // При отключении — скрываем контейнер вариантов и сбрасываем его содержимое до исходного
          optionsContainer.innerHTML = `
            <div class="option">
              <input type="text" class="answer-option" placeholder="Вариант ответа">
            </div>
            <button type="button" class="add-option-button">+ Добавить вариант</button>
          `;
          attachAddOptionHandler(optionsContainer, optionsContainer.querySelector('.add-option-button'));
          optionsContainer.style.display = "none";
        }
      });

      // Добавляем обработчик удаления вопроса
      const deleteButton = questionBlock.querySelector(".delete-question");
      deleteButton.addEventListener("click", function() {
        if(questionCount>1){
          questionBlock.remove();
          questionCount--;
          updateQuestionNumbers(); // Обновляем нумерацию после удаления
        }
        else{
          alert("Квиз должен содержать минимум 1 вопрос.");
          return;
        }
      });

      questionsContainer.appendChild(questionBlock);
      updateQuestionNumbers();
    }

    // Добавляем первый вопрос при загрузке страницы
    createQuestionBlock();
    addQuestionButton.addEventListener("click", createQuestionBlock);

    // Обработка кнопки "Создать квиз"
    createQuizButton.addEventListener("click", function() {
      const quizData = {
        questions: [],
        settings: {}
      };

      // Собираем данные по каждому вопросу
      const questionBlocks = document.querySelectorAll(".question-block");
      questionBlocks.forEach((block) => {
        const questionText = block.querySelector(".question-text").value.trim();
        const correctAnswer = block.querySelector(".correct-answer").value.trim();
        const hasOptions = block.querySelector(".has-options").checked;
        let question = {
          text: questionText,
          correctAnswer: correctAnswer,
          hasOptions: hasOptions
        };

        if (hasOptions) {
          const optionInputs = block.querySelectorAll(".answer-option");
          const options = [];
          optionInputs.forEach(input => {
            const val = input.value.trim();
            if (val) options.push(val);
          });
          question.options = options;
        }
        quizData.questions.push(question);
      });

      // Собираем настройки из таймера
      const timerEnabled = document.getElementById("timer-enabled").checked;
      quizData.settings.timerEnabled = timerEnabled;
      if (timerEnabled) {
        // Перевод из минут в секунды
        quizData.settings.timerValue = parseInt(document.getElementById("timer-value").value, 10) * 60 || 60;
      }

      console.log("Собранные данные квиза:", JSON.stringify(quizData, null, 2));

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