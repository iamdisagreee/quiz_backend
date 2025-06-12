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


let quizStat =[
    {
  "id": "1",
  "code": "14",
  "title": "Основы JavaScript",
  "createdAt": "2023-05-15",
  "author": {
    "id": "5f8d3a1b1c9d440000d47a11",
    "name": "Иван Петров"
  },
  "settings": {
    "timerEnabled": true,
    "timerValue": 600
  },
  "stats": {
    "participantsCount": 4,
    "averageTime": 452,
    "averageScore": 66.7,
    "questionsCount": 5
  },
  "participants": [
    {
      "id": "1",
      "name": "Алексей Смирнов",
      "email": "alex.smirnov@example.com",
      "completionDate": "2023-05-16",
      "timeSpent": 523,
      "score": 8,
      "total":10,
      "details": [
        {
          "question": "Что выведет console.log(typeof null) в JavaScript?",
          "userAnswer": "object",
          "correctAnswer": "object",
          "isCorrect": true
        },
        {
          "question": "Какой метод массива возвращает новый массив?",
          "userAnswer": "map",
          "correctAnswer": "map",
          "isCorrect": true
        },
        {
          "question": "Что такое замыкание (closure) в JavaScript?",
          "userAnswer": "Функция внутри другой функции",
          "correctAnswer": "Функция, которая запоминает свое лексическое окружение",
          "isCorrect": false
        },
        {
          "question": "Как объявить переменную с блочной областью видимости?",
          "userAnswer": "let",
          "correctAnswer": "let или const",
          "isCorrect": false
        },
        {
          "question": "Что делает оператор '==='?",
          "userAnswer": "Сравнивает без приведения типов",
          "correctAnswer": "Сравнивает без приведения типов",
          "isCorrect": true
        }
      ]
    },
    {
      "id": "1",
      "name": "Алексей Смирнов",
      "email": "alex.smirnov@example.com",
      "completionDate": "2023-05-16",
      "timeSpent": 523,
      "score": 3,
      "total":10,
      "details": [
        {
          "question": "Что выведет console.log(typeof null) в JavaScript?",
          "userAnswer": "object",
          "correctAnswer": "object",
          "isCorrect": true
        },
        {
          "question": "Какой метод массива возвращает новый массив?",
          "userAnswer": "map",
          "correctAnswer": "map",
          "isCorrect": true
        },
        {
          "question": "Что такое замыкание (closure) в JavaScript?",
          "userAnswer": "Функция внутри другой функции",
          "correctAnswer": "Функция, которая запоминает свое лексическое окружение",
          "isCorrect": false
        },
        {
          "question": "Как объявить переменную с блочной областью видимости?",
          "userAnswer": "let",
          "correctAnswer": "let или const",
          "isCorrect": false
        },
        {
          "question": "Что делает оператор '==='?",
          "userAnswer": "Сравнивает без приведения типов",
          "correctAnswer": "Сравнивает без приведения типов",
          "isCorrect": true
        }
      ]
    },
    {
      "id": "2",
      "name": "Елена Иванова",
      "email": "elena.ivanova@example.com",
      "completionDate": "2023-05-17",
      "timeSpent": 387,
      "score": 6,
      "total":10,
      "details": [
        {
          "question": "Что выведет console.log(typeof null) в JavaScript?",
          "userAnswer": "null",
          "correctAnswer": "object",
          "isCorrect": false
        },
        {
          "question": "Какой метод массива возвращает новый массив?",
          "userAnswer": "forEach",
          "correctAnswer": "map",
          "isCorrect": false
        },
        {
          "question": "Что такое замыкание (closure) в JavaScript?",
          "userAnswer": "Функция, которая запоминает свое лексическое окружение",
          "correctAnswer": "Функция, которая запоминает свое лексическое окружение",
          "isCorrect": true
        },
        {
          "question": "Как объявить переменную с блочной областью видимости?",
          "userAnswer": "const",
          "correctAnswer": "let или const",
          "isCorrect": true
        },
        {
          "question": "Что делает оператор '==='?",
          "userAnswer": "Сравнивает без приведения типов",
          "correctAnswer": "Сравнивает без приведения типов",
          "isCorrect": true
        }
      ]
    },
    {
      "id": "3",
      "name": "Сергей Кузнецов",
      "email": "sergey.kuznetsov@example.com",
      "completionDate": "2023-05-18",
      "timeSpent": 446,
      "score": 4,
      "total":10,
      "details": [
        {
          "question": "Что выведет console.log(typeof null) в JavaScript?",
          "userAnswer": "object",
          "correctAnswer": "object",
          "isCorrect": true
        },
        {
          "question": "Какой метод массива возвращает новый массив?",
          "userAnswer": "map",
          "correctAnswer": "map",
          "isCorrect": true
        },
        {
          "question": "Что такое замыкание (closure) в JavaScript?",
          "userAnswer": "Способ скрытия переменных",
          "correctAnswer": "Функция, которая запоминает свое лексическое окружение",
          "isCorrect": false
        },
        {
          "question": "Как объявить переменную с блочной областью видимости?",
          "userAnswer": "var",
          "correctAnswer": "let или const",
          "isCorrect": false
        },
        {
          "question": "Что делает оператор '==='?",
          "userAnswer": "Сравнивает с приведением типов",
          "correctAnswer": "Сравнивает без приведения типов",
          "isCorrect": false
        }
      ]
    }
  ]
}
]

let currentPage = 1;
const resultsPerPage = 3;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('result-search-btn').addEventListener('click', () => {
    currentPage = 1; 
    displayQuizStatistics();
  });
  
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      displayQuizStatistics();
    }
  });
  
  displayQuizStatistics();
  updatePagination();
});

function formatDate(dateString) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('ru-RU', options);
}
function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}


function displayQuizStatistics(){

  const quizId = localStorage.getItem('currentQuizId');
  
  if (!quizId) {
    console.error('Quiz ID not found');
    return;
  }

   const quiz = quizStat.find(q => q.id === quizId);
  
  if (!quiz) {
    console.error('Quiz not found with id:', quizId);
    return;
  }
  const filteredResults = filterResultsBySearch();
  const filteredScore = scoreFilter(filteredResults);
  const sortedResults = sortResults(filteredScore);
 

  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

  if (paginatedResults.length === 0) {
    
    document.getElementById('results-container').innerHTML = '<div class="result-quiz-name" style="font-weight:400;" >Нет результатов.</div>';
    updatePagination();
    return;
  }

    const container_info = document.getElementById('statistics-info-container');
  container_info.innerHTML = '';
  container_info.innerHTML= 
            ` <div class="row-container">
                <div class="result-quiz-name" style="margin-bottom:0;">${quiz.title}</div>
                <div>Код доступа: <span style="font-weight: 600;">${quiz.code}</span></div>
              </div>
              <div class="statistics-info-details" style="margin-bottom: 20px;">
                    <div class="statistics-info-details-item">
                        <p class="statistics-info-text">Дата создания: <span style="font-weight:500;">${formatDate(quiz.createdAt)}</span></p>
                    </div>
                    <div class="statistics-info-details-item">
                        <p class="statistics-info-text">Количество вопросов: <span style="font-weight:500;">${quiz.stats.questionsCount}</span></p>
                    </div>

              </div>
              <div class="statistics-info-details">
                    <div class="statistics-info-details-item">
                        <div class="blue-border" style="padding: 10px 15px; color:rgb(51, 99, 220); font-size: 30px;">
                            <p style="font-weight: 600;">${quiz.stats.participantsCount}</p>
                            <p class="statistics-info-text">Всего участников</p>
                         </div>
                    </div>
                    <div class="statistics-info-details-item">
                        <div class="green-border" style="padding: 10px 15px; color:rgb(22, 163, 74); font-size: 30px;">
                            <p style="font-weight: 600;">${quiz.stats.averageScore}%</p>
                            <p class="statistics-info-text">Средний результат</p>
                         </div>
                    </div>

              </div>
            `

    container_patricipants = document.getElementById('results-container');
    container_patricipants.innerHTML='';

    container_patricipants.innerHTML = paginatedResults.map(result => {

    const percentage = Math.round((result.score / result.total) * 100);
    const color = percentage >= 80 ? 'green' : 
                  percentage >= 50 ? 'yellow' : 'red';

    return `
       <div class="statistics-participants-container">
            <div class="statistic-participants-container-item" style="align-items: start; ">
                    <div style="font-weight:500;">${result.name}</div>
                    <div style="font-size: 14px; color: rgb(107, 114 ,128);">${result.email}</div>
            </div>
            <div class="statistic-participants-container-item" >${formatDate(result.completionDate)}</div>
            <div class="statistic-participants-container-item score-display" style="flex-direction: row; column-gap: 10px;">
                 <span class="score-text" style="font-size: 14px;">${result.score}/${result.total}</span>
                  <div class="progress-bar">
                      <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                  </div>
            </div>

        </div>
    `;
  }).join('');

    updatePagination();
}

function getQuizIndexById(quizId) {
  return quizStat.findIndex(quiz => quiz.id === quizId);
}

// Фильтрация по поиску
function filterResultsBySearch() {
  const quizId = localStorage.getItem('currentQuizId');
  console.log(quizStat[getQuizIndexById(quizId)].participants)

  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  return quizStat[getQuizIndexById(quizId)].participants.filter(result => 
    result.name.toLowerCase().includes(searchTerm)
);
}

function scoreFilter(filtered=[]){
  const filterSelect = document.getElementById('filter-select').value;
  const quizId = localStorage.getItem('currentQuizId');
  results = quizStat[getQuizIndexById(quizId)];
  participants = filtered || [...results.participants];

  switch (filterSelect ) {
    case 'high':
      participants = participants.filter(p => (p.score / p.total) * 100 >= 80);
      break;
    case 'medium':
      participants = participants.filter(p => (p.score / p.total) * 100 >= 50 && (p.score / p.total) * 100 < 80);
      break;
    case 'low':
      participants = participants.filter(p => (p.score / p.total) * 100 < 50);
      break;
    case 'all':
    default:
      // Ничего не фильтруем
      break;
  }

  return participants;
}

// Сортировка
function sortResults(sorted=[]) {
    const quizId = localStorage.getItem('currentQuizId');

  results = sorted || quizStat[getQuizIndexById(quizId)].participants;
  const sortBy = document.getElementById('sort-select').value;
  sorted = [...results];

  switch (sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.completionDate) - new Date(b.completionDate));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.score / b.total) - (a.score / a.total));
      break;
    case 'score-asc':
      sorted.sort((a, b) => (a.score / a.total) - (b.score / b.total));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return sorted;
}

// Пагинация
function nextPage() {
  const totalPages = Math.ceil(filterResultsBySearch().length / resultsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayQuizStatistics();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    displayQuizStatistics();
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
