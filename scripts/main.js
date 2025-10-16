document.addEventListener('DOMContentLoaded', () => {
    // ---- MODAL GALLERY LOGIC (Unchanged) ----
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
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });
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

    // ---- ADVANCED HORIZONTAL SLIDER LOGIC ----
    function setupAdvancedSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, desktopSlides, tabletSlides) {
        const sliderContainer = document.querySelector(containerSelector);
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector(sliderSelector);
        const prevBtn = sliderContainer.querySelector(prevBtnSelector);
        const nextBtn = sliderContainer.querySelector(nextBtnSelector);
        const slides = Array.from(slider.children);

        let currentIndex = 0;
        let slidesToShow = desktopSlides;
        let isDragging = false, startPos = 0, currentTranslate = 0, prevTranslate = 0, animationID;

        const style = getComputedStyle(slider);
        const gap = parseInt(style.getPropertyValue('gap'));

        function updateSlidesToShow() {
            if (window.innerWidth <= 768) slidesToShow = 1;
            else if (window.innerWidth <= 960) slidesToShow = tabletSlides || desktopSlides;
            else slidesToShow = desktopSlides;
        }

        function getStepWidth() {
            if (slides.length === 0) return 0;
            return slides[0].offsetWidth + gap;
        }

        function updateSliderPosition() {
            currentTranslate = currentIndex * -getStepWidth();
            prevTranslate = currentTranslate;
            setSliderPosition();
            updateArrowStates();
        }

        function setSliderPosition() {
            slider.style.transform = `translateX(${currentTranslate}px)`;
        }

        function updateArrowStates() {
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }
        
        function animation() {
            setSliderPosition();
            if(isDragging) requestAnimationFrame(animation);
        }

        function touchStart(index) {
            return function(event) {
                isDragging = true;
                startPos = getPositionX(event);
                animationID = requestAnimationFrame(animation);
                slider.style.transition = 'none'; // Disable transition while dragging
            }
        }

        function touchMove(event) {
            if (isDragging) {
                const currentPosition = getPositionX(event);
                currentTranslate = prevTranslate + currentPosition - startPos;
            }
        }

        function touchEnd() {
            isDragging = false;
            cancelAnimationFrame(animationID);
            
            const movedBy = currentTranslate - prevTranslate;
            
            // Snap logic: if moved more than 30% of a card's width, or a quick flick
            if (movedBy < -50 && currentIndex < slides.length - slidesToShow) currentIndex += 1;
            if (movedBy > 50 && currentIndex > 0) currentIndex -= 1;
            
            slider.style.transition = 'transform 0.5s ease-in-out'; // Re-enable for snap animation
            updateSliderPosition();
        }

        function getPositionX(event) {
            return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
        }

        // Arrow button listeners
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

        // Add touch and mouse event listeners for swiping
        slides.forEach((slide, index) => {
            slide.addEventListener('dragstart', (e) => e.preventDefault());
            // Touch events
            slide.addEventListener('touchstart', touchStart(index));
            slide.addEventListener('touchend', touchEnd);
            slide.addEventListener('touchmove', touchMove);
            // Mouse events (for desktop dragging)
            slide.addEventListener('mousedown', touchStart(index));
            slide.addEventListener('mouseup', touchEnd);
            slide.addEventListener('mouseleave', () => { if(isDragging) touchEnd() });
            slide.addEventListener('mousemove', touchMove);
        });

        // Window resize listener
        window.addEventListener('resize', () => {
            updateSlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            updateSliderPosition();
        });

        // Initial setup
        updateSlidesToShow();
        updateSliderPosition();
    }
    
    // Initialize sliders
    setupAdvancedSlider('.project-slider-container', '.project-slider', '.prev-project-btn', '.next-project-btn', 2);
    setupAdvancedSlider('.activity-slider-container', '.activity-slider', '.prev-activity-btn', '.next-activity-btn', 3, 2);
});