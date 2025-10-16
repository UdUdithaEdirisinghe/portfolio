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
        let startPos = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let animationID;

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

        function updateSliderPosition() {
            const cardWidth = slides[0].offsetWidth;
            const totalStepWidth = cardWidth + gap;
            currentTranslate = currentIndex * -totalStepWidth;
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
            if (isDragging) requestAnimationFrame(animation);
        }

        function pointerDown(event) {
            isDragging = true;
            startPos = event.clientX;
            slider.style.transition = 'none';
            animationID = requestAnimationFrame(animation);
            slider.setPointerCapture(event.pointerId);
        }

        function pointerMove(event) {
            if (isDragging) {
                const currentPosition = event.clientX;
                currentTranslate = prevTranslate + currentPosition - startPos;
            }
        }

        function pointerUp(event) {
            if (!isDragging) return;
            isDragging = false;
            cancelAnimationFrame(animationID);

            const movedBy = currentTranslate - prevTranslate;

            // Snap logic: if moved more than 50px, switch slide
            if (movedBy < -50 && (currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
            }
            if (movedBy > 50 && currentIndex > 0) {
                currentIndex--;
            }

            slider.style.transition = 'transform 0.3s ease-out';
            updateSliderPosition();
            slider.releasePointerCapture(event.pointerId);
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
        
        slider.addEventListener('pointerdown', pointerDown);
        slider.addEventListener('pointermove', pointerMove);
        slider.addEventListener('pointerup', pointerUp);
        slider.addEventListener('pointerleave', (e) => { if(isDragging) pointerUp(e) }); // End drag if cursor leaves

        window.addEventListener('resize', () => {
            updateSlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            createIndicators();
            setTimeout(() => {
                slider.style.transition = 'none';
                updateSliderPosition();
                slider.style.transition = 'transform 0.3s ease-out';
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