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

    /* ---------------- SLIDER (viewport-bound, iOS-safe) ---------------- */
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

        // iOS Safari: ensure the viewport owns the gesture
        viewport.style.touchAction = 'none';

        let currentIndex = 0;
        let slidesToShow = slidesToShowConfig.desktop.slides;
        const gap = parseInt(getComputedStyle(slider).getPropertyValue('gap')) || 0;

        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
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

        const getX = (e) => (e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? e.clientX);

        function begin(x) {
            isDragging = true;
            hasMoved = false;
            startX = x;
            sliderContainer.classList.add('dragging'); // block link clicks while dragging
            slider.style.transition = 'none';
            animationID = requestAnimationFrame(raf);
        }

        function move(x) {
            if (!isDragging) return;
            const delta = x - startX;
            if (Math.abs(delta) > 5) hasMoved = true;
            currentTranslate = prevTranslate + delta;
        }

        function end() {
            if (!isDragging) return;
            const movedBy = currentTranslate - prevTranslate;
            const step = stepWidth();
            const threshold = Math.min(50, step / 5);

            if (movedBy < -threshold && (currentIndex + slidesToShow) < slides.length) currentIndex++;
            else if (movedBy > threshold && currentIndex > 0) currentIndex--;

            slider.style.transition = 'transform 0.3s ease-out';
            updateSliderPosition();

            if (animationID) cancelAnimationFrame(animationID);
            animationID = 0;
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
            if (hasMoved) { e.preventDefault(); e.stopPropagation(); }
        }, true);

        // Bind to the STATIC viewport
        if (supportsPointer) {
            viewport.addEventListener('pointerdown', (e) => begin(getX(e)));
            viewport.addEventListener('pointermove', (e) => move(getX(e)));
            viewport.addEventListener('pointerup',   end);
            viewport.addEventListener('pointerleave', () => { if (isDragging) end(); });
            viewport.addEventListener('pointercancel', () => {
                slider.style.transition = 'transform 0.3s ease-out';
                slider.style.transform = `translateX(${prevTranslate}px)`;
                if (animationID) cancelAnimationFrame(animationID);
                animationID = 0; isDragging = false; sliderContainer.classList.remove('dragging');
            });
        } else {
            // iOS-safe touch fallback
            viewport.addEventListener('touchstart', (e) => begin(getX(e)), { passive: true });
            viewport.addEventListener('touchmove',  (e) => { if (isDragging) e.preventDefault(); move(getX(e)); }, { passive: false });
            viewport.addEventListener('touchend',   end, { passive: true });
            viewport.addEventListener('touchcancel', () => {
                slider.style.transition = 'transform 0.3s ease-out';
                slider.style.transform = `translateX(${prevTranslate}px)`;
                if (animationID) cancelAnimationFrame(animationID);
                animationID = 0; isDragging = false; sliderContainer.classList.remove('dragging');
            });

            // Desktop mouse fallback
            viewport.addEventListener('mousedown', (e) => begin(getX(e)));
            window.addEventListener('mousemove', (e) => move(getX(e)));
            window.addEventListener('mouseup',   end);
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
