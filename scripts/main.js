document.addEventListener('DOMContentLoaded', () => {
    // ---- MODAL GALLERY LOGIC ----
    const modal = document.getElementById('image-modal');
    if (modal) {
        // (This code remains unchanged)
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

    // ---- HORIZONTAL SLIDER LOGIC (Abstracted for reuse) ----
    function setupSlider(sliderElement, prevBtn, nextBtn, desktopSlidesToShow, tabletSlidesToShow = null) {
        const slides = Array.from(sliderElement.children);
        let currentIndex = 0;
        let slidesToShow = desktopSlidesToShow;

        const style = getComputedStyle(sliderElement);
        const gap = parseInt(style.getPropertyValue('gap'));

        function updateSlidesToShow() {
            if (tabletSlidesToShow && window.innerWidth <= 960 && window.innerWidth > 768) {
                slidesToShow = tabletSlidesToShow; // For tablets
            } else if (window.innerWidth <= 768) {
                slidesToShow = 1; // Always 1 for mobile
            } else {
                slidesToShow = desktopSlidesToShow; // Default for desktop
            }
        }

        function updateSliderPosition() {
            const cardWidth = slides[0].offsetWidth; 
            const totalStepWidth = cardWidth + gap;
            sliderElement.style.transform = `translateX(-${currentIndex * totalStepWidth}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }

        // Navigation functions
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

        nextBtn.addEventListener('click', showNext);
        prevBtn.addEventListener('click', showPrev);

        window.addEventListener('resize', () => {
            updateSlidesToShow();
            // Adjust current index if resizing makes it out of bounds
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            updateSliderPosition();
        });

        // ---- Touch/Swipe Logic ----
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50; // Minimum pixels for a swipe to register

        sliderElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        sliderElement.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
        });

        sliderElement.addEventListener('touchend', () => {
            const swipeDistance = touchStartX - touchEndX;

            if (swipeDistance > minSwipeDistance) {
                // Swiped left (want to go to next slide)
                showNext();
            } else if (swipeDistance < -minSwipeDistance) {
                // Swiped right (want to go to previous slide)
                showPrev();
            }
            // Reset touch coordinates
            touchStartX = 0;
            touchEndX = 0;
        });

        // Initial setup
        updateSlidesToShow();
        updateSliderPosition();
    }

    // Initialize Project Slider
    const projectSlider = document.querySelector('.project-slider');
    const prevProjectBtn = document.querySelector('.prev-project-btn');
    const nextProjectBtn = document.querySelector('.next-project-btn');
    if (projectSlider && prevProjectBtn && nextProjectBtn) {
        setupSlider(projectSlider, prevProjectBtn, nextProjectBtn, 2); // 2 cards on desktop
    }

    // Initialize Activity Slider
    const activitySlider = document.querySelector('.activity-slider');
    const prevActivityBtn = document.querySelector('.prev-activity-btn');
    const nextActivityBtn = document.querySelector('.next-activity-btn');
    if (activitySlider && prevActivityBtn && nextActivityBtn) {
        setupSlider(activitySlider, prevActivityBtn, nextActivityBtn, 3, 2); // 3 cards on desktop, 2 on tablet
    }
});