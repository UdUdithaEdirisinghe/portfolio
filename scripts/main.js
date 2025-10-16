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
                trigger.addEventListener('click', (e) => {
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
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });
        nextButton.addEventListener('click', showNextImage);
        prevButton.addEventListener('click', showPrevImage);

        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('visible')) return;
            if (e.key === 'ArrowRight') showNextImage();
            else if (e.key === 'ArrowLeft') showPrevImage();
            else if (e.key === 'Escape') modal.classList.remove('visible');
        });
    }

    /* ---------------- SLIDER (vertical-scroll friendly) ---------------- */
    function setupSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, indicatorSelector, slidesToShowConfig) {
        const sliderContainer = document.querySelector(containerSelector);
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector(sliderSelector);   // translating element
        const viewport = slider?.parentElement;                         // static element (bind gestures here)
        const prevBtn = sliderContainer.querySelector(prevBtnSelector);
        const nextBtn = sliderContainer.querySelector(nextBtnSelector);
        const indicatorsContainer = sliderContainer.querySelector(indicatorSelector);
        const slides = slider ? Array.from(slider.children) : [];

        if (!slider || !viewport || !prevBtn || !nextBtn || !indicatorsContainer || slides.length === 0) return;

        // Allow vertical panning by default; we’ll only hijack on confirmed horizontal drags
        viewport.style.touchAction = 'pan-y';

        let currentIndex = 0;
        let slidesToShow = slidesToShowConfig.desktop.slides;
        const gap = parseInt(getComputedStyle(slider).getPropertyValue('gap')) || 0;

        // Gesture state
        let isPointerDown = false;   // finger/mouse is down
        let isDragging = false;      // we have decided it’s a horizontal drag
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
                dot.addEventListener('click', () => { currentIndex = i; updateSliderPosition(); });
                indicatorsContainer.appendChild(dot);
            }
        }

        function updateIndicators() {
            const dots = indicatorsContainer.querySelectorAll('.indicator-dot');
            dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
        }

        function updateSlidesToShow() {
            if (window.innerWidth <= slidesToShowConfig.mobile.breakpoint)      slidesToShow = slidesToShowConfig.mobile.slides;
            else if (window.innerWidth <= slidesToShowConfig.tablet.breakpoint) slidesToShow = slidesToShowConfig.tablet.slides;
            else                                                                slidesToShow = slidesToShowConfig.desktop.slides;
        }

        const stepWidth = () => slides[0].offsetWidth + gap;

        function updateSliderPosition() {
            currentTranslate = currentIndex * -stepWidth();
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
            return {
                x: (t ? t.clientX : e.clientX),
                y: (t ? t.clientY : e.clientY)
            };
        };

        const H_THRESHOLD = 6; // px before we consider it a horizontal intent

        function pointerDown(e) {
            const p = getPoint(e);
            isPointerDown = true;
            isDragging = false;   // not decided yet
            hasMoved = false;
            startX = p.x;
            startY = p.y;
            // Do NOT change transitions or add dragging class yet—wait for horizontal intent
        }

        function pointerMove(e) {
            if (!isPointerDown) return;
            const p = getPoint(e);
            const dx = p.x - startX;
            const dy = p.y - startY;

            // If not yet dragging, decide the intent
            if (!isDragging) {
                if (Math.abs(dx) > H_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal drag confirmed — now we take over
                    isDragging = true;
                    sliderContainer.classList.add('dragging'); // suppress clicks
                    slider.style.transition = 'none';
                    animationID = requestAnimationFrame(raf);
                } else {
                    // Not a horizontal gesture => let the browser handle vertical scroll
                    return; // Do not preventDefault
                }
            }

            // We are dragging horizontally
            hasMoved = true;
            currentTranslate = prevTranslate + dx;

            // Prevent the page from scrolling while we drag horizontally
            if (e.cancelable) e.preventDefault();
        }

        function endDrag() {
            // Called when pointer/mouse/touch ends or is canceled
            if (animationID) cancelAnimationFrame(animationID);
            animationID = 0;

            if (isDragging) {
                const movedBy = currentTranslate - prevTranslate;
                const step = stepWidth();
                const threshold = Math.min(50, step / 5);

                if (movedBy < -threshold && (currentIndex + slidesToShow) < slides.length) currentIndex++;
                else if (movedBy > threshold && currentIndex > 0) currentIndex--;

                slider.style.transition = 'transform 0.3s ease-out';
                updateSliderPosition();
            }

            isPointerDown = false;
            isDragging = false;
            sliderContainer.classList.remove('dragging');
        }

        // Buttons
        nextBtn.addEventListener('click', () => {
            if ((currentIndex + slidesToShow) < slides.length) { currentIndex++; updateSliderPosition(); }
        });
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) { currentIndex--; updateSliderPosition(); }
        });

        // Suppress post-drag clicks from anchors/images
        viewport.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Event binding (pointer if available; else touch/mouse)
        if (supportsPointer) {
            viewport.addEventListener('pointerdown', pointerDown, { passive: true });
            viewport.addEventListener('pointermove',  pointerMove, { passive: false }); // may preventDefault on horizontal drag
            viewport.addEventListener('pointerup',    endDrag,     { passive: true });
            viewport.addEventListener('pointerleave', () => { if (isPointerDown) endDrag(); }, { passive: true });
            viewport.addEventListener('pointercancel', endDrag, { passive: true });
        } else {
            // Touch fallback
            viewport.addEventListener('touchstart', (e) => pointerDown(e), { passive: true });
            viewport.addEventListener('touchmove',  (e) => pointerMove(e), { passive: false });
            viewport.addEventListener('touchend',   () => endDrag(), { passive: true });
            viewport.addEventListener('touchcancel', () => endDrag(), { passive: true });
            // Mouse fallback
            viewport.addEventListener('mousedown', (e) => pointerDown(e));
            window.addEventListener('mousemove', (e) => pointerMove(e));
            window.addEventListener('mouseup',   () => endDrag());
        }

        window.addEventListener('resize', () => {
            updateSlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            createIndicators();
            setTimeout(() => {
                slider.style.transition = 'none';
                updateSliderPosition();
                requestAnimationFrame(() => slider.style.transition = 'transform 0.3s ease-out');
            }, 100);
        });

        // Init
        updateSlidesToShow();
        createIndicators();
        updateSliderPosition();
    }

    // ---- APPLY SLIDER LOGIC TO PROJECTS ----
    setupSlider(
        '#projects',
        '.project-slider',
        '.prev-project-btn',
        '.next-project-btn',
        '.project-indicators',
        {
            mobile: { breakpoint: 768, slides: 1 },
            tablet: { breakpoint: 960, slides: 2 },
            desktop: { slides: 2 }
        }
    );

    // ---- APPLY SLIDER LOGIC TO ACTIVITIES ----
    setupSlider(
        '#extracurricular',
        '.activity-slider',
        '.prev-activity-btn',
        '.next-activity-btn',
        '.activity-indicators',
        {
            mobile: { breakpoint: 768, slides: 1 },
            tablet: { breakpoint: 960, slides: 2 },
            desktop: { slides: 3 }
        }
    );
});
