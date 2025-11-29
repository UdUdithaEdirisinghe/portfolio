document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- THEME TOGGLER ---------------- */
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.remove('theme-dark');
    }
    localStorage.setItem('theme', theme);
  };

  themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(newTheme);
  });
  
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  }

  /* ---------------- MOBILE NAVIGATION ---------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      document.body.classList.toggle('nav-open');
      const icon = navToggle.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        document.body.classList.remove('nav-open');
        const icon = navToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });
  }
  
  /* ---------------- MODAL GALLERY ---------------- */
  const modal = document.getElementById('image-modal');
  if (modal) {
    const modalImage = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeModal = document.querySelector('.modal-close');
    const prevButton = document.querySelector('.modal-prev');
    const nextButton = document.querySelector('.modal-next');
    let galleryItems = [];
    let currentIndex = 0;
    const galleryTriggers = document.querySelectorAll('a[data-gallery-item]');

    galleryTriggers.forEach(trigger => {
      if (trigger.style.display !== 'none') {
        trigger.addEventListener('click', e => {
          e.preventDefault();
          openModal(trigger);
        });
      }
    });

    function openModal(trigger) {
      const galleryName = trigger.getAttribute('data-gallery-item');
      galleryItems = Array.from(document.querySelectorAll(`a[data-gallery-item="${galleryName}"]`));
      const clickedItemSrc = trigger.getAttribute('href');
      currentIndex = galleryItems.findIndex(item => item.getAttribute('href') === clickedItemSrc);
      updateModalImage();
      modal.classList.add('visible');
    }

    function updateModalImage() {
      if (galleryItems.length > 0) {
        modalImage.src = galleryItems[currentIndex].getAttribute('href');
        prevButton.style.display = (currentIndex === 0) ? 'none' : 'block';
        nextButton.style.display = (currentIndex === galleryItems.length - 1) ? 'none' : 'block';
        
        if (galleryItems.length > 1) {
          modalCaption.textContent = `Image ${currentIndex + 1} of ${galleryItems.length}`;
        } else {
          modalCaption.textContent = '';
        }
      }
    }

    function showNextImage() { if (currentIndex < galleryItems.length - 1) { currentIndex++; updateModalImage(); } }
    function showPrevImage() { if (currentIndex > 0) { currentIndex--; updateModalImage(); } }

    closeModal.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    nextButton.addEventListener('click', showNextImage);
    prevButton.addEventListener('click', showPrevImage);

    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('visible')) return;
      if (e.key === 'ArrowRight') showNextImage();
      else if (e.key === 'ArrowLeft') showPrevImage();
      else if (e.key === 'Escape') modal.classList.remove('visible');
    });
  }

  /* ---------------- EXPAND / COLLAPSE (Universal) ---------------- */
  // Applies to both Projects and Volunteering sections
  document.querySelectorAll('.expandable').forEach(p => {
    // Wait for layout to stabilize (images loading etc.)
    setTimeout(() => {
      // Check if content overflows height
      if (p.scrollHeight > p.clientHeight) {
        const toggle = document.createElement('a');
        toggle.href = '#';
        toggle.className = 'read-more-toggle';
        p.appendChild(toggle);

        const updateToggleText = () => {
          const isExpanded = p.classList.contains('expanded');
          if (isExpanded) {
            toggle.innerHTML = `<span class="toggle-text">&nbsp;Show less</span>`;
          } else {
            toggle.innerHTML = `<span class="ellipsis">&hellip;&nbsp;</span><span class="toggle-text">Read more</span>`;
          }
        };

        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          p.classList.toggle('expanded');
          updateToggleText();
        });

        updateToggleText();
      }
    }, 150);
  });

  /* ---------------- SLIDER ---------------- */
  function setupSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, indicatorSelector, slidesToShowConfig) {
    const sliderContainer = document.querySelector(containerSelector);
    if (!sliderContainer) return;

    const slider = sliderContainer.querySelector(sliderSelector);
    const viewport = slider?.parentElement;
    const prevBtn = sliderContainer.querySelector(prevBtnSelector);
    const nextBtn = sliderContainer.querySelector(nextBtnSelector);
    const indicatorsContainer = sliderContainer.querySelector(indicatorSelector);
    const slides = slider ? Array.from(slider.children) : [];

    if (!slider || !viewport || !prevBtn || !nextBtn || !indicatorsContainer || slides.length === 0) return;

    let currentIndex = 0;
    let slidesToShow = slidesToShowConfig.desktop.slides;
    const getGap = () => parseInt(getComputedStyle(slider).getPropertyValue('gap')) || 0;
    
    let isPointerDown = false, isDragging = false, hasMoved = false;
    let startX = 0, startY = 0;
    let currentTranslate = 0, prevTranslate = 0, animationID = 0;
    const supportsPointer = window.PointerEvent !== undefined;

    function createIndicators() {
      indicatorsContainer.innerHTML = '';
      const numIndicators = (slidesToShow === 1) ? slides.length : slides.length - slidesToShow + 1;
      
      if (numIndicators <= 1) return;

      for (let i = 0; i < numIndicators; i++) {
        const dot = document.createElement('div');
        dot.classList.add('indicator-dot');
        dot.addEventListener('click', () => { currentIndex = i; snapToIndex(); });
        indicatorsContainer.appendChild(dot);
      }
      updateIndicators();
    }

    function updateIndicators() {
      const dots = indicatorsContainer.querySelectorAll('.indicator-dot');
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
    }

    function updateSlidesToShow() {
      const w = window.innerWidth;
      if (w <= slidesToShowConfig.mobile.breakpoint)      slidesToShow = slidesToShowConfig.mobile.slides;
      else if (w <= slidesToShowConfig.tablet.breakpoint) slidesToShow = slidesToShowConfig.tablet.slides;
      else                                                slidesToShow = slidesToShowConfig.desktop.slides;
    }

    function stepWidth() {
      if (slidesToShow === 1) return viewport.clientWidth; 
      const cardWidth = slides[0].offsetWidth;
      return cardWidth + getGap();
    }

    function clampIndex(i) {
      const max = (slidesToShow === 1) ? slides.length - 1 : slides.length - slidesToShow;
      return Math.min(Math.max(i, 0), max);
    }

    function snapToIndex() {
      currentIndex = clampIndex(currentIndex);
      currentTranslate = -currentIndex * stepWidth();
      prevTranslate = currentTranslate;
      slider.style.transform = `translateX(${currentTranslate}px)`;
      updateIndicators();
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === clampIndex(Infinity);
    }

    function raf() {
      slider.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) animationID = requestAnimationFrame(raf);
    }

    const getPoint = (e) => {
      const t = e.touches?.[0] || e.changedTouches?.[0];
      return { x: (t ? t.clientX : e.clientX), y: (t ? t.clientY : e.clientY) };
    };

    const H_THRESHOLD = 6;

    function pointerDown(e) {
      const p = getPoint(e);
      isPointerDown = true; isDragging = false; hasMoved = false;
      startX = p.x; startY = p.y;
      prevTranslate = currentTranslate; 
      slider.style.transition = 'none'; 
      if (animationID) cancelAnimationFrame(animationID);
    }

    function pointerMove(e) {
      if (!isPointerDown) return;
      const p = getPoint(e);
      const dx = p.x - startX;
      const dy = p.y - startY;

      if (!isDragging) {
        if (Math.abs(dx) > H_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          isDragging = true;
          sliderContainer.classList.add('dragging');
          animationID = requestAnimationFrame(raf);
        } else { return; }
      }
      hasMoved = true;
      currentTranslate = prevTranslate + dx;
      if (e.cancelable) e.preventDefault();
    }

    function pointerEnd() {
      if (animationID) cancelAnimationFrame(animationID);
      animationID = 0;
      
      const movedBy = currentTranslate - prevTranslate;
      const sensitivity = 50; 
      
      if (movedBy < -sensitivity) {
        currentIndex = clampIndex(currentIndex + 1);
      } else if (movedBy > sensitivity) {
        currentIndex = clampIndex(currentIndex - 1);
      } 
      
      slider.style.transition = 'transform 0.25s ease-out';
      snapToIndex();
      
      isPointerDown = false; isDragging = false;
      setTimeout(() => sliderContainer.classList.remove('dragging'), 0);
    }

    nextBtn.addEventListener('click', () => { currentIndex = clampIndex(currentIndex + 1); snapToIndex(); });
    prevBtn.addEventListener('click', () => { currentIndex = clampIndex(currentIndex - 1); snapToIndex(); });
    viewport.addEventListener('click', (e) => { if (hasMoved) { e.preventDefault(); e.stopPropagation(); } }, true);

    if (supportsPointer) {
      viewport.addEventListener('pointerdown', pointerDown, { passive: true });
      viewport.addEventListener('pointermove', pointerMove, { passive: false });
      viewport.addEventListener('pointerup', pointerEnd, { passive: true });
      viewport.addEventListener('pointerleave', () => { if (isPointerDown) pointerEnd(); }, { passive: true });
    } else {
      viewport.addEventListener('touchstart', (e) => pointerDown(e), { passive: true });
      viewport.addEventListener('touchmove', (e) => pointerMove(e), { passive: false });
      viewport.addEventListener('touchend', () => pointerEnd(), { passive: true });
      viewport.addEventListener('mousedown', (e) => pointerDown(e));
      window.addEventListener('mousemove', (e) => pointerMove(e));
      window.addEventListener('mouseup', () => pointerEnd());
    }

    window.addEventListener('resize', () => {
      updateSlidesToShow();
      createIndicators();
      setTimeout(() => {
        slider.style.transition = 'none';
        snapToIndex();
        requestAnimationFrame(() => slider.style.transition = 'transform .25s ease-out');
      }, 100);
    });

    updateSlidesToShow();
    createIndicators();
    snapToIndex();
  }

  setupSlider(
    '#projects',
    '.project-slider',
    '.prev-project-btn',
    '.next-project-btn',
    '.project-indicators',
    { mobile: { breakpoint: 768, slides: 1 }, tablet: { breakpoint: 960, slides: 2 }, desktop: { slides: 2 } }
  );

  setupSlider(
    '#volunteering',
    '.activity-slider',
    '.prev-activity-btn',
    '.next-activity-btn',
    '.activity-indicators',
    { mobile: { breakpoint: 768, slides: 1 }, tablet: { breakpoint: 960, slides: 2 }, desktop: { slides: 3 } }
  );
});