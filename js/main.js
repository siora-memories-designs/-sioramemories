// ============================================
// SIORA MEMORIES AND DESIGN - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. PRELOADER
    // - Hide preloader after page loads with fade animation
    // - Add 'loaded' class to body
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        const dismissPreloader = () => {
            if (preloader.style.display === 'none') return;
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.add('loaded');
            }, 500);
        };

        if (document.readyState === 'complete') {
            dismissPreloader();
        } else {
            window.addEventListener('load', dismissPreloader);
            setTimeout(dismissPreloader, 1500); // Safety fallback
        }
    }

    // 2. NAVBAR
    // - Add shadow/background on scroll (class 'scrolled' when scrollY > 50)
    // - Active link highlighting based on current page URL
    // - Smooth scroll for anchor links
    // - Mobile hamburger toggle (toggle 'active' class on .hamburger and .nav-links)
    // - Close mobile menu when a link is clicked
    // - Close mobile menu when clicking outside
    
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Hamburger toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // Close mobile menu on link click
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (navLinks && navLinks.classList.contains('active')) {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }
    });

    // Active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinksItems.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. SCROLL ANIMATIONS (Intersection Observer)
    // - Add 'visible' class to elements with class 'fade-in' or 'slide-up' when they enter viewport
    // - threshold: 0.1, rootMargin: '0px 0px -50px 0px'
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px 50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
        observer.observe(el);
    });

    // 4. COUNTER ANIMATION (for stats section)
    // - Animate numbers from 0 to their data-target value
    // - Only animate when in viewport
    // - Duration: 2000ms with easeOutQuad
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 2000;
            const start = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutQuad
                const eased = 1 - (1 - progress) * (1 - progress);
                const current = Math.floor(eased * target);
                counter.textContent = current + suffix;
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + suffix;
                }
            }
            requestAnimationFrame(updateCounter);
        });
        countersAnimated = true;
    }

    const statsSection = document.querySelector('.about-stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        statsObserver.observe(statsSection);
    }

    // 5. TESTIMONIAL SLIDER
    // - Auto-advance every 5 seconds
    // - Manual navigation with prev/next buttons
    // - Dot indicators
    // - Smooth slide transition
    // - Pause on hover
    const slider = document.querySelector('.testimonial-slider');
    const slides = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;
    let slideInterval;

    function initSlider() {
        if (!slider || slides.length === 0) return;

        // Create dots
        if (dotsContainer) {
            slides.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            });
        }

        showSlide(0);
        startAutoSlide();

        // Pause on hover
        if (slider) {
            slider.addEventListener('mouseenter', stopAutoSlide);
            slider.addEventListener('mouseleave', startAutoSlide);
        }
    }

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
            slide.style.opacity = i === index ? '1' : '0';
        });
        const dots = document.querySelectorAll('.slider-dots .dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }

    function goToSlide(index) {
        showSlide(index);
    }

    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoSlide(); prevSlide(); startAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoSlide(); nextSlide(); startAutoSlide(); });

    initSlider();

    // 6. GALLERY FILTER
    // - Filter gallery items by category
    // - Smooth show/hide animation
    // - Active filter button highlighting
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hide');
                    item.classList.add('show');
                } else {
                    item.classList.remove('show');
                    item.classList.add('hide');
                }
            });
        });
    });

    // 7. LIGHTBOX
    // - Open lightbox on gallery image click
    // - Close on overlay click, close button, or Escape key
    // - Navigate between images with arrows
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox img');
    const closeLightbox = document.querySelector('.close-lightbox');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (lightbox && lightboxImg && img) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    if (closeLightbox) {
        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // 8. CONTACT FORM
    // - Form validation
    // - Show success message
    // - Clear form after submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Simple validation
            const inputs = this.querySelectorAll('input[required], textarea[required]');
            let valid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    valid = false;
                    input.style.borderColor = '#e74c3c';
                    input.addEventListener('input', () => {
                        input.style.borderColor = '';
                    }, { once: true });
                }
            });

            // Email validation
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    valid = false;
                    emailInput.style.borderColor = '#e74c3c';
                }
            }

            if (valid) {
                const submitBtn = this.querySelector('.submit-btn');
                if (submitBtn) {
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Sending...';
                    submitBtn.disabled = true;

                    // Simulate form submission
                    setTimeout(() => {
                        submitBtn.textContent = 'Message Sent! ✓';
                        submitBtn.style.backgroundColor = '#27ae60';
                        this.reset();

                        setTimeout(() => {
                            submitBtn.textContent = originalText;
                            submitBtn.style.backgroundColor = '';
                            submitBtn.disabled = false;
                        }, 3000);
                    }, 1500);
                }
            }
        });
    }

    // 9. SCROLL TO TOP
    // - Show button when scrolled down 300px
    // - Smooth scroll to top on click
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    window.addEventListener('scroll', () => {
        if (scrollTopBtn) {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 10. TYPING EFFECT for hero tagline
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const texts = [
            'Turning Moments Into Forever',
            'Your Story, Beautifully Designed',
            'Custom Designs for Every Occasion',
            'Made with Love ♥'
        ];
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function typeText() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typingElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 50;
            } else {
                typingElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 100;
            }

            if (!isDeleting && charIndex === currentText.length) {
                typingSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typingSpeed = 500; // Pause before new text
            }

            setTimeout(typeText, typingSpeed);
        }

        typeText();
    }

    // 11. PARALLAX EFFECT (subtle)
    window.addEventListener('scroll', () => {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const scrolled = window.scrollY;
            const heroImg = heroSection.querySelector('.hero-image');
            if (heroImg) {
                heroImg.style.transform = `translateY(${scrolled * 0.1}px)`;
            }
        }
    });

    // 12. LAZY LOADING for images
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

});
