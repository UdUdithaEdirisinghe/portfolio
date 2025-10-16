document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- MODAL GALLERY ---------------- */
  const modal = document.getElementById('image-modal');
  if (modal) {
    const modalImage = document.getElementById('modal-image');
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

  /* ---------------- EXPAND / COLLAPSE (Read more) ---------------- */
  document.querySelectorAll('.expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const target = document.getElementById(targetId);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (!target) return;

      if (expanded) {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Read more';
        target.classList.remove('expanded');
        // On collapse, ensure the button remains in view
        btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Show less';
        target.classList.add('expanded');
      }
    });
  });

  /* ---------------- SLIDER (one full card on mobile, no peeking) ---------------- */
  function setupSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, indicatorSelector, slidesToShowConfig) {
    const sliderContainer = document.querySelector(containerSelector);
    if (!sliderContainer) return;

    const slider = sliderContainer.querySelector(sliderSelector);   // translating element
    const viewport = slider?.parentElement;                         // static element for gestures
    const prevBtn = sliderContainer.querySelector(prevBtnSelector);
    const nextBtn = sliderContainer.querySelector(nextBtnSelector);
    const indicatorsContainer = sliderContainer.querySelector(indicatorSelector);
    const slides = slider ? Array.from(slider.children) : [];

    if (!slider || !viewport || !prevBtn || !nextBtn || !indicatorsContainer || slides.length === 0) return;

    // Allow vertical scroll; intercept only after clear horizontal intent
    viewport.style.touchAction = 'pan-y';

    let currentIndex = 0;
    let slidesToShow = slidesToShowConfig.desktop.slides;
    const getGap = () => parseInt(getComputedStyle(slider).getPropertyValue('gap')) || 0;

    // Gesture state
    let isPointerDown = false;
    let isDragging = false; // horizontal drag confirmed
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    const supportsPointer = window.PointerEvent !== undefined;

    function createIndicators() {
      indicatorsContainer.innerHTML = '';
      const numIndicators = slides.length - slidesToShow + 1;
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
      // On mobile (slidesToShow=1), use viewport width so card = full width and no peeking
      if (slidesToShow === 1) return viewport.clientWidth; 
      // Otherwise use card width + gap
      const cardWidth = slides[0].offsetWidth;
      return cardWidth + getGap();
    }

    function clampIndex(i) {
      const max = Math.max(0, slides.length - slidesToShow);
      return Math.min(Math.max(i, 0), max);
    }

    function snapToIndex() {
      currentIndex = clampIndex(currentIndex);
      currentTranslate = -currentIndex * stepWidth();
      prevTranslate = currentTranslate;
      slider.style.transform = `translateX(${currentTranslate}px)`;
      updateIndicators();
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
    }

    function raf() {
      slider.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) animationID = requestAnimationFrame(raf);
    }

    const getPoint = (e) => {
      const t = e.touches?.[0] || e.changedTouches?.[0];
      return { x: (t ? t.clientX : e.clientX), y: (t ? t.clientY : e.clientY) };
    };

    const H_THRESHOLD = 6; // px before we consider it a horizontal intent

    function pointerDown(e) {
      const p = getPoint(e);
      isPointerDown = true;
      isDragging = false;
      hasMoved = false;
      startX = p.x;
      startY = p.y;
      // Don't change CSS yet; wait for horizontal intent
    }

    function pointerMove(e) {
      if (!isPointerDown) return;
      const p = getPoint(e);
      const dx = p.x - startX;
      const dy = p.y - startY;

      // Decide intent
      if (!isDragging) {
        if (Math.abs(dx) > H_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          isDragging = true;
          sliderContainer.classList.add('dragging'); // suppress link clicks
          slider.style.transition = 'none';
          animationID = requestAnimationFrame(raf);
        } else {
          // vertical scroll or not enough movement; let the browser handle it
          return;
        }
      }

      // Horizontal drag in progress
      hasMoved = true;
      currentTranslate = prevTranslate + dx;

      // Prevent scroll during horizontal drag
      if (e.cancelable) e.preventDefault();
    }

    function pointerEnd() {
      if (animationID) cancelAnimationFrame(animationID);
      animationID = 0;

      // Compute final index based on nearest step (strict snap)
      const w = stepWidth();
      const rawIndex = -currentTranslate / w;
      currentIndex = clampIndex(Math.round(rawIndex));

      slider.style.transition = 'transform 0.25s ease-out';
      snapToIndex();

      isPointerDown = false;
      isDragging = false;
      sliderContainer.classList.remove('dragging');
    }

    // Buttons
    nextBtn.addEventListener('click', () => { currentIndex = clampIndex(currentIndex + 1); slider.style.transition = 'transform .25s ease-out'; snapToIndex(); });
    prevBtn.addEventListener('click', () => { currentIndex = clampIndex(currentIndex - 1); slider.style.transition = 'transform .25s ease-out'; snapToIndex(); });

    // Suppress post-drag clicks from anchors/images
    viewport.addEventListener('click', (e) => {
      if (hasMoved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // Bind to static viewport (more reliable on iOS Safari)
    if (supportsPointer) {
      viewport.addEventListener('pointerdown', pointerDown, { passive: true });
      viewport.addEventListener('pointermove',  pointerMove, { passive: false });
      viewport.addEventListener('pointerup',    pointerEnd,  { passive: true });
      viewport.addEventListener('pointerleave', () => { if (isPointerDown) pointerEnd(); }, { passive: true });
      viewport.addEventListener('pointercancel', pointerEnd, { passive: true });
    } else {
      // Touch fallback
      viewport.addEventListener('touchstart', (e) => pointerDown(e), { passive: true });
      viewport.addEventListener('touchmove',  (e) => pointerMove(e), { passive: false });
      viewport.addEventListener('touchend',   () => pointerEnd(),    { passive: true });
      viewport.addEventListener('touchcancel',() => pointerEnd(),    { passive: true });
      // Mouse fallback
      viewport.addEventListener('mousedown',  (e) => pointerDown(e));
      window.addEventListener('mousemove',    (e) => pointerMove(e));
      window.addEventListener('mouseup',      () => pointerEnd());
    }

    window.addEventListener('resize', () => {
      const oldWidth = stepWidth();
      updateSlidesToShow();
      createIndicators();
      // After resize/orientation change, keep the current index aligned to new width
      setTimeout(() => {
        slider.style.transition = 'none';
        snapToIndex();
        requestAnimationFrame(() => slider.style.transition = 'transform .25s ease-out');
      }, 100);
    });

    // Init
    updateSlidesToShow();
    createIndicators();
    snapToIndex();
  }

  // Apply to both sliders
  setupSlider(
    '#projects',
    '.project-slider',
    '.prev-project-btn',
    '.next-project-btn',
    '.project-indicators',
    { mobile:{ breakpoint:768, slides:1 }, tablet:{ breakpoint:960, slides:2 }, desktop:{ slides:2 } }
  );

  setupSlider(
    '#extracurricular',
    '.activity-slider',
    '.prev-activity-btn',
    '.next-activity-btn',
    '.activity-indicators',
    { mobile:{ breakpoint:768, slides:1 }, tablet:{ breakpoint:960, slides:2 }, desktop:{ slides:3 } }
  );
});
