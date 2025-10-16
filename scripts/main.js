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
            // Ensure we only attach listeners to visible items (not the hidden duplicates for the gallery)
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

    // ---- GENERIC SLIDER LOGIC WITH TOUCH SUPPORT ----
    function setupSlider(containerSelector, sliderSelector, prevBtnSelector, nextBtnSelector, slidesToShowConfig) {
        const sliderContainer = document.querySelector(containerSelector);
        if (!sliderContainer) return;

        const slider = sliderContainer.querySelector(sliderSelector);
        const prevBtn = sliderContainer.querySelector(prevBtnSelector);
        const nextBtn = sliderContainer.querySelector(nextBtnSelector);
        const slides = Array.from(slider.children);
        
        if (!slider || !prevBtn || !nextBtn || slides.length === 0) return;

        let currentIndex = 0;
        let slidesToShow = slidesToShowConfig.desktop.slides;
        const gap = parseInt(getComputedStyle(slider).getPropertyValue('gap'));

        // Touch event variables
        let touchStartX = 0;
        let touchEndX = 0;

        function updateSlidesToShow() {
            // Use the config to determine how many slides to show at different breakpoints
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
            slider.style.transform = `translateX(-${currentIndex * totalStepWidth}px)`;

            // Update button states
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }
        
        function moveNext() {
            if ((currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
                updateSliderPosition();
            }
        }
        
        function movePrev() {
            if (currentIndex > 0) {
                currentIndex--;
                updateSliderPosition();
            }
        }

        // --- Touch Event Handlers ---
        function handleTouchStart(e) {
            touchStartX = e.touches[0].clientX;
        }
        
        function handleTouchMove(e) {
            // We store the end position on move to track the swipe gesture
            touchEndX = e.touches[0].clientX;
        }

        function handleTouchEnd() {
            const swipeThreshold = 75; // Minimum swipe distance in pixels
            if (touchStartX - touchEndX > swipeThreshold) {
                moveNext(); // Swiped left
            } else if (touchEndX - touchStartX > swipeThreshold) {
                movePrev(); // Swiped right
            }
            // Reset values for the next touch
            touchStartX = 0;
            touchEndX = 0;
        }

        // --- Event Listeners ---
        nextBtn.addEventListener('click', moveNext);
        prevBtn.addEventListener('click', movePrev);
        
        // Add passive event listeners for better scroll performance on touch devices
        slider.addEventListener('touchstart', handleTouchStart, { passive: true });
        slider.addEventListener('touchmove', handleTouchMove, { passive: true });
        slider.addEventListener('touchend', handleTouchEnd);

        window.addEventListener('resize', () => {
            updateSlidesToShow();
            // Adjust currentIndex if it becomes out of bounds after resizing
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            // Use a slight delay to ensure layout has settled before recalculating
            setTimeout(updateSliderPosition, 100);
        });

        // --- Initial Setup ---
        updateSlidesToShow();
        updateSliderPosition();
    }
    
    // ---- APPLY SLIDER LOGIC TO PROJECTS ----
    setupSlider(
        '#projects',
        '.project-slider',
        '.prev-project-btn',
        '.next-project-btn',
        {
            mobile: { breakpoint: 768, slides: 1 },
            tablet: { breakpoint: 960, slides: 2 }, // Defaulting to 2 for consistency
            desktop: { slides: 2 }
        }
    );
    
    // ---- APPLY SLIDER LOGIC TO ACTIVITIES ----
    setupSlider(
        '#extracurricular',
        '.activity-slider',
        '.prev-activity-btn',
        '.next-activity-btn',
        {
            mobile: { breakpoint: 768, slides: 1 },
            tablet: { breakpoint: 960, slides: 2 },
            desktop: { slides: 3 }
        }
    );
});
