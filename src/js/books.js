import {
  getCategoryList,
  getTopBooks,
  getBooksByCategory,
  getBookDetails,
} from './api.js';


// Application state
let currentCategory = 'all';
let visibleBooks = window.innerWidth <= 768 ? 10 : 24;
let booksPerLoad = 4;
let allBooks = [];
let categories = [];
let isLoading = false;
let useBackupData = false;

// Determine initial book count based on screen size
function getInitialBookCount() {
  return window.innerWidth <= 768 ? 10 : 24;
}

// DOM elements
const bookList = document.getElementById('book-list');
const showMoreBtn = document.getElementById('show-more-btn');
const showingCount = document.getElementById('showing-count');
const totalCount = document.getElementById('total-count');
const categoryButtons = document.querySelectorAll('.category-btn');

// Debug logging
function debugLog(message, data = null) {
  console.log(`[Books App Debug] ${message}`, data || '');
}

// Fetch categories from API with fallback
async function fetchCategories() {
  try {
    debugLog('Fetching categories...');
    const data = await getCategoryList();
    debugLog('Raw API response for categories:', data);
    debugLog('Is array?', Array.isArray(data));
    debugLog('Data length:', data ? data.length : 'null/undefined');

    // Handle different possible response structures
    let processedCategories = [];

    if (Array.isArray(data) && data.length > 0) {
      debugLog('Processing categories array...');

      // Check if it's an array of category objects with list_name
      if (data[0] && data[0].list_name) {
        processedCategories = data.map(category => ({
          name: category.list_name,
          displayName: category.list_name,
        }));
      }
      // Check if it's an array of simple strings
      else if (typeof data[0] === 'string') {
        processedCategories = data.map(categoryName => ({
          name: categoryName,
          displayName: categoryName,
        }));
      }
      // Check if it has name property instead
      else if (data[0] && data[0].name) {
        processedCategories = data.map(category => ({
          name: category.name,
          displayName: category.display_name || category.name,
        }));
      }
    }

    if (processedCategories.length > 0) {
      categories = processedCategories;
      debugLog('Categories loaded from API:', categories);
      useBackupData = false;
      return categories;
    } else {
      debugLog('No valid categories found in API response, using backup');
      throw new Error('No valid categories found in API response');
    }
  } catch (error) {
    debugLog('Categories API failed:', error.message);
    categories = [];
    useBackupData = true;
    return categories;
  }
}

async function fetchTopBooks() {
  try {
    debugLog('Fetching top books...');
    const data = await getTopBooks();
    debugLog('Raw API response for top books:', data);
    debugLog('Is array?', Array.isArray(data));
    debugLog('Data length:', data ? data.length : 'null/undefined');

    let books = [];

    if (Array.isArray(data) && data.length > 0) {
      debugLog('Processing array response...');

      if (data[0] && data[0].books && Array.isArray(data[0].books)) {
        debugLog('Found category groups with books arrays');
        data.forEach(categoryGroup => {
          if (categoryGroup.books && Array.isArray(categoryGroup.books)) {
            books = books.concat(
              categoryGroup.books.map(book => ({
                _id: book._id,
                title: book.title,
                author: book.author,
                book_image: book.book_image,
                list_name: categoryGroup.list_name,
                description: book.description || '',
                buy_links: book.buy_links || [],
              }))
            );
          }
        });
      }
      else if (data[0] && (data[0]._id || data[0].id) && data[0].title) {
        debugLog('Found direct array of books');
        books = data.map(book => ({
          _id: book._id || book.id,
          title: book.title,
          author: book.author,
          book_image: book.book_image || book.image,
          list_name: book.list_name || 'General',
          description: book.description || '',
          buy_links: book.buy_links || [],
        }));
      } else {
        debugLog('Unknown array structure:', data[0]);
      }
    }
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      debugLog('Processing object response...');

      if (data.books && Array.isArray(data.books)) {
        debugLog('Found books array in object');
        books = data.books.map(book => ({
          _id: book._id || book.id,
          title: book.title,
          author: book.author,
          book_image: book.book_image || book.image,
          list_name: book.list_name || 'General',
          description: book.description || '',
          buy_links: book.buy_links || [],
        }));
      }
      else if (data.title) {
        debugLog('Found single book object');
        books = [
          {
            _id: data._id || data.id,
            title: data.title,
            author: data.author,
            book_image: data.book_image || data.image,
            list_name: data.list_name || 'General',
            description: data.description || '',
            buy_links: data.buy_links || [],
          },
        ];
      }
    }

    if (books.length > 0) {
      debugLog(`Successfully processed ${books.length} books from API`);
      useBackupData = false;
      return books;
    } else {
      debugLog('No valid books found in API response, using backup');
      throw new Error('No valid books found in API response');
    }
  } catch (error) {
    debugLog('Top books API failed:', error.message);
    useBackupData = true;
    return [];
  }
}

async function fetchBooksByCategory(category) {
  try {
    debugLog(`Fetching books for category: ${category}`);
    const data = await getBooksByCategory(category);
    debugLog('Raw API response for category books:', data);

    let books = [];

    if (Array.isArray(data) && data.length > 0) {
      books = data.map(book => ({
        _id: book._id || book.id,
        title: book.title,
        author: book.author,
        book_image: book.book_image || book.image,
        list_name: category,
        description: book.description || '',
        buy_links: book.buy_links || [],
      }));
    } else if (
      data &&
      typeof data === 'object' &&
      data.books &&
      Array.isArray(data.books)
    ) {
      books = data.books.map(book => ({
        _id: book._id || book.id,
        title: book.title,
        author: book.author,
        book_image: book.book_image || book.image,
        list_name: category,
        description: book.description || '',
        buy_links: book.buy_links || [],
      }));
    }

    if (books.length > 0) {
      debugLog(`Loaded ${books.length} books for category ${category}`);
      return books;
    } else {
      throw new Error('No books found for category');
    }
  } catch (error) {
    debugLog(
      `Category books API failed for ${category}, using filtered backup data:`,
      error.message
    );
    return [];
  }
}

async function fetchBookDetails(bookId) {
  try {
    debugLog(`Fetching details for book: ${bookId}`);
    const data = await getBookDetails(bookId);

    if (data && data._id) {
      debugLog('Book details loaded from API:', data);
      return data;
    } else {
      throw new Error('Invalid book details data');
    }
  } catch (error) {
    debugLog(
      `Book details API failed for ${bookId}, using backup data:`,
      error.message
    );
    return allBooks.find(book => book._id === bookId) || null;
  }
}

function createBookItem(book) {
  const displayPrice = 'Check Price';
  const imageUrl =
    book.book_image || 'https://via.placeholder.com/227x323?text=No+Image';

  return `
    <li class="book-item">
        <img
            class="book-image"
            src="${imageUrl}"
            alt="${book.title} by ${book.author}"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/227x323?text=No+Image'"
        />
        <div class="book-content">
            <div class="book-header">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                </div>
                <div class="book-price">${displayPrice}</div>
            </div>
            <button class="learn-more-btn" onclick="handleLearnMore('${book._id}')">
                Learn More
            </button>
        </div>
    </li>
  `;
}

function createLoadingSkeleton() {
  return `
    <li class="book-item">
      <div class="book-image" style="background: #e0e0e0; animation: pulse 1.5s ease-in-out infinite;"></div>
      <div class="book-content">
        <div class="book-header">
          <div class="book-info">
            <div style="height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s ease-in-out infinite;"></div>
            <div style="height: 16px; background: #e0e0e0; border-radius: 4px; width: 70%; animation: pulse 1.5s ease-in-out infinite;"></div>
          </div>
          <div style="height: 24px; background: #e0e0e0; border-radius: 4px; width: 60px; animation: pulse 1.5s ease-in-out infinite;"></div>
        </div>
        <div style="height: 40px; background: #e0e0e0; border-radius: 4px; animation: pulse 1.5s ease-in-out infinite;"></div>
      </div>
    </li>
  `;
}

function getFilteredBooks() {
  if (currentCategory === 'all') {
    return allBooks;
  }
  return allBooks.filter(book => book.list_name === currentCategory);
}

function showLoading() {
  isLoading = true;
  const skeletonCount = window.innerWidth <= 768 ? 10 : 24;
  bookList.innerHTML = Array(skeletonCount)
    .fill(createLoadingSkeleton())
    .join('');
  showMoreBtn.disabled = true;
  debugLog('Showing loading state');
}

function renderBooks() {
  if (isLoading) {
    debugLog('Still loading, skipping render');
    return;
  }

  const filteredBooks = getFilteredBooks();
  const booksToShow = filteredBooks.slice(0, visibleBooks);

  debugLog(
    `Rendering ${booksToShow.length} books out of ${filteredBooks.length} total`
  );

  if (booksToShow.length === 0) {
    bookList.innerHTML =
      '<li style="grid-column: 1/-1; text-align: center; padding: 40px; color: #0b0500;">No books found for this category.</li>';
  } else {
    bookList.innerHTML = booksToShow.map(book => createBookItem(book)).join('');
  }

  showingCount.textContent = booksToShow.length;
  totalCount.textContent = filteredBooks.length;

  if (booksToShow.length >= filteredBooks.length) {
    showMoreBtn.classList.add('hidden');
  } else {
    showMoreBtn.classList.remove('hidden');
  }

  showMoreBtn.disabled = false;
}

async function loadBooks() {
  debugLog(`Loading books for category: ${currentCategory}`);
  showLoading();

  try {
    if (currentCategory === 'all') {
      allBooks = await fetchTopBooks();
    } else {
      allBooks = await fetchBooksByCategory(currentCategory);
    }

    if (allBooks.length === 0) {
      throw new Error('No books loaded');
    }

    isLoading = false;
    debugLog(`Successfully loaded ${allBooks.length} books`);
    renderBooks();
  } catch (error) {
    debugLog('Error loading books:', error.message);
    isLoading = false;

    isLoading = false;
    bookList.innerHTML =
      '<li style="grid-column: 1/-1; text-align: center; padding: 40px; color: #0b0500;">Unable to load books. Please check your internet connection and try again.</li>';
    if (showMoreBtn) {
      showMoreBtn.classList.add('hidden');
    }
  }
}

async function updateCategoriesInSidebar() {
  try {
    debugLog('Updating categories in sidebar');
    const fetchedCategories = await fetchCategories();
    const categoriesContainer = document.querySelector('.categories');

    if (!categoriesContainer) {
      debugLog('Categories container not found');
      return;
    }

    const categoryHTML = `
      <li><button class="category-btn active" data-category="all">All categories</button></li>
      ${fetchedCategories
        .map(
          category =>
            `<li><button class="category-btn" data-category="${category.name}">${category.displayName}</button></li>`
        )
        .join('')}
    `;

    categoriesContainer.innerHTML = categoryHTML;
    debugLog('Categories updated in sidebar');

    const newCategoryButtons = document.querySelectorAll('.category-btn');
    newCategoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        handleCategorySelect(btn.dataset.category);
      });
    });
  } catch (error) {
    debugLog('Error updating categories:', error.message);
  }
}

async function handleCategorySelect(category) {
  if (isLoading) {
    debugLog('Already loading, ignoring category selection');
    return;
  }

  debugLog(`Category selected: ${category}`);
  currentCategory = category;
  visibleBooks = getInitialBookCount();

  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });

  await loadBooks();
}

function handleShowMore() {
  if (isLoading) return;

  const filteredBooks = getFilteredBooks();
  visibleBooks = Math.min(visibleBooks + booksPerLoad, filteredBooks.length);
  debugLog(`Show more clicked, now showing ${visibleBooks} books`);
  renderBooks();
}

const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

//window.handleLearnMore = handleLearnMore;

document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    handleCategorySelect(btn.dataset.category);
  });
});

if (showMoreBtn) {
  showMoreBtn.addEventListener('click', handleShowMore);
}

window.addEventListener('resize', () => {
  const newInitialCount = getInitialBookCount();
  const oldInitialCount = window.innerWidth <= 768 ? 24 : 10;

  if (visibleBooks === oldInitialCount) {
    visibleBooks = newInitialCount;
    renderBooks();
  }
});

function showApiStatus(isWorking) {
  const countElement = document.querySelector('.count');
  if (countElement && useBackupData) {
    countElement.style.color = '#e15d05';
    countElement.style.fontWeight = '500';
    countElement.title =
      'Using offline data - API server unavailable or blocked by CORS policy';

    if (!countElement.querySelector('.offline-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'offline-indicator';
      indicator.innerHTML = ' 🔴';
      indicator.style.fontSize = '12px';
      indicator.title = 'Offline mode';
      countElement.appendChild(indicator);
    }
  } else if (countElement) {
    countElement.style.color = '#0b0500';
    countElement.style.fontWeight = 'normal';
    countElement.title = 'Live data from API';

    const indicator = countElement.querySelector('.offline-indicator');
    if (indicator) {
      indicator.remove();
    }

    if (!countElement.querySelector('.online-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'online-indicator';
      indicator.innerHTML = ' 🟢';
      indicator.style.fontSize = '12px';
      indicator.title = 'Live data';
      countElement.appendChild(indicator);

      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  debugLog('App initializing...');

  debugLog('Starting with API-only approach...');

  showLoading();
  debugLog('Showing loading state, attempting API calls...');

  setTimeout(async () => {
    try {
      debugLog('Testing API connectivity...');

      const testUrls = [
        'https://books-backend.p.goit.global/books/category-list',
        'https://books-backend.p.goit.global/category-list',
        'https://books-backend.p.goit.global/api/books/category-list',
        'https://books-backend.p.goit.global/api/category-list',
      ];

      let response = null;
      let workingUrl = null;

      for (const testUrl of testUrls) {
        debugLog('Testing fetch to:', testUrl);
        try {
          response = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              Accept: 'application/json',
            },
          });

          if (response.ok) {
            workingUrl = testUrl;
            debugLog('Found working URL:', workingUrl);
            break;
          }
        } catch (error) {
          debugLog(`Failed to fetch ${testUrl}:`, error.message);
        }
      }

      if (!workingUrl || !response) {
        throw new Error('All API endpoints failed - server unreachable');
      }

      debugLog('Fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        debugLog('Direct fetch successful, data:', data);

        debugLog('Direct fetch worked, trying API functions...');

        const categories = await getCategoryList();
        const books = await getTopBooks();

        debugLog('API functions results:', { categories, books });

        if (Array.isArray(books) && books.length > 0) {
          debugLog('Processing API books data...');

          let processedBooks = [];

          if (books[0] && books[0].books) {
            // Handle grouped format
            books.forEach(group => {
              if (group.books && Array.isArray(group.books)) {
                group.books.forEach(book => {
                  processedBooks.push({
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    book_image: book.book_image,
                    list_name: group.list_name,
                    description: book.description || '',
                    buy_links: book.buy_links || [],
                  });
                });
              }
            });
          } else if (books[0] && books[0].title) {
            // Handle direct array format
            processedBooks = books.map(book => ({
              _id: book._id,
              title: book.title,
              author: book.author,
              book_image: book.book_image,
              list_name: book.list_name || 'General',
              description: book.description || '',
              buy_links: book.buy_links || [],
            }));
          }

          if (processedBooks.length > 0) {
            debugLog(
              `Successfully processed ${processedBooks.length} books from API!`
            );
            allBooks = processedBooks;
            useBackupData = false;
            isLoading = false;
            renderBooks();
            showApiStatus(true);

            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #28a745;
              color: white;
              padding: 12px 16px;
              border-radius: 4px;
              font-size: 14px;
              z-index: 1000;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            notification.textContent =
              'Successfully loaded live data from API! ✓';
            document.body.appendChild(notification);

            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 5000);
          } else {
            throw new Error('No books processed from API');
          }
        } else {
          throw new Error('No books returned from API');
        }
      } else {
        debugLog('Fetch failed with status:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      debugLog('API failed completely:', error.message);

      isLoading = false;
      bookList.innerHTML = `
        <li style="grid-column: 1/-1; text-align: center; padding: 40px; color: #0b0500;">
          <h3>Unable to load books</h3>
          <p>API connection failed: ${error.message}</p>
          <p>Please check your internet connection and try refreshing the page.</p>
        </li>
      `;
      showApiStatus(false);

      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      notification.textContent = 'API connection failed - no data available';
      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 8000);
    }
  }, 500);

  debugLog('App initialization complete');
});
