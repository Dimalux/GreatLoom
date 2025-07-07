import {
  getCategoryList,
  getTopBooks,
  getBooksByCategory
} from './api.js';

const bookList = document.getElementById('book-list');
const showMoreBtn = document.getElementById('show-more-btn');
const showingCountSpan = document.getElementById('showing-count');
const totalCountSpan = document.getElementById('total-count');
const categoryButtons = document.querySelectorAll('.book-category-btn');

let allBooks = [];
let currentIndex = 0;
let isInitialRender = true;

// #region Функции.

// #region Для рендеринга.

// #region Кнопки категорий.
function disableCategoryButtons() {
  categoryButtons.forEach(btn => btn.disabled = true);
}
function enableCategoryButtons() {
  categoryButtons.forEach(btn => btn.disabled = false);
}
// #endregion
// #region Кнопка Show More.
function showShowMoreBtn() {
  showMoreBtn.classList.remove("book-visually-hidden");
}
function hideShowMoreBtn() {
  showMoreBtn.classList.add("book-visually-hidden");
}
// #endregion

function renderBooks() {
  const booksToRenderCount = isInitialRender 
    ? (window.innerWidth < 768 ? 10 : 24)
    : 4;

  const nextBooks = allBooks.slice(currentIndex, currentIndex + booksToRenderCount);

  nextBooks.forEach(book => {
    const li = document.createElement('li');
    li.classList.add('book-card');
    li.innerHTML = `
      <img src="${book.book_image}" alt="${book.title}" />
      <div class="book-info">
        <h4 class="book-title">${book.title}</h4>
        <p class="book-author">${book.author}</p>
      </div>
      <p class="book-price">$${book.price ?? 'N/A'}</p>
      <button class="book-learn-btn" data-id="${book._id}">Learn More</button>
    `;
    bookList.appendChild(li);
  });

  currentIndex += booksToRenderCount;
  showingCountSpan.textContent = Math.min(currentIndex, allBooks.length);

  if (currentIndex >= allBooks.length) {
    showMoreBtn.classList.add("book-visually-hidden");
  }

  isInitialRender = false;
}

async function renderShowMoreBtn() {
  hideShowMoreBtn();
  renderBooks();
  showShowMoreBtn();
}
// #endregion

async function showTopBooksByCategory(category) {
  try {
    // Скрываем кнопку при переходе на категорию.
    showMoreBtn.classList.add("book-visually-hidden");

    const topBooksData = await getTopBooks();
    const categoryTop = topBooksData.find(cat => 
      cat.list_name.toLowerCase() === category.toLowerCase()
    );

    if (!categoryTop) {
      bookList.innerHTML = '<p>No books found for this category.</p>';
      totalCountSpan.textContent = 0;
      showingCountSpan.textContent = 0;
      showMoreBtn.style.display = 'none';
      return;
    }

    allBooks = categoryTop.books;
    totalCountSpan.textContent = allBooks.length;
    renderBooks();

    // Скрываем кнопку "Show More", так как это ограниченный список.
    if (currentIndex >= allBooks.length) {
      hideShowMoreBtn();
    } else {
      showShowMoreBtn();
    }

  } catch (error) {
    console.error('Ошибка при загрузке книг категории:', error);
  }
}

async function initBooks() {
  showMoreBtn.classList.add("book-visually-hidden");
  disableCategoryButtons();

  // Получаем топ книги
  const topBooksData = await getTopBooks();
  const topBooks = topBooksData.flatMap(category => category.books);

  // Получаем список категорий
  const categories = await getCategoryList();

  // Получаем книги из всех категорий
  const allRequests = categories.map(cat => getBooksByCategory(cat.list_name));
  const results = await Promise.all(allRequests);

  // Удаляем дубликаты из топ-книг и книг по категориям
  const rawBooks = results.flat();
  const uniqueBooksMap = new Map();

  // Добавляем сначала топ-книги (в приоритете)
  topBooks.forEach(book => {
    uniqueBooksMap.set(book._id, book);
  });

  // Добавляем остальные книги, если их нет среди топов
  rawBooks.forEach(book => {
    if (!uniqueBooksMap.has(book._id)) {
      uniqueBooksMap.set(book._id, book);
    }
  });

  allBooks = Array.from(uniqueBooksMap.values());

  totalCountSpan.textContent = allBooks.length;
  renderBooks();

  // Показываем кнопку "Show More", если есть что еще показывать
  if (currentIndex >= allBooks.length) {
    hideShowMoreBtn();
  } else {
    showShowMoreBtn();
  }

  enableCategoryButtons();
}
// #endregion

categoryButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const selectedCategory = button.getAttribute('data-category');

    disableCategoryButtons();

    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    bookList.innerHTML = '';
    currentIndex = 0;
    isInitialRender = true;

    if (selectedCategory === 'all') {
      await initBooks();
    } else {
      await showTopBooksByCategory(selectedCategory);
      enableCategoryButtons();
    }
  });
});

showMoreBtn.addEventListener('click', renderShowMoreBtn);

initBooks();