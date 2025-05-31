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