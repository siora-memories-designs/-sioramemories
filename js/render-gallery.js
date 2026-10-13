// Folder & Category Browsing Gallery System for Siora Memories and Design
document.addEventListener('DOMContentLoaded', async () => {
    const categoriesView = document.getElementById('categories-view');
    const categoriesGrid = document.getElementById('categories-grid');
    const categoryMediaView = document.getElementById('category-media-view');
    const categoryMediaGrid = document.getElementById('category-media-grid');
    const categoryEmptyState = document.getElementById('category-empty-state');
    const emptyFolderPath = document.getElementById('empty-folder-path');
    const activeCategoryTitle = document.getElementById('active-category-title');
    const activeCategoryCount = document.getElementById('active-category-count');
    const backBtn = document.getElementById('back-to-categories-btn');
    const galleryBannerTitle = document.getElementById('gallery-title');
    const galleryBannerSubtitle = document.getElementById('gallery-subtitle');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = document.querySelector('.lightbox img');
    const gallerySection = document.getElementById('gallery-section');

    if (!categoriesGrid || !categoryMediaGrid) return;

    // 8 Official Category Definitions
    const CATEGORIES = [
        { id: 'websites', title: 'Websites', folder: 'images/gallery/websites/', allowVideo: true },
        { id: 'portfolio', title: 'Portfolio', folder: 'images/gallery/portfolio/', allowVideo: false },
        { id: 'memory-albums', title: 'Memory Albums', folder: 'images/gallery/memory-albums/', allowVideo: false },
        { id: 'invitations', title: 'Invitations', folder: 'images/gallery/invitations/', allowVideo: true },
        { id: 'posters', title: 'Posters', folder: 'images/gallery/posters/', allowVideo: false },
        { id: 'polaroid-albums', title: 'Polaroid Albums', folder: 'images/gallery/polaroid-albums/', allowVideo: false },
        { id: 'visiting-cards', title: 'Visiting Cards', folder: 'images/gallery/visiting-cards/', allowVideo: false },
        { id: 'photo-frames', title: 'Photo Frames', folder: 'images/gallery/photo-frames/', allowVideo: false }
    ];

    let galleryData = {};

    // 1. Fetch gallery media dynamically from the server
    async function loadGalleryData() {
        if (window.location.protocol === 'file:') {
            if (typeof galleryCategoriesData !== 'undefined') {
                return galleryCategoriesData;
            }
        }

        try {
            const res = await fetch('/api/gallery?t=' + Date.now(), { cache: 'no-store' });
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('API /api/gallery unreachable, falling back to static data:', err);
        }

        // Static fallback if opened without server
        if (typeof galleryCategoriesData !== 'undefined') {
            return galleryCategoriesData;
        }

        return {};
    }

    galleryData = await loadGalleryData();

    // 2. Render the 8 Folder / Category Cards
    function renderCategories() {
        categoriesGrid.innerHTML = '';

        CATEGORIES.forEach(cat => {
            const data = galleryData[cat.id] || { items: [] };
            const items = data.items || [];
            const count = items.length;
            const coverImage = `images/services/${cat.id}.png`;

            const card = document.createElement('div');
            card.className = 'folder-card';
            card.setAttribute('data-category', cat.id);

            const countText = count === 0 ? 'No photos yet' : (count === 1 ? '1 item' : `${count} items`);

            card.innerHTML = `
                <div class="folder-card-image-wrap">
                    <img src="${coverImage}" alt="${cat.title}" class="folder-card-img" onerror="this.src='images/services/portfolio.png'">
                    <span class="folder-badge"><i class="fas fa-folder"></i> Folder</span>
                </div>
                <div class="folder-card-body">
                    <div class="folder-card-header-row">
                        <h3 class="folder-card-title">${cat.title}</h3>
                        <span class="folder-count-badge">${countText}</span>
                    </div>
                    <p class="folder-card-subtitle">Click to view ${cat.title} folder</p>
                    <div class="folder-card-footer">
                        <span class="folder-open-link">Open Folder <i class="fas fa-chevron-right"></i></span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.hash = '#' + cat.id;
            });

            categoriesGrid.appendChild(card);
        });
    }

    // 3. Open a Specific Category Media View
    function openCategory(categoryId, smoothScroll = true) {
        const catConfig = CATEGORIES.find(c => c.id === categoryId);
        if (!catConfig) {
            showCategoriesView();
            return;
        }

        const data = galleryData[categoryId] || { items: [] };
        const items = data.items || [];

        // Update header & badges
        if (activeCategoryTitle) activeCategoryTitle.textContent = catConfig.title;
        if (activeCategoryCount) {
            activeCategoryCount.textContent = items.length === 0 ? 'No photos yet' : (items.length === 1 ? '1 item' : `${items.length} items`);
        }
        if (galleryBannerSubtitle) {
            galleryBannerSubtitle.textContent = `Viewing folder: ${catConfig.title}`;
        }

        // Toggle views
        categoriesView.style.display = 'none';
        categoryMediaView.style.display = 'block';

        // Render media items
        categoryMediaGrid.innerHTML = '';

        if (items.length === 0) {
            categoryMediaGrid.style.display = 'none';
            if (categoryEmptyState) {
                categoryEmptyState.style.display = 'block';
                if (emptyFolderPath) emptyFolderPath.textContent = catConfig.folder;
            }
        } else {
            if (categoryEmptyState) categoryEmptyState.style.display = 'none';
            categoryMediaGrid.style.display = 'grid';

            items.forEach(item => {
                if (item.type === 'video' && catConfig.allowVideo) {
                    // HTML5 Video Player with controls
                    const videoItem = document.createElement('div');
                    videoItem.className = 'gallery-video-item';
                    videoItem.innerHTML = `
                        <div class="video-wrapper">
                            <video controls playsinline preload="metadata" src="${item.src}">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div class="video-info">
                            <span class="video-tag"><i class="fas fa-video"></i> Video</span>
                            <span class="video-name" title="${item.name}">${item.name}</span>
                        </div>
                    `;
                    categoryMediaGrid.appendChild(videoItem);
                } else if (item.type === 'image') {
                    // Image item with lightbox preview
                    const imgItem = document.createElement('div');
                    imgItem.className = 'gallery-item show';
                    imgItem.setAttribute('data-src', item.src);
                    imgItem.innerHTML = `
                        <img src="${item.src}" alt="${item.alt || catConfig.title}" loading="lazy">
                        <div class="gallery-overlay">
                            <i class="fas fa-search-plus"></i>
                        </div>
                    `;

                    imgItem.addEventListener('click', () => {
                        if (lightbox && lightboxImg) {
                            lightboxImg.src = item.src;
                            lightboxImg.alt = item.alt || catConfig.title;
                            lightbox.classList.add('active');
                            document.body.style.overflow = 'hidden';
                        }
                    });

                    categoryMediaGrid.appendChild(imgItem);
                }
            });
        }

        if (smoothScroll && gallerySection) {
            gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // 4. Return to Categories View
    function showCategoriesView() {
        // Pause any playing videos
        document.querySelectorAll('video').forEach(vid => vid.pause());

        categoryMediaView.style.display = 'none';
        categoriesView.style.display = 'block';

        if (galleryBannerSubtitle) {
            galleryBannerSubtitle.textContent = "A glimpse into the beautiful memories we've designed.";
        }
    }

    // 5. Back Button listener
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '';
        });
    }

    // 6. Hash Router for Back/Forward Navigation & Direct URL access
    function handleRoute() {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) {
            const matched = CATEGORIES.some(c => c.id === hash);
            if (matched) {
                openCategory(hash, false);
                return;
            }
        }
        showCategoriesView();
    }

    window.addEventListener('hashchange', handleRoute);

    // Initial render
    renderCategories();
    handleRoute();
});
