import Swiper from 'swiper';
import 'swiper/css';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = [
  {
    alt: 'A book, sweater and a cup',
    mob: '../img/hero/slide-1-mob.jpg',
    mob2x: '../img/hero/slide-1-mob@2x.jpg',
    tab: '../img/hero/slide-1-tab.jpg',
    tab2x: '../img/hero/slide-1-tab@2x.jpg',
    desk: '../img/hero/slide-1-desck.jpg',
    desk2x: '../img/hero/slide-1-desck@2x.jpg',
  },
  {
    alt: 'A book and glasses',
    mob: '../img/hero/slide-2-mob.jpg',
    mob2x: '../img/hero/slide-2-mob@2x.jpg',
    tab: '../img/hero/slide-2-tab.jpg',
    tab2x: '../img/hero/slide-2-tab@2x.jpg',
    desk: '../img/hero/slide-2-desck.jpg',
    desk2x: '../img/hero/slide-2-desck@2x.jpg',
  },
  {
    alt: 'Bookshelves with lots of books',
    mob: '../img/hero/slide-3-mob.jpg',
    mob2x: '../img/hero/slide-3-mob@2x.jpg',
    tab: '../img/hero/slide-3-tab.jpg',
    tab2x: '../img/hero/slide-3-tab@2x.jpg',
    desk: '../img/hero/slide-3-desck.jpg',
    desk2x: '../img/hero/slide-3-desck@2x.jpg',
  },
  {
    alt: 'A vase with flowers in front of white wall',
    mob: '../img/hero/slide-4-mob.jpg',
    mob2x: '../img/hero/slide-4-mob@2x.jpg',
    tab: '../img/hero/slide-4-tab.jpg',
    tab2x: '../img/hero/slide-4-tab@2x.jpg',
    desk: '../img/hero/slide-4-desck.jpg',
    desk2x: '../img/hero/slide-4-desck@2x.jpg',
  },
];

const overlayTexts = [
  {
    subtitle: 'Get 10% off your first order',
  },
  {
    subtitle: 'Save 15% on some books',
  },
  {
    subtitle: 'Summer Sale! Up to -40% discounts',
  },
  {
    subtitle: 'Last chance to buy our spring bestsellers',
  },
];

function renderSlides(slides) {
  const container = document.querySelector('#hero-swiper');
  if (!container) {
    console.error('[Swiper] Container #hero-swiper not found!');
    return;
  }

  const markup = slides
    .map(
      slide => `
        <li class="swiper-slide">
          <picture>
            <source srcset="${slide.desk} 1x, ${slide.desk2x} 2x" media="(min-width: 1440px)" />
            <source srcset="${slide.tab} 1x, ${slide.tab2x} 2x" media="(min-width: 768px)" />
            <img src="${slide.mob}" srcset="${slide.mob2x} 2x" alt="${slide.alt}" class="hero-slide-img" loading="lazy" />
          </picture>
        </li>
      `
    )
    .join('');

  container.innerHTML = markup;
}

function updateButtonsState() {
  const prev = document.querySelector('.swiper-btn.prev');
  const next = document.querySelector('.swiper-btn.next');

  if (!swiper || !prev || !next) return;

  prev.disabled = swiper.isBeginning;
  next.disabled = swiper.isEnd;

  prev.classList.toggle('disabled', swiper.isBeginning);
  next.classList.toggle('disabled', swiper.isEnd);
}

function updateOverlayText(index) {
  const subtitleEl = document.querySelector('.hero-subtitle');
  if (!subtitleEl) return;

  const textData = overlayTexts[index];
  if (textData) {
    subtitleEl.textContent = textData.subtitle;
  }
}

let swiper;

window.addEventListener('DOMContentLoaded', () => {
  renderSlides(slides);

  const nextBtn = document.querySelector('.swiper-btn.next');
  const prevBtn = document.querySelector('.swiper-btn.prev');

  requestAnimationFrame(() => {
    swiper = new Swiper('.swiper-gallery', {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      loop: false,
      allowTouchMove: true,
      wrapperTag: 'ul',
      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn,
      },
      on: {
        init: () => {
          updateButtonsState();
          updateOverlayText(0); // Показати текст для першого слайду
        },
        slideChange: function () {
          updateButtonsState();
          updateOverlayText(this.activeIndex);
        },
      },
    });
  });
});
