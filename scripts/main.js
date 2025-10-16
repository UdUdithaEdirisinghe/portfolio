document.addEventListener('DOMContentLoaded', () => {

    // ---- MODAL GALLERY LOGIC ----
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

        function showNextImage() {
            if (currentIndex < galleryItems.length - 1) {
                currentIndex++;
                updateModalImage();
            }
        }

        function showPrevImage() {
            if (currentIndex > 0) {
                currentIndex--;
                updateModalImage();
            }
        }

        closeModal.addEventListener('click', () => modal.classList.remove('visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('visible');
        });
        nextButton.addEventListener('click', showNextImage);
        prevButton.addEventListener('click', showPrevImage);

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('visible')) {
                if (e.key === 'ArrowRight') showNextImage();
                else if (e.key === 'ArrowLeft') showPrevImage();
                else if (e.key === 'Escape') modal.classList.remove('visible');
            }
        });
    }

    // ---- GENERIC SLIDER LOGIC WITH SMOOTH POINTER EVENTS ----
    function setupSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, indicatorSelector, slidesToShowConfig) {
        const sliderContainer = document.querySelector(containerSelector);
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector(sliderSelector);
        const prevBtn = sliderContainer.querySelector(prevBtnSelector);
        const nextBtn = sliderContainer.querySelector(nextBtnSelector);
        const indicatorsContainer = sliderContainer.querySelector(indicatorSelector);
        const slides = Array.from(slider.children);

        if (!slider || !prevBtn || !nextBtn || !indicatorsContainer || slides.length === 0) return;

        let currentIndex = 0;
        let slidesToShow = slidesToShowConfig.desktop.slides;
        const gap = parseInt(getComputedStyle(slider).getPropertyValue('gap')) || 0;

        let isDragging = false;
        let hasMoved = false;
        let startPos = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationID = 0;
        let activePointerId = null;

        function createIndicators() {
            indicatorsContainer.innerHTML = '';
            const numIndicators = slides.length - slidesToShow + 1;
            if (numIndicators <= 1) return;

            for (let i = 0; i < numIndicators; i++) {
                const dot = document.createElement('div');
                dot.classList.add('indicator-dot');
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateSliderPosition();
                });
                indicatorsContainer.appendChild(dot);
            }
        }

        function updateIndicators() {
            const dots = indicatorsContainer.querySelectorAll('.indicator-dot');
            if (dots.length === 0) return;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        function updateSlidesToShow() {
            if (window.innerWidth <= slidesToShowConfig.mobile.breakpoint) {
                slidesToShow = slidesToShowConfig.mobile.slides;
            } else if (window.innerWidth <= slidesToShowConfig.tablet.breakpoint) {
                slidesToShow = slidesToShowConfig.tablet.slides;
            } else {
                slidesToShow = slidesToShowConfig.desktop.slides;
            }
        }

        function totalStepWidth() {
            const cardWidth = slides[0].offsetWidth;
            return cardWidth + gap;
        }

        function updateSliderPosition() {
            currentTranslate = currentIndex * -totalStepWidth();
            prevTranslate = currentTranslate;
            setSliderPosition();
            updateIndicators();

            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }

        function setSliderPosition() {
            slider.style.transform = `translateX(${currentTranslate}px)`;
        }

        function animation() {
            setSliderPosition();
            if (isDragging) animationID = requestAnimationFrame(animation);
        }

        function pointerDown(event) {
            isDragging = true;
            hasMoved = false;
            startPos = event.clientX;
            activePointerId = event.pointerId ?? null;
            sliderContainer.classList.add('dragging'); // disable link clicks
            slider.style.transition = 'none';
            animationID = requestAnimationFrame(animation);
            if (activePointerId !== null) {
                slider.setPointerCapture(activePointerId);
            }
        }

        function pointerMove(event) {
            if (!isDragging) return;
            const currentPosition = event.clientX;
            const delta = currentPosition - startPos;
            if (Math.abs(delta) > 5) hasMoved = true; // treat as drag, not tap
            currentTranslate = prevTranslate + delta;
        }

        function finishDrag() {
            isDragging = false;
            sliderContainer.classList.remove('dragging');
            if (animationID) cancelAnimationFrame(animationID);
            animationID = 0;
            activePointerId = null;
        }

        function pointerUp(event) {
            if (!isDragging) return;

            // Snap logic
            const movedBy = currentTranslate - prevTranslate;
            const step = totalStepWidth();

            // Threshold: either 50px or 1/5 of a card, whichever is smaller
            const threshold = Math.min(50, step / 5);

            if (movedBy < -threshold && (currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
            } else if (movedBy > threshold && currentIndex > 0) {
                currentIndex--;
            }

            slider.style.transition = 'transform 0.3s ease-out';
            updateSliderPosition();

            try {
                if (event.pointerId != null) slider.releasePointerCapture(event.pointerId);
            } catch (_) {}

            // Prevent the "ghost click" right after a drag
            if (hasMoved) {
                // brief suppression window — handled by pointer-events in CSS via .dragging class
                // The class is already removed; nothing else needed here.
            }

            finishDrag();
        }

        function pointerCancel(event) {
            // Treat as graceful end without index change
            slider.style.transition = 'transform 0.3s ease-out';
            setSliderPosition();
            try {
                if (event.pointerId != null) slider.releasePointerCapture(event.pointerId);
            } catch (_) {}
            finishDrag();
        }

        nextBtn.addEventListener('click', () => {
            if ((currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
                updateSliderPosition();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSliderPosition();
            }
        });

        // Pointer events
        slider.addEventListener('pointerdown', pointerDown);
        slider.addEventListener('pointermove', pointerMove);
        slider.addEventListener('pointerup', pointerUp);
        slider.addEventListener('pointerleave', (e) => { if (isDragging) pointerUp(e); });
        slider.addEventListener('pointercancel', pointerCancel);

        // Prevent accidental navigation when dragging starts on a link/image
        slider.addEventListener('click', (e) => {
            // If the user dragged, suppress the click that follows
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true); // capture to intercept early

        window.addEventListener('resize', () => {
            updateSlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            createIndicators();
            // Recalculate based on new widths
            setTimeout(() => {
                slider.style.transition = 'none';
                updateSliderPosition();
                // give the browser a tick to apply transform without animating
                requestAnimationFrame(() => {
                    slider.style.transition = 'transform 0.3s ease-out';
                });
            }, 100);
        });

        // Initial Setup
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
