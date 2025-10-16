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

    // ---- OPTIMIZED HORIZONTAL SLIDER LOGIC (with swipe for full slide, no dragging) ----
    function setupOptimizedSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, desktopSlides, tabletSlides) {
        const sliderContainer = document.querySelector(containerSelector);
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector(sliderSelector);
        const prevBtn = sliderContainer.querySelector(prevBtnSelector);
        const nextBtn = sliderContainer.querySelector(nextBtnSelector);
        const slides = Array.from(slider.children);

        let currentIndex = 0;
        let slidesToShow = desktopSlides;
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 75; // Minimum pixels for a swipe to register as an intentional slide

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
            const newTranslateX = currentIndex * -getStepWidth();
            slider.style.transform = `translateX(${newTranslateX}px)`;
            updateArrowStates();
        }

        function updateArrowStates() {
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }
        
        // Navigation functions for buttons and swipes
        function showNext() {
            if ((currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
                updateSliderPosition();
            }
        }

        function showPrev() {
            if (currentIndex > 0) {
                currentIndex--;
                updateSliderPosition();
            }
        }

        // --- Event Listeners ---

        // Arrow button listeners
        nextBtn.addEventListener('click', showNext);
        prevBtn.addEventListener('click', showPrev);

        // Touch/Swipe Logic on the slider viewport
        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            // Optionally, prevent default to avoid scrolling, but only if you're sure you want to capture all horizontal swipes
            // e.preventDefault(); 
        }, { passive: true }); // Use passive: true for better scroll performance

        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX; // Use changedTouches for touchend
            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    // Swiped left (want to go to next slide)
                    showNext();
                } else {
                    // Swiped right (want to go to previous slide)
                    showPrev();
                }
            }
            // Reset touch coordinates
            touchStartX = 0;
            touchEndX = 0;
        });

        // Window resize listener
        window.addEventListener('resize', () => {
            updateSlidesToShow();
            // Adjust current index if resizing makes it out of bounds
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
    setupOptimizedSlider('.project-slider-container', '.project-slider', '.prev-project-btn', '.next-project-btn', 2);
    setupOptimizedSlider('.activity-slider-container', '.activity-slider', '.prev-activity-btn', '.next-activity-btn', 3, 2);
});