document.addEventListener("DOMContentLoaded", () => {
    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');

    const countCreatedEl = document.querySelector('.statistics p:nth-child(2) span');
    const countCompletedEl = document.querySelector('.statistics p:nth-child(3) span');
    const percentageEl = document.querySelector('.statistics p:nth-child(4) span');

    const profileImageNameEl = document.querySelector('.profile-image-name');

    // Путь к JSON-файлу
    fetch('user.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            return response.json();
        })
        .then(data => {
            // Заполняем поля
            if (usernameEl) usernameEl.value = data.username;
            if (emailEl) emailEl.value = data.email;

            if (countCreatedEl) countCreatedEl.textContent = data.countCreated;
            if (countCompletedEl) countCompletedEl.textContent = data.countCompleted;
            if (percentageEl) percentageEl.textContent = `${data.percentage}%`;

            // Имя пользователя в аватарке
            if (profileImageNameEl && data.username) {
                profileImageNameEl.textContent = data.username.charAt(0).toUpperCase();
            }

        })
        .catch(error => {
            console.error('Не удалось загрузить данные:', error);

            // Если ошибка, можно показать сообщение или использовать fallback
            if (countCreatedEl) countCreatedEl.textContent = '—';
            if (countCompletedEl) countCompletedEl.textContent = '—';
            if (percentageEl) percentageEl.textContent = '—%';
        });
});

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