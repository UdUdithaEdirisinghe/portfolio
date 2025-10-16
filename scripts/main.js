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

    // ---- HORIZONTAL PROJECT SLIDER LOGIC ----
    const projectSlider = document.querySelector('.project-slider');
    if (projectSlider) {
        // (This code remains unchanged)
        const prevBtn = document.querySelector('.prev-project-btn');
        const nextBtn = document.querySelector('.next-project-btn');
        const slides = Array.from(projectSlider.children);
        let currentIndex = 0;
        let slidesToShow = 2;
        const style = getComputedStyle(projectSlider);
        const gap = parseInt(style.getPropertyValue('gap'));

        function updateProjectSlidesToShow() {
            if (window.innerWidth <= 768) {
                slidesToShow = 1;
            } else {
                slidesToShow = 2;
            }
        }

        function updateProjectSliderPosition() {
            const cardWidth = slides[0].offsetWidth; 
            const totalStepWidth = cardWidth + gap;
            projectSlider.style.transform = `translateX(-${currentIndex * totalStepWidth}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }

        nextBtn.addEventListener('click', () => {
            if ((currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
                updateProjectSliderPosition();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateProjectSliderPosition();
            }
        });

        window.addEventListener('resize', () => {
            updateProjectSlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            updateProjectSliderPosition();
        });

        updateProjectSlidesToShow();
        updateProjectSliderPosition();
    }

    // ---- NEW: HORIZONTAL ACTIVITY SLIDER LOGIC ----
    const activitySlider = document.querySelector('.activity-slider');
    if (activitySlider) {
        const prevBtn = document.querySelector('.prev-activity-btn');
        const nextBtn = document.querySelector('.next-activity-btn');
        const slides = Array.from(activitySlider.children);
        let currentIndex = 0;
        let slidesToShow = 3; // Default to 3 for desktop

        const style = getComputedStyle(activitySlider);
        const gap = parseInt(style.getPropertyValue('gap'));

        function updateActivitySlidesToShow() {
            if (window.innerWidth <= 768) {
                slidesToShow = 1; // 1 on mobile
            } else if (window.innerWidth <= 960) {
                slidesToShow = 2; // 2 on tablet
            } else {
                slidesToShow = 3; // 3 on desktop
            }
        }

        function updateActivitySliderPosition() {
            const cardWidth = slides[0].offsetWidth;
            const totalStepWidth = cardWidth + gap;
            activitySlider.style.transform = `translateX(-${currentIndex * totalStepWidth}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = (currentIndex + slidesToShow) >= slides.length;
        }

        nextBtn.addEventListener('click', () => {
            if ((currentIndex + slidesToShow) < slides.length) {
                currentIndex++;
                updateActivitySliderPosition();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateActivitySliderPosition();
            }
        });

        window.addEventListener('resize', () => {
            updateActivitySlidesToShow();
            if ((currentIndex + slidesToShow) > slides.length) {
                currentIndex = Math.max(0, slides.length - slidesToShow);
            }
            updateActivitySliderPosition();
        });

        updateActivitySlidesToShow();
        updateActivitySliderPosition();
    }
});