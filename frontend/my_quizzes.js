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

// Глобальные переменные
let quizResults = [];
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

// Загрузка квизов с сервера
async function loadQuizzesFromServer() {
    try {
        const response = await fetchWithAuth('/quizzes/');
        
        if (!response || !response.ok) {
            throw new Error('Ошибка загрузки квизов');
        }
        
        const data = await response.json();
        
        // Преобразуем данные с сервера в формат, ожидаемый фронтендом
        quizResults = data.quizzes.map(quiz => ({
            id: quiz.id.toString(),
            title: quiz.name,
            createdAt: quiz.createdAt,
            code: quiz.connectionCode,
            isOpened: quiz.isOpened,
            isClosed: quiz.isClosed,
            question_count: 0,
            stats: {
                totalAttempts: 0,
                averageScore: 0,
                bestScore: 0
            }
        }));
        
        return quizResults;
        
    } catch (error) {
        console.error('Ошибка загрузки квизов:', error);
        showErrorMessage('Не удалось загрузить квизы. Попробуйте обновить страницу.');
        return [];
    }
}

// Загрузка и отображение результатов
async function loadResults() {
    if (!checkAuthAndRedirect()) {
        return;
    }

    const container = document.getElementById('results-container');
    container.innerHTML = '<div class="loading">Загрузка...</div>';

    await loadQuizzesFromServer();

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
        const statusButton = getStatusButton(result);
        
        return `
            <div class="results-quiz-container">
                <div class="results-items-container">
                    <div>
                        <div class="result-quiz-name">${result.title}</div>
                        <p class="result-quiz-data">Создан: ${result.createdAt}</p>
                        <p class="result-quiz-data">Код доступа: ${result.code}</p>
                        <p class="result-quiz-data">Статус: ${getStatusText(result)}</p>
                    </div>
                    <div id="my-quizzes-btn-container">
                        ${statusButton}
                        <button class="my-quizess-btn btn-yellow" id="btn-statistic-${result.id}" onclick="openQuizStatistics('${result.id}')">Статистика</button>
                        <button class="my-quizess-btn btn-red" id="btn-remove-${result.id}" onclick="removeQuiz('${result.id}')">Удалить</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updatePagination();
}

// Получение кнопки статуса квиза
function getStatusButton(quiz) {
    if (quiz.isOpened) {
        return `<button class="my-quizess-btn btn-orange" id="btn-status-${quiz.id}" onclick="toggleQuizStatus('${quiz.id}', 'close')">Закрыть</button>`;
    } else if (quiz.isClosed) {
        return `<button class="my-quizess-btn btn-green" id="btn-status-${quiz.id}" onclick="toggleQuizStatus('${quiz.id}', 'open')">Открыть</button>`;
    } else {
        return `<button class="my-quizess-btn btn-green" id="btn-status-${quiz.id}" onclick="toggleQuizStatus('${quiz.id}', 'open')">Открыть</button>`;
    }
}

// Получение текста статуса
function getStatusText(quiz) {
    if (quiz.isOpened) {
        return '<span style="color: green;">Открыт</span>';
    } else if (quiz.isClosed) {
        return '<span style="color: red;">Закрыт</span>';
    } else {
        return '<span style="color: red;">Закрыт</span>';
    }
}

// Изменение статуса квиза
window.toggleQuizStatus = async function(quizId, action) {
    try {
        const response = await fetchWithAuth(`/quizzes/${quizId}/status?action=${action}`, {
            method: 'PATCH'
        });

        if (!response || !response.ok) {
            throw new Error('Ошибка изменения статуса квиза');
        }

        const result = await response.json();
        showSuccessMessage(result.detail);
        
        // Перезагружаем данные
        await loadResults();
        
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
        showErrorMessage('Не удалось изменить статус квиза');
    }
};

// Редактирование квиза
window.editQuiz = function(quizId) {
    const quizToEdit = quizResults.find(quiz => quiz.id === quizId);
    
    if (!quizToEdit) {
        console.error('Quiz not found');
        return;
    }

    // Сохраняем ID квиза для редактирования
    sessionStorage.setItem('editQuizId', quizId);
    
    window.location.href = 'create_quiz.html?mode=edit&id=' + quizId;
};

function openQuizStatistics(quizId) {
    // Сохраняем ID квиза в localStorage
    localStorage.setItem('currentQuizId', quizId);
    
    // Переходим на страницу статистики
    window.location.href = 'statistics.html';
}

// Обновляем глобальную область видимости функции
window.openQuizStatistics = openQuizStatistics;

// Удаление квиза
window.removeQuiz = function(quizId) {
    const quizToRemove = quizResults.find(quiz => quiz.id === quizId);

    if (!quizToRemove) {
        console.error('Quiz not found');
        return;
    }

    // Сохраняем ID для удаления
    window.currentQuizToRemove = quizId;
    showConfirmationModal();
};

// Показ модального окна подтверждения удаления
function showConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('hidden');
    
    // Обработчики для кнопок
    document.getElementById('remove-quiz').onclick = async function() {
        modal.classList.add('hidden');
        await deleteQuiz(window.currentQuizToRemove);
    };
    
    document.getElementById('cancel-remove-quiz').onclick = function() {
        modal.classList.add('hidden');
        window.currentQuizToRemove = null;
    };
}

// Удаление квиза на сервере
async function deleteQuiz(quizId) {
    try {
        const response = await fetchWithAuth(`/quizzes/${quizId}`, {
            method: 'DELETE'
        });

        if (!response || !response.ok) {
            throw new Error('Ошибка удаления квиза');
        }

        const result = await response.json();
        showSuccessMessage(result.detail);
        
        // Перезагружаем данные
        await loadResults();
        
    } catch (error) {
        console.error('Ошибка удаления квиза:', error);
        showErrorMessage('Не удалось удалить квиз');
    }
}

// Фильтрация по поиску
function filterResultsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    return quizResults.filter(result => 
        result.title.toLowerCase().includes(searchTerm)
    );
}

function parseServerDate(dateString) {
    // Парсим формат "dd.mm.yy hh:mm"
    if (!dateString || typeof dateString !== 'string') {
        return new Date(0); // Возвращаем минимальную дату если дата невалидна
    }
    
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = (timePart || '00:00').split(':');
        
        // Преобразуем 2-значный год в 4-значный
        const fullYear = parseInt(year) + (parseInt(year) > 50 ? 1900 : 2000);
        
        return new Date(fullYear, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    } catch (error) {
        console.error('Ошибка парсинга даты:', dateString, error);
        return new Date(0);
    }
}

// Сортировка
function sortResults(results = quizResults) {
    const sortBy = document.getElementById('sort-select').value;
    let sorted = [...results];

    switch (sortBy) {
        case 'date-desc':
            // Для уже отформатированных дат с сервера используем строковую сортировку
            sorted.sort((a, b) => {
                // Преобразуем дату обратно для сортировки
                const dateA = parseServerDate(a.createdAt);
                const dateB = parseServerDate(b.createdAt);
                return dateB - dateA;
            });
            break;
        case 'date-asc':
            sorted.sort((a, b) => {
                const dateA = parseServerDate(a.createdAt);
                const dateB = parseServerDate(b.createdAt);
                return dateA - dateB;
            });
            break;
        case 'score-desc':
            sorted.sort((a, b) => (b.stats?.averageScore || 0) - (a.stats?.averageScore || 0));
            break;
        case 'score-asc':
            sorted.sort((a, b) => (a.stats?.averageScore || 0) - (b.stats?.averageScore || 0));
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

// Функции для показа уведомлений
function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
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
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 300px;
        font-size: 14px;
        cursor: pointer;
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию
    if (!checkAuthAndRedirect()) {
        return;
    }

    // Обработчики событий
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
    
    // Первоначальная загрузка
    await loadResults();
});

// Функция выхода из системы (если потребуется)
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = 'auth.html';
}
