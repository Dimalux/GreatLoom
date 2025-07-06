import Accordion from 'accordion-js';
import 'accordion-js/dist/accordion.min.css';
import { getBookDetails } from './api';
import '../css/modal-window.css';

// console.log('Modal script подключился!');

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.querySelector('.modal-backdrop');
  const quantityEl = document.getElementById('quantity');
  const closeBtn = document.querySelector('.modal-close');

  let currentQuantity = 1;

  if (!backdrop || !quantityEl || !closeBtn) {
    console.warn('Элементы модалки не найдены');
    return;
  }

  // Делегирование для любых кнопок внутри страницы с data-id
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;

    const bookId = btn.dataset.id;
    // console.log('Клик по кнопке с id:', bookId);
    if (bookId) openModal(bookId);
  });

  // Клик по затемнению или крестику — закрыть модалку
  backdrop.addEventListener('click', e => {
    if (
      e.target.classList.contains('modal-backdrop') ||
      e.target.closest('.modal-close')
    ) {
      closeModal();
    }
  });

  // Закрытие по Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Управление количеством
  document.addEventListener('click', e => {
    if (e.target.classList.contains('decrement')) decreaseQuantity();
    if (e.target.classList.contains('increment')) increaseQuantity();
    if (e.target.classList.contains('add-to-cart')) addToCart();
    if (e.target.classList.contains('buy-now')) buyNow(e);
  });

  // убираем баг с дублированием аккордеонов при открытии
  let accordionInstance = null;

  async function openModal(bookId) {
    const data = await getBookDetails(bookId);
    if (!data) {
      console.warn('Нет данных по книге');
      return;
    }

    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-author').textContent = data.author;
    document.getElementById('modal-price').textContent = `$${data.price}`;
    document.getElementById('modal-book-image').src = data.book_image;
    document.getElementById('modal-book-image').alt = data.title;
    document.getElementById('details-text').textContent =
      data.description || 'No description';
    document.getElementById('shipping-text').textContent =
      'We ship across the United States within 2–5 business days. All orders are processed through USPS or a reliable courier service. Enjoy free standard shipping on orders over $50.';
    document.getElementById('returns-text').textContent =
      'You can return an item within 14 days of receiving your order, provided it hasn’t been used and is in its original condition. To start a return, please contact our support team — we’ll guide you through the process quickly and hassle-free.';

    quantityEl.textContent = 1;
    currentQuantity = 1;

    backdrop.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';

    // Если аккордеон уже существует — уничтожаем
    if (accordionInstance) {
      accordionInstance.destroy();

      // Жёсткий сброс инлайн-стилей
      document.querySelectorAll('.ac-panel').forEach(panel => {
        panel.style.height = '';
        panel.style.display = '';
      });
    }

    // Создаём новый аккордеон и сохраняем в переменную
    accordionInstance = new Accordion('#accordion', {
      duration: 300,
      showMultiple: true,
      openOnInit: [0],
    });
  }

  function closeModal() {
    backdrop.classList.add('is-hidden');
    document.body.style.overflow = '';
    // Уничтожаем аккордеон и чистим стили при закрытии
    if (accordionInstance) {
      accordionInstance.destroy();
      accordionInstance = null;

      document.querySelectorAll('.ac-panel').forEach(panel => {
        panel.style.height = '';
        panel.style.display = '';
      });
    }
  }

  function increaseQuantity() {
    currentQuantity++;
    quantityEl.textContent = currentQuantity;
  }

  function decreaseQuantity() {
    if (currentQuantity > 1) {
      currentQuantity--;
      quantityEl.textContent = currentQuantity;
    }
  }

  function addToCart() {
    console.log(`Додано у корзину: ${currentQuantity} шт.`);
  }

  function buyNow(e) {
    e.preventDefault();
    alert('Дякуємо за покупку');
  }
});
