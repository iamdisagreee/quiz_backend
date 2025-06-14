let quizResults = [];

// Функции авторизации (если не подключен auth-check.js)
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

// Инициализация
document.addEventListener('DOMContentLoaded', function () {
  // Проверяем авторизацию
  if (!checkAuthAndRedirect()) {
    return;
  }

  // Инициализируем бургер-меню
  initBurgerMenu();

  // Устанавливаем обработчики событий
  setupEventHandlers();

  // Загружаем результаты
  loadResults();
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

// Установка обработчиков событий
function setupEventHandlers() {
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

  document.getElementById('sort-select').addEventListener('change', () => {
    currentPage = 1;
    loadResults();
  });
}

let currentPage = 1;
const resultsPerPage = 3;

// Проверка подключения к API
async function checkApiConnection() {
    try {
        const response = await fetchWithAuth('/users/me/stats');
        if (!response || !response.ok) {
            throw new Error('API недоступен');
        }
        return true;
    } catch (error) {
        console.error('Проблема с подключением к API:', error);
        showErrorMessage('Проблема с подключением к серверу. Проверьте соединение.');
        return false;
    }
}

// Обработка пустого состояния
function showEmptyState() {
    const container = document.getElementById('results-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
            <h3 style="margin-bottom: 10px; color: #333;">Пока нет результатов</h3>
            <p style="margin-bottom: 30px;">Пройдите первый квиз, чтобы увидеть здесь результаты</p>
            <a href="run_quiz.html" style="
                background: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 25px;
                border-radius: 6px;
                display: inline-block;
                font-weight: 500;
            ">Найти квиз</a>
        </div>
    `;
}

// Улучшенная обработка ошибок загрузки
async function loadResultsFromServer() {
    try {
        // Проверяем соединение
        const isConnected = await checkApiConnection();
        if (!isConnected) {
            return [];
        }

        showLoadingMessage('Загрузка результатов...');
        
        const response = await fetchWithAuth('/users/me/results');
        
        if (!response) {
            throw new Error('Нет ответа от сервера');
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Ошибка ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем структуру ответа
        if (!data || !Array.isArray(data.results)) {
            throw new Error('Неверный формат данных от сервера');
        }
        
        // Обновляем глобальную переменную
        quizResults = data.results;
        
        hideLoadingMessage();
        
        // Если результатов нет, показываем пустое состояние
        if (quizResults.length === 0) {
            showEmptyState();
            updatePagination();
            return [];
        }
        
        return quizResults;
        
    } catch (error) {
        console.error('Ошибка загрузки результатов:', error);
        hideLoadingMessage();
        
        // Показываем конкретную ошибку
        if (error.message.includes('401') || error.message.includes('авторизац')) {
            showErrorMessage('Сессия истекла. Необходимо войти заново.');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        } else {
            showErrorMessage(`Ошибка загрузки: ${error.message}`);
        }
        
        return [];
    }
}

// Загрузка и отображение данных
// Обновленная функция загрузки с лучшей обработкой состояний  
async function loadResults() {
    const container = document.getElementById('results-container');
    
    // Показываем индикатор загрузки
    container.innerHTML = `
        <div class="loading">
            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
            Загрузка результатов...
        </div>
    `;

    // Загружаем данные с сервера
    await loadResultsFromServer();

    // Если данные не загрузились или загрузилось пустое состояние, выходим
    if (quizResults.length === 0) {
        return;
    }

    // Продолжаем обычную обработку
    container.innerHTML = '';

    const filteredResults = filterResultsBySearch();
    const sortedResults = sortResults(filteredResults);

    const startIndex = (currentPage - 1) * resultsPerPage;
    const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

    if (paginatedResults.length === 0 && filteredResults.length > 0) {
        // Есть данные, но не на этой странице - переходим на первую
        currentPage = 1;
        loadResults();
        return;
    }

    if (paginatedResults.length === 0) {
        container.innerHTML = '<div class="result-quiz-name" style="font-weight:400;">По вашему запросу ничего не найдено.</div>';
        updatePagination();
        return;
    }

    // Рендерим результаты
    container.innerHTML = paginatedResults.map(result => {
        const percentage = Math.round((result.score / result.total) * 100);
        const color = percentage >= 80 ? 'green' : 
                      percentage >= 50 ? 'yellow' : 'red';

        return `
            <div class="results-quiz-container">
                <div class="results-items-container">
                    <div class="results-items-container-items">
                        <div class="result-quiz-name">${result.title}</div>
                        <p class="result-quiz-data">Пройден: ${formatDate(result.date)}</p>
                    </div>
                    <div class="results-items-container-items" style="justify-items: end; display:flex; align-items:center;">
                        <div class="score-display">
                            <div class="progress-bar">
                                <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                            </div>
                            <span class="score-text">${result.score}/${result.total}</span>
                        </div>
                        <button class="results-details-btn" onclick="showResultDetails(${result.id})">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updatePagination();
}

// Добавляем CSS анимацию для спиннера
if (!document.querySelector('#spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Показ деталей результата
window.showResultDetails = function (resultId) {
  const result = quizResults.find(r => r.id === resultId);
  if (!result) {
    console.error('Result not found:', resultId);
    return;
  }

  showDetailsModal(result);
};

// Модальное окно с деталями
function showDetailsModal(result) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

  const percentage = Math.round((result.score / result.total) * 100);
  const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';

  modal.innerHTML = `
    <div class="modal-content" style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        width: 100%;
    ">
        <div class="modal-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
        ">
            <div>
                <h2 style="margin: 0; color: #333;">${result.title}</h2>
                <p style="margin: 5px 0 0 0; color: #666;">Пройден: ${formatDate(result.date)}</p>
            </div>
            <button class="close-modal" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                padding: 5px;
            " onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        
        <div class="result-summary" style="
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            text-align: center;
        ">
            <div class="score-display-large" style="margin-bottom: 15px;">
                <div class="progress-bar" style="
                    width: 200px;
                    height: 20px;
                    background-color: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 0 auto 10px;
                    position: relative;
                ">
                    <div class="progress-fill ${color}" style="
                        width: ${percentage}%;
                        height: 100%;
                        background-color: ${getColorValue(color)};
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div style="font-size: 24px; font-weight: bold; color: #333;">
                    ${result.score} из ${result.total} (${percentage}%)
                </div>
            </div>
        </div>
        
        <div class="questions-details">
            <h3 style="margin-bottom: 20px; color: #333;">Детальные результаты:</h3>
            ${result.details.map((detail, index) => `
                <div class="question-detail" style="
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 15px;
                    background: ${detail.isCorrect ? '#f8fff8' : '#fff8f8'};
                ">
                    <div class="question-header" style="
                        display: flex;
                        align-items: center;
                        margin-bottom: 15px;
                    ">
                        <span class="question-number" style="
                            background: ${detail.isCorrect ? '#28a745' : '#dc3545'};
                            color: white;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            font-weight: bold;
                            margin-right: 10px;
                        ">${index + 1}</span>
                        <span class="question-status" style="
                            color: ${detail.isCorrect ? '#28a745' : '#dc3545'};
                            font-weight: bold;
                        ">${detail.isCorrect ? '✓ Правильно' : '✗ Неправильно'}</span>
                    </div>
                    
                    <div class="question-text" style="
                        font-weight: bold;
                        margin-bottom: 12px;
                        color: #333;
                        font-size: 16px;
                    ">${detail.question}</div>
                    
                    <div class="answer-section">
                        <div class="user-answer" style="margin-bottom: 8px;">
                            <strong style="color: #666;">Ваш ответ:</strong> 
                            <span style="color: ${detail.isCorrect ? '#28a745' : '#dc3545'}; font-weight: 500;">
                                ${detail.userAnswer || 'Не отвечено'}
                            </span>
                        </div>
                        ${!detail.isCorrect ? `
                            <div class="correct-answer">
                                <strong style="color: #666;">Правильный ответ:</strong> 
                                <span style="color: #28a745; font-weight: 500;">
                                    ${detail.correctAnswer}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="modal-footer" style="
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        ">
            <button onclick="this.closest('.modal-overlay').remove()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
            ">Закрыть</button>
        </div>
    </div>
`;

  // Закрытие по клику на фон
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  });

  document.body.appendChild(modal);
}

// Получение значения цвета
function getColorValue(color) {
  switch (color) {
    case 'green': return '#28a745';
    case 'yellow': return '#ffc107';
    case 'red': return '#dc3545';
    default: return '#6c757d';
  }
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
  } else {
    pagination.classList.remove('hidden');
    if (currentPage === 1) {
      prevButton.classList.add('disabled');
    } else {
      prevButton.classList.remove('disabled');
    }

    if (currentPage >= totalPages) {
      nextButton.classList.add('disabled');
    } else {
      nextButton.classList.remove('disabled');
    }
  }
}

// Форматирование даты
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('ru-RU', options);
}

// Функции для показа уведомлений и загрузки
function showLoadingMessage(message) {
  console.log('Loading:', message);
}

function hideLoadingMessage() {
  console.log('Loading finished');
}

function showErrorMessage(message) {
  showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
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
`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);

  notification.addEventListener('click', () => {
    notification.remove();
  });
}

function logout() {
  localStorage.removeItem('access_token');
  window.location.href = 'auth.html';
}
