document.addEventListener('DOMContentLoaded', function() {
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.mobile-menu-overlay');
  const body = document.body;

  if (burgerMenu) {
    burgerMenu.addEventListener('click', function() {
      body.classList.toggle('menu-open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function() {
      body.classList.remove('menu-open');
    });
  }

  // Закрытие меню при клике на ссылку
  document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      body.classList.remove('menu-open');
    });
  });
});

// Глобальные переменные
let quizStatistics = null;
let currentPage = 1;
const resultsPerPage = 3;

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
    
    // Если токен недействителен, редиректим на авторизацию
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = 'auth.html';
        return null;
    }
    
    return response;
}

// Загрузка статистики квиза с сервера
async function loadQuizStatistics() {
    try {
        const quizId = localStorage.getItem('currentQuizId');
        
        if (!quizId) {
            showNotification('ID квиза не найден', 'error');
            setTimeout(() => {
                window.location.href = 'my_quizzes.html';
            }, 2000);
            return;
        }

        // Показываем индикатор загрузки
        const container = document.getElementById('results-container');
        const infoContainer = document.getElementById('statistics-info-container');
        
        if (container) container.innerHTML = '<div class="loading">Загрузка статистики...</div>';
        if (infoContainer) infoContainer.innerHTML = '<div class="loading">Загрузка информации...</div>';

        console.log('Запрашиваем статистику для квиза:', quizId);

        // Загружаем данные с сервера
        const response = await fetchWithAuth(`/quizzes/${quizId}/statistics`);
        
        if (!response || !response.ok) {
            const errorText = await response.text();
            console.error('Ошибка ответа сервера:', response.status, errorText);
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        quizStatistics = await response.json();
        console.log('Получена статистика:', quizStatistics);
        
        // Отображаем данные
        displayQuizStatistics();
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        showNotification('Не удалось загрузить статистику квиза', 'error');
        
        // Возвращаемся на страницу квизов через 3 секунды
        setTimeout(() => {
            window.location.href = 'my_quizzes.html';
        }, 3000);
    }
}

// Отображение статистики квиза
function displayQuizStatistics() {
    if (!quizStatistics) {
        showNotification('Данные статистики не загружены', 'error');
        return;
    }

    // Отображаем информацию о квизе
    displayQuizInfo();
    
    // Отображаем участников
    displayParticipants();
    
    // Обновляем пагинацию
    updatePagination();
}

// Отображение информации о квизе
function displayQuizInfo() {
    const container = document.getElementById('statistics-info-container');
    if (!container) return;

    container.innerHTML = `
        <div class="row-container">
            <div class="result-quiz-name" style="margin-bottom:0;">${quizStatistics.title}</div>
            <div>Код доступа: <span style="font-weight: 600;">${quizStatistics.code}</span></div>
        </div>
        <div class="statistics-info-details" style="margin-bottom: 20px;">
            <div class="statistics-info-details-item">
                <p class="statistics-info-text">Дата создания: <span style="font-weight:500;">${formatDate(quizStatistics.createdAt)}</span></p>
            </div>
            <div class="statistics-info-details-item">
                <p class="statistics-info-text">Количество вопросов: <span style="font-weight:500;">${quizStatistics.stats.questionsCount}</span></p>
            </div>
        </div>
        <div class="statistics-info-details">
            <div class="statistics-info-details-item">
                <div class="blue-border" style="padding: 10px 15px; color:rgb(51, 99, 220); font-size: 30px;">
                    <p style="font-weight: 600;">${quizStatistics.stats.participantsCount}</p>
                    <p class="statistics-info-text">Всего участников</p>
                </div>
            </div>
            <div class="statistics-info-details-item">
                <div class="green-border" style="padding: 10px 15px; color:rgb(22, 163, 74); font-size: 30px;">
                    <p style="font-weight: 600;">${quizStatistics.stats.averageScore}%</p>
                    <p class="statistics-info-text">Средний результат</p>
                </div>
            </div>
        </div>
    `;
}

// Отображение участников
function displayParticipants() {
    const filteredResults = filterResultsBySearch();
    const filteredScore = scoreFilter(filteredResults);
    const sortedResults = sortResults(filteredScore);

    const startIndex = (currentPage - 1) * resultsPerPage;
    const paginatedResults = sortedResults.slice(startIndex, startIndex + resultsPerPage);

    const container = document.getElementById('results-container');
    if (!container) return;

    if (paginatedResults.length === 0) {
        container.innerHTML = '<div class="result-quiz-name" style="font-weight:400; padding: 20px;">Нет участников или результатов.</div>';
        return;
    }

    container.innerHTML = paginatedResults.map(participant => {
        const percentage = Math.round((participant.score / participant.total) * 100);
        const color = percentage >= 80 ? 'green' : 
                     percentage >= 50 ? 'yellow' : 'red';

        return `
            <div class="statistics-participants-container">
                <div class="statistic-participants-container-item" style="align-items: start;">
                    <div style="font-weight:500;">${participant.name}</div>
                    <div style="font-size: 14px; color: rgb(107, 114 ,128);">${participant.email}</div>
                </div>
                <div class="statistic-participants-container-item">${formatDate(participant.completionDate)}</div>
                <div class="statistic-participants-container-item score-display" style="flex-direction: row; column-gap: 10px;">
                    <span class="score-text" style="font-size: 14px;">${participant.score}/${participant.total}</span>
                    <div class="progress-bar">
                        <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Фильтрация по поиску
function filterResultsBySearch() {
    if (!quizStatistics || !quizStatistics.participants) {
        return [];
    }

    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    return quizStatistics.participants.filter(participant => 
        participant.name.toLowerCase().includes(searchTerm) ||
        participant.email.toLowerCase().includes(searchTerm)
    );
}

// Фильтрация по баллам
function scoreFilter(filtered = []) {
    const filterSelect = document.getElementById('filter-select');
    if (!filterSelect) return filtered;

    const filterValue = filterSelect.value;
    let participants = [...filtered];

    switch (filterValue) {
        case 'high':
            participants = participants.filter(p => (p.score / p.total) * 100 >= 80);
            break;
        case 'medium':
            participants = participants.filter(p => {
                const percentage = (p.score / p.total) * 100;
                return percentage >= 50 && percentage < 80;
            });
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
function sortResults(sorted = []) {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return sorted;

    const sortBy = sortSelect.value;
    let results = [...sorted];

    switch (sortBy) {
        case 'date-desc':
            results.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));
            break;
        case 'date-asc':
            results.sort((a, b) => new Date(a.completionDate) - new Date(b.completionDate));
            break;
        case 'score-desc':
            results.sort((a, b) => (b.score / b.total) - (a.score / a.total));
            break;
        case 'score-asc':
            results.sort((a, b) => (a.score / a.total) - (b.score / b.total));
            break;
        case 'name-desc':
            results.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'name-asc':
        default:
            results.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    return results;
}

// Пагинация
function nextPage() {
    const totalResults = filterResultsBySearch().length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        displayParticipants();
        updatePagination();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayParticipants();
        updatePagination();
    }
}

function updatePagination() {
    const totalResults = filterResultsBySearch().length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const pagination = document.getElementById('pagination');

    if (pageInfo) {
        pageInfo.textContent = `${currentPage} / ${Math.max(totalPages, 1)}`;
    }

    if (pagination) {
        if (totalPages <= 1) {
            pagination.classList.add('hidden');
        } else {
            pagination.classList.remove('hidden');
            
            if (prevButton) {
                if (currentPage === 1) {
                    prevButton.classList.add('disabled');
                } else {
                    prevButton.classList.remove('disabled');
                }
            }
            
            if (nextButton) {
                if (currentPage >= totalPages) {
                    nextButton.classList.add('disabled');
                } else {
                    nextButton.classList.remove('disabled');
                }
            }
        }
    }
}

// Форматирование даты
function formatDate(dateString) {
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const backgroundColor = type === 'error' ? '#f8d7da' : 
                           type === 'success' ? '#d4edda' : '#d1ecf1';
    const borderColor = type === 'error' ? '#f5c6cb' : 
                       type === 'success' ? '#c3e6cb' : '#bee5eb';
    const textColor = type === 'error' ? '#721c24' : 
                     type === 'success' ? '#155724' : '#0c5460';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${backgroundColor};
        border: 1px solid ${borderColor};
        color: ${textColor};
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
        cursor: pointer;
        animation: slideInRight 0.3s ease-out;
    `;
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

// Обработка поиска и фильтров
function handleSearch() {
    currentPage = 1;
    displayParticipants();
    updatePagination();
}

function handleFilterChange() {
    currentPage = 1;
    displayParticipants();
    updatePagination();
}

// Глобальные функции для HTML
window.nextPage = nextPage;
window.prevPage = prevPage;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию
    if (!checkAuthAndRedirect()) {
        return;
    }

    // Устанавливаем обработчики событий
    const searchButton = document.getElementById('result-search-btn');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const sortSelect = document.getElementById('sort-select');

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilterChange);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', handleFilterChange);
    }
    
    // Загружаем статистику
    await loadQuizStatistics();
});
