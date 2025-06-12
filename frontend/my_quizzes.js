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

let quizResults = [
  {
    "id": "1",
    "title": "Продвинутый JavaScript",
    "description": "Тест на продвинутые концепции JavaScript",
    "code": "JS-2023",
    "question_count": 3,
    "createdAt": "2023-06-10",
    "updatedAt": "2023-06-15",
    "author": {
      "id": "6g9e3b0a2d9e550000e58b22",
      "name": "Алексей Смирнов"
    },
    "settings": {
      "timerEnabled": true,
      "timerValue": 900,
      "showCorrectAnswers": false,
      "passingScore": 80
    },
    "questions": [
      {
        "id": "q1",
        "text": "Что такое Event Loop в JavaScript?",
        "type": "single_choice",
        "answers": [
          { "text": "Механизм обработки асинхронного кода", "isCorrect": true },
          { "text": "Специальный тип цикла for", "isCorrect": false },
          { "text": "Событие загрузки страницы", "isCorrect": false },
          { "text": "Метод оптимизации производительности", "isCorrect": false }
        ]
      },
      {
        "id": "q2",
        "text": "Какие из этих методов являются иммутабельными?",
        "type": "multiple_choice",
        "answers": [
          { "text": "map()", "isCorrect": true },
          { "text": "push()", "isCorrect": false },
          { "text": "slice()", "isCorrect": true },
          { "text": "concat()", "isCorrect": true }
        ]
      },
      {
        "id": "q3",
        "text": "Объясните разницу между == и ===",
        "type": "text",
        "answers": [
          { "text": "== выполняет приведение типов, === проверяет без приведения", "isCorrect": true }
        ]
      }
    ],
    "stats": {
      "totalAttempts": 128,
      "averageScore": 72.5,
      "bestScore": 100
    }
  },
  {
    "id": "2",
    "title": "Основы Python",
    "description": "Базовый тест по языку Python",
    "code": "PY-101",
    "question_count": 5,
    "createdAt": "2023-05-15",
    "updatedAt": "2023-06-20",
    "author": {
      "id": "7h0f4c1b3e9f660001f69c33",
      "name": "Иван Петров"
    },
    "settings": {
      "timerEnabled": false,
      "timerValue": 0,
      "showCorrectAnswers": true,
      "passingScore": 60
    },
    "questions": [
      {
        "id": "q1",
        "text": "Какой оператор используется для возведения в степень?",
        "type": "single_choice",
        "answers": [
          { "text": "**", "isCorrect": true },
          { "text": "^", "isCorrect": false },
          { "text": "^^", "isCorrect": false },
          { "text": "pow()", "isCorrect": false }
        ]
      },
      {
        "id": "q2",
        "text": "Как создать пустой список?",
        "type": "single_choice",
        "answers": [
          { "text": "list()", "isCorrect": true },
          { "text": "[]", "isCorrect": true },
          { "text": "new List()", "isCorrect": false },
          { "text": "list.new()", "isCorrect": false }
        ]
      },
      {
        "id": "q3",
        "text": "Какой тип данных изменяемый (mutable)?",
        "type": "multiple_choice",
        "answers": [
          { "text": "Список (list)", "isCorrect": true },
          { "text": "Кортеж (tuple)", "isCorrect": false },
          { "text": "Множество (set)", "isCorrect": true },
          { "text": "Строка (str)", "isCorrect": false }
        ]
      }
    ],
    "stats": {
      "totalAttempts": 95,
      "averageScore": 68.3,
      "bestScore": 95
    }
  },
  {
    "id": "3",
    "title": "Веб-разработка (HTML/CSS)",
    "description": "Тест по основам HTML и CSS",
    "code": "WEB-2023",
    "question_count": 4,
    "createdAt": "2023-04-22",
    "updatedAt": "2023-05-30",
    "author": {
      "id": "8i1g5d2c4f0g770002g7ad44",
      "name": "Мария Иванова"
    },
    "settings": {
      "timerEnabled": true,
      "timerValue": 600,
      "showCorrectAnswers": true,
      "passingScore": 70
    },
    "questions": [
      {
        "id": "q1",
        "text": "Какой тег используется для создания ссылки?",
        "type": "single_choice",
        "answers": [
          { "text": "<a>", "isCorrect": true },
          { "text": "<link>", "isCorrect": false },
          { "text": "<href>", "isCorrect": false },
          { "text": "<url>", "isCorrect": false }
        ]
      },
      {
        "id": "q2",
        "text": "Как изменить цвет текста на красный в CSS?",
        "type": "single_choice",
        "answers": [
          { "text": "color: red;", "isCorrect": true },
          { "text": "text-color: red;", "isCorrect": false },
          { "text": "font-color: red;", "isCorrect": false },
          { "text": "color: #ff0000;", "isCorrect": true }
        ]
      }
    ],
    "stats": {
      "totalAttempts": 210,
      "averageScore": 75.2,
      "bestScore": 100
    }
  },
  {
    "id": "4",
    "title": "Базы данных (SQL)",
    "description": "Тест по основам SQL и реляционным базам данных",
    "code": "SQL-101",
    "question_count": 6,
    "createdAt": "2023-03-18",
    "updatedAt": "2023-04-05",
    "author": {
      "id": "9j2h6e3d5g1h880003h8be55",
      "name": "Дмитрий Кузнецов"
    },
    "settings": {
      "timerEnabled": true,
      "timerValue": 1200,
      "showCorrectAnswers": false,
      "passingScore": 75
    },
    "questions": [
      {
        "id": "q1",
        "text": "Какой оператор используется для выборки данных?",
        "type": "single_choice",
        "answers": [
          { "text": "SELECT", "isCorrect": true },
          { "text": "GET", "isCorrect": false },
          { "text": "QUERY", "isCorrect": false },
          { "text": "FIND", "isCorrect": false }
        ]
      },
      {
        "id": "q2",
        "text": "Какой тип JOIN возвращает все строки из обеих таблиц?",
        "type": "single_choice",
        "answers": [
          { "text": "FULL OUTER JOIN", "isCorrect": true },
          { "text": "INNER JOIN", "isCorrect": false },
          { "text": "LEFT JOIN", "isCorrect": false },
          { "text": "CROSS JOIN", "isCorrect": false }
        ]
      }
    ],
    "stats": {
      "totalAttempts": 87,
      "averageScore": 65.8,
      "bestScore": 92
    }
  },
  {
    "id": "5",
    "title": "Алгоритмы и структуры данных",
    "description": "Тест по алгоритмам и структурам данных",
    "code": "ALG-2023",
    "question_count": 8,
    "createdAt": "2023-02-10",
    "updatedAt": "2023-03-15",
    "author": {
      "id": "0k3i7f4e6h2i990004i9cf66",
      "name": "Анна Соколова"
    },
    "settings": {
      "timerEnabled": true,
      "timerValue": 1800,
      "showCorrectAnswers": false,
      "passingScore": 85
    },
    "questions": [
      {
        "id": "q1",
        "text": "Какая сложность у алгоритма пузырьковой сортировки?",
        "type": "single_choice",
        "answers": [
          { "text": "O(n²)", "isCorrect": true },
          { "text": "O(n log n)", "isCorrect": false },
          { "text": "O(n)", "isCorrect": false },
          { "text": "O(1)", "isCorrect": false }
        ]
      },
      {
        "id": "q2",
        "text": "Какая структура данных работает по принципу LIFO?",
        "type": "single_choice",
        "answers": [
          { "text": "Стек (Stack)", "isCorrect": true },
          { "text": "Очередь (Queue)", "isCorrect": false },
          { "text": "Дек (Deque)", "isCorrect": false },
          { "text": "Куча (Heap)", "isCorrect": false }
        ]
      }
    ],
    "stats": {
      "totalAttempts": 64,
      "averageScore": 70.1,
      "bestScore": 98
    }
  }
];

let currentPage = 1;
const resultsPerPage = 3;

// Загрузка данных (в реальном проекте - fetch API)
function loadResults() {
  const container = document.getElementById('results-container');
  container.innerHTML = '';

  const filteredResults = filterResultsBySearch();
  const sortedResults = sortResults(filteredResults);

  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

  if (paginatedResults.length === 0) {
    container.innerHTML = '<div class="result-quiz-name" style="font-weight:400;">Нет результатов или <span style="font-weight: 600;">Вы еще не добавили ни одного квиза.</span></div>';
    updatePagination();
    return;
  }

  container.innerHTML = paginatedResults.map(result => {

    return `
      <div class="results-quiz-container">
        <div class="results-items-container">

            <div >
                <div class="result-quiz-name">${result.title}</div>
                <p class="result-quiz-data">Создан: ${formatDate(result.createdAt)}</p>
                <p class="result-quiz-data">${result.question_count} вопроса</p>
                <p class="result-quiz-data">Код доступа: ${result.code}</p>

            </div>
            <div id="my-quizzes-btn-container">
                <button class="my-quizess-btn btn-green" id="btn-start-${result.id}" onclick="startQuiz(${result.id})">Начать</button>
                <button class="my-quizess-btn btn-blue" id="btn-edit-${result.id}" onclick="editQuiz('${result.id}')">Редактировать</button>
                <button class="my-quizess-btn btn-yellow" id="btn-statistic-${result.id}" onclick="openQuizStatistics('${result.id}')">Статистика</button>
                <button class="my-quizess-btn btn-red" id="btn-remove-${result.id}" onclick="removeQuiz('${result.id}')" >Удалить</button>
            </div>


        </div>
      </div>
    `;
  }).join('');

  updatePagination();
}

window.startQuiz = function(quizId) {
    btn = document.getElementById('btn-start-'+quizId);
    btn_edit = document.getElementById('btn-edit-'+quizId);

    if (btn.textContent.trim() == "Начать") {
        btn.textContent='Завершить';
        btn.classList.add('btn-orange');
        btn_edit.classList.add('hidden');
         // Здесь должна быть логика по запуску таймера в квизе
    }
    else{
        btn.classList.add('hidden');
         // Здесь должна быть логика по отключению таймера в квизе
    }
}

window.editQuiz = function(quizId) {
  const quizToEdit = quizResults.find(quiz => quiz.id === quizId);
  
  if (!quizToEdit) {
    console.error('Quiz not found');
    return;
  }

  // Сохраняем данные квиза в sessionStorage
  sessionStorage.setItem('editQuizData', JSON.stringify(quizToEdit));
  
  window.location.href = 'create_quiz.html?mode=edit&id=' + quizId;
};


function openQuizStatistics(quizId) {
  // Сохраняем ID квиза в localStorage или передаем через URL
  localStorage.setItem('currentQuizId', quizId);
  
  // Переходим на страницу статистики
  window.location.href = 'statistics.html';
}

window.removeQuiz = function(quizId){
    const quizToEdit = quizResults.find(quiz => quiz.id === quizId);

    if (!quizToEdit) {
    console.error('Quiz not found');
    return;
  }

  showConfirmationModal();
}

// Показ модального окна завершения квиза
function showConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        modal.classList.remove('hidden');
        
        // Обработчики для кнопок
        document.getElementById('remove-quiz').onclick = function() {
            modal.classList.add('hidden');
            
            updatePagination();

            // Можно реализовать анимацию удаления

            // Логика отправки запроса на удаление на сервер
        };
        
        document.getElementById('cancel-remove-quiz').onclick = function() {
        modal.classList.add('hidden');
        };
}

// Фильтрация по поиску
function filterResultsBySearch() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  return quizResults.filter(result => 
    result.title.toLowerCase().includes(searchTerm)
  );
}

// Сортировка
function sortResults(results = quizResults) {
  const sortBy = document.getElementById('sort-select').value;
  let sorted = [...results];

  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.stats.averageScore) - (a.stats.averageScore));
      break;
    case 'score-asc':
      sorted.sort((a, b) => (a.stats.averageScore) - (b.stats.averageScore));
      break;
  }

  return sorted;
}

// Пагинация
function nextPage() {
  const totalPages = Math.ceil(filterResultsBySearch().length / resultsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    loadResults();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadResults();
  }
}

function updatePagination() {
  const totalResults = filterResultsBySearch().length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  document.getElementById('page-info').textContent = `${currentPage} / ${totalPages}`;
  
  const prevButton = document.querySelector('.arrow-button:first-child');
  const nextButton = document.querySelector('.arrow-button:last-child');
  const pagination = document.getElementById('pagination');

  if (totalPages === 0) {
    pagination.classList.add('hidden');
  }
  else{
    pagination.classList.remove('hidden');
    if (currentPage === 1) {
      prevButton.classList.add('disabled');
    } else {
      prevButton.classList.remove('disabled');
    }
    
    if (currentPage >= totalPages ) {
      nextButton.classList.add('disabled');
    } else {
      nextButton.classList.remove('disabled');
    }
  }
}

function formatDate(dateString) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('ru-RU', options);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('result-search-btn').addEventListener('click', () => {
    currentPage = 1; 
    loadResults();
  });
  
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadResults();
    }
  });
  
  // Первоначальная загрузка
  loadResults();
  updatePagination();
});
