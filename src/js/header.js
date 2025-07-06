document.addEventListener('DOMContentLoaded', function () {
  const menuButton = document.querySelector('.menu-button');
  const closeButton = document.querySelector('.close-button');
  const mobileMenu = document.getElementById('mobileMenu');
  const checkboxes = document.querySelectorAll('.custom-checkbox');

  // Toggle mobile menu
  menuButton.addEventListener('click', function () {
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu
  closeButton.addEventListener('click', function () {
    mobileMenu.classList.remove('open');
  });

  // Toggle checkboxes
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('click', function (e) {
      e.stopPropagation();
      this.classList.toggle('checked');
    });
  });

  // Close modal when clicking outside
  document.addEventListener('click', function (event) {
    if (!mobileMenu.contains(event.target) && event.target !== menuButton) {
      mobileMenu.classList.remove('open');
    }
  });
});
