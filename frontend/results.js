  let quizResults = [
      {
        id: 1,
        title: "Биология: Клеточное строение",
        date: "2023-05-23",
        score: 9,
        total: 10,
        details: [
          {
            question: "Что такое клетка?",
            userAnswer: "Основная структурная и функциональная единица всех живых организмов",
            correctAnswer: "Основная структурная и функциональная единица всех живых организмов",
            isCorrect: true
          },
          {
            question: "Какая органелла отвечает за синтез белка в клетке?",
            userAnswer: "Митохондрия",
            correctAnswer: "Рибосома",
            isCorrect: false
          }
        ]
      },
      {
        id: 2,
        title: "История: Древний Египет",
        date: "2023-05-18",
        score: 3,
        total: 5,
        details: [
          {
            question: "В каком году началось правление Рамзеса II?",
            userAnswer: "1279 г. до н.э.",
            correctAnswer: "1279 г. до н.э.",
            isCorrect: true
          },
          {
            question: "Кто построил Великую пирамиду в Гизе?",
            userAnswer: "Тутанхамон",
            correctAnswer: "Хеопс (Хуфу)",
            isCorrect: false
          }
        ]
      },
      {
        id: 3,
        title: "Математика: Алгебра",
        date: "2023-05-12",
        score: 6,
        total: 15,
        details: [
          {
            question: "Решите уравнение: 2x + 5 = 11",
            userAnswer: "x = 3",
            correctAnswer: "x = 3",
            isCorrect: true
          },
          {
            question: "Найдите корни квадратного уравнения: x² - 4x + 4 = 0",
            userAnswer: "x₁ = 1, x₂ = 3",
            correctAnswer: "x = 2 (корень кратности 2)",
            isCorrect: false
          }
        ]
      },
      {
        id: 1,
        title: "Биология: Клеточное строение",
        date: "2023-05-23",
        score: 9,
        total: 10,
        details: [
          {
            question: "Что такое клетка?",
            userAnswer: "Основная структурная и функциональная единица всех живых организмов",
            correctAnswer: "Основная структурная и функциональная единица всех живых организмов",
            isCorrect: true
          },
          {
            question: "Какая органелла отвечает за синтез белка в клетке?",
            userAnswer: "Митохондрия",
            correctAnswer: "Рибосома",
            isCorrect: false
          }
        ]
      },
      {
        id: 2,
        title: "История: Древний Египет",
        date: "2023-05-18",
        score: 3,
        total: 5,
        details: [
          {
            question: "В каком году началось правление Рамзеса II?",
            userAnswer: "1279 г. до н.э.",
            correctAnswer: "1279 г. до н.э.",
            isCorrect: true
          },
          {
            question: "Кто построил Великую пирамиду в Гизе?",
            userAnswer: "Тутанхамон",
            correctAnswer: "Хеопс (Хуфу)",
            isCorrect: false
          }
        ]
      }
    ];

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
    container.innerHTML = '<div class="result-quiz-name" style="font-weight:400;" >Нет результатов.</div>';
    updatePagination();
    return;
  }

  container.innerHTML = paginatedResults.map(result => {
    const percentage = Math.round((result.score / result.total) * 100);
    const color = percentage >= 80 ? 'green' : 
                  percentage >= 50 ? 'yellow' : 'red';

    const detailsHtml = result.details.map(detail => `
      <div class="${detail.isCorrect ? 'green-border' : 'red-border'}">
        <p class="font-medium">${detail.question}</p>
        <div class="mt-1 text-sm">
          <p><span class="font-semibold">Ваш ответ:</span> ${detail.userAnswer}</p>
          <p class="${detail.isCorrect ? 'text-green-700' : 'text-red-700'}">
            <span class="font-semibold">Правильный ответ:</span> ${detail.correctAnswer}
          </p>
        </div>
      </div>
    `).join('');

    return `
      <div class="results-quiz-container">
        <div class="results-items-container">

            <div style="min-width: 30%;" >
                <div class="result-quiz-name">${result.title}</div>
                <p class="result-quiz-data">Пройден: ${formatDate(result.date)}</p>

                <div class="score-display">
                <div class="progress-bar">
                    <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                </div>
                <span class="score-text">${result.score}/${result.total} (${percentage}%)</span>
                </div>

            </div>
            <div style="align-self: center;" ">
                <button class="results-search-btn-details" onclick="toggleDetails('details-${result.id}')">Подробнее</button>
            </div>


        </div>
        <div id="details-${result.id}" class="hidden mt-4 pt-4 border-t border-gray-200">
          <h3 class="font-medium mb-2">Детальные результаты:</h3>
          <div class="space-y-3">${detailsHtml}</div>
        </div>
      </div>
    `;
  }).join('');

  updatePagination();
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
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'score-desc':
      sorted.sort((a, b) => (b.score / b.total) - (a.score / a.total));
      break;
    case 'score-asc':
      sorted.sort((a, b) => (a.score / a.total) - (b.score / b.total));
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

// Вспомогательные функции
function toggleDetails(id) {
  const element = document.getElementById(id);
  element.classList.toggle('hidden');
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