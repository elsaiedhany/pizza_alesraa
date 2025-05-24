document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    // const branchSelect = document.getElementById('branch-select'); // No longer used for content switching
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.getElementById('category-links-list');
    
    const menuDisplayArea = document.getElementById('menu-display-area');
    const backToTopButton = document.getElementById('back-to-top');
    const featuredItemsGrid = document.getElementById('featured-items-grid');
    const featuredItemsSection = document.getElementById('featured-items-section');

    // The unified menu is the content within the #unified-menu div
    const unifiedMenuDiv = document.getElementById('unified-menu');

    const MAX_VISIBLE_ITEMS_DEFAULT = 3; 

    // --- Theme Toggle ---
    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        document.body.classList.toggle('dark-mode', !isLight);
        if (themeToggleButton) {
            const lightIcon = themeToggleButton.querySelector('.icon-light');
            const darkIcon = themeToggleButton.querySelector('.icon-dark');
            if (lightIcon) lightIcon.style.display = isLight ? 'none' : 'inline';
            if (darkIcon) darkIcon.style.display = isLight ? 'inline' : 'none';
        }
    }
    const preferredTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(preferredTheme);

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Unified Menu Logic ---
    function initializeUnifiedMenu() {
        if (!unifiedMenuDiv) {
            console.error("Unified menu container not found!");
            return;
        }

        // Make sure the unified menu is visible (it has .active-menu by default in HTML)
        unifiedMenuDiv.style.display = 'block'; 
        
        // The content for other branches is just for show if someone inspects HTML,
        // but we will hide them explicitly here to be safe and ensure only unified menu is targeted by JS.
        const tantaMenu = document.getElementById('menu-tanta');
        const mitghamrMenu = document.getElementById('menu-mitghamr');
        if(tantaMenu) tantaMenu.style.display = 'none';
        if(mitghamrMenu) mitghamrMenu.style.display = 'none';


        populateFeaturedItemsForUnifiedMenu(unifiedMenuDiv); 
        updateCategoryNavigationForUnifiedMenu(unifiedMenuDiv); 
        initializeShowMoreForCategories(unifiedMenuDiv);
        observeMenuItems(unifiedMenuDiv); 
        if (featuredItemsGrid && featuredItemsGrid.children.length > 0) {
            observeMenuItems(featuredItemsGrid);
        }
    }


    function updateCategoryNavigationForUnifiedMenu(activeMenuDiv) {
        if (!categoryLinksListUl || !activeMenuDiv) return;
        categoryLinksListUl.innerHTML = ''; 

        if (featuredItemsSection && featuredItemsSection.style.display !== 'none' && featuredItemsGrid && featuredItemsGrid.children.length > 0) {
            const featuredCatId = featuredItemsSection.id;
            const featuredCatNameElement = featuredItemsSection.querySelector('h2');
            const featuredCatName = featuredCatNameElement ? featuredCatNameElement.textContent.trim() : "أطباق مميزة";
            if (featuredCatId && featuredCatName) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${featuredCatId}`;
                link.textContent = featuredCatName;
                listItem.appendChild(link);
                categoryLinksListUl.appendChild(listItem);
            }
        }
        
        const categories = activeMenuDiv.querySelectorAll('.menu-category:not(.featured-items)');
        categories.forEach(category => {
            const categoryId = category.id;
            const categoryName = category.dataset.categoryName || category.querySelector('h2')?.textContent.trim();
            
            if (categoryId && categoryName) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${categoryId}`;
                link.textContent = categoryName;
                listItem.appendChild(link);
                categoryLinksListUl.appendChild(listItem);
            }
        });
        setupCategoryLinkScrolling();
        handleScrollSpy(); 
    }
    
    // --- Featured Items for Unified Menu ---
    function populateFeaturedItemsForUnifiedMenu(activeMenuDiv) {
        if (!featuredItemsGrid || !featuredItemsSection || !activeMenuDiv) {
             if(featuredItemsSection) featuredItemsSection.style.display = 'none';
            return;
        }
        featuredItemsGrid.innerHTML = ''; 

        const itemsToConsiderForFeatured = [];
        activeMenuDiv.querySelectorAll('.menu-category:not(.featured-items) .menu-item').forEach(item => {
            itemsToConsiderForFeatured.push(item);
        });

        let count = 0;
        // Example: Pick first 3 items that have an image placeholder with content (not just "صورة...")
        // This is a simple heuristic, can be improved.
        for (let i = 0; i < itemsToConsiderForFeatured.length && count < 3; i++) {
            const imgPlaceholder = itemsToConsiderForFeatured[i].querySelector('.item-image-placeholder span');
            if (imgPlaceholder && imgPlaceholder.textContent && !imgPlaceholder.textContent.startsWith("صورة ")) { // Basic check
                const clonedItem = itemsToConsiderForFeatured[i].cloneNode(true);
                clonedItem.classList.add('featured-item'); 
                clonedItem.classList.remove('animate-on-scroll', 'extra-item'); 
                clonedItem.style.opacity = 1; 
                clonedItem.style.transform = 'translateY(0)';
                const clonedShowMore = clonedItem.querySelector('.show-more-button');
                if(clonedShowMore) clonedShowMore.remove();
                featuredItemsGrid.appendChild(clonedItem);
                count++;
            } else if (i < 3 && count === 0) { // Fallback: if no "good" images, just take first ones
                const clonedItem = itemsToConsiderForFeatured[i].cloneNode(true);
                clonedItem.classList.add('featured-item'); 
                clonedItem.classList.remove('animate-on-scroll', 'extra-item'); 
                clonedItem.style.opacity = 1; 
                clonedItem.style.transform = 'translateY(0)';
                const clonedShowMore = clonedItem.querySelector('.show-more-button');
                if(clonedShowMore) clonedShowMore.remove();
                featuredItemsGrid.appendChild(clonedItem);
                count++;
            }
        }


        if (count === 0) {
             featuredItemsSection.style.display = 'none';
        } else {
            featuredItemsSection.style.display = 'block'; 
            observeMenuItems(featuredItemsGrid); 
        }
    }

    // --- "Show More" Logic ---
    function toggleExtraItems(categoryDiv, button) {
        const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
        if (!itemsGrid) return;
        const isExpanded = button.classList.toggle('expanded');
        const categoryName = categoryDiv.dataset.categoryName || 'الأصناف';
        button.textContent = isExpanded ? 'عرض أقل' : `عرض المزيد من ${categoryName}`;
        const allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
        allItems.forEach((item, index) => {
            if (index >= MAX_VISIBLE_ITEMS_DEFAULT) {
                item.style.display = isExpanded ? 'flex' : 'none'; 
                item.classList.toggle('extra-item', !isExpanded);
                if (isExpanded && item.classList.contains('animate-on-scroll')) {
                    item.classList.remove('is-visible'); 
                    itemObserver.observe(item);
                }
            }
        });
    }
    function initializeShowMoreForCategories(menuContainer) { 
        const categories = menuContainer.querySelectorAll('.menu-category:not(.featured-items)');
        categories.forEach(categoryDiv => {
            const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
            let showMoreButton = categoryDiv.querySelector('.show-more-button');
            if (!itemsGrid || !showMoreButton) { if(showMoreButton) showMoreButton.style.display = 'none'; return; }
            const allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
            const categoryName = categoryDiv.dataset.categoryName || 'الأصناف';
            if (allItems.length > MAX_VISIBLE_ITEMS_DEFAULT) {
                showMoreButton.style.display = 'block';
                showMoreButton.textContent = `عرض المزيد من ${categoryName}`;
                showMoreButton.classList.remove('expanded');
                allItems.forEach((item, index) => {
                    if (index >= MAX_VISIBLE_ITEMS_DEFAULT) { item.style.display = 'none'; item.classList.add('extra-item'); }
                    else { item.style.display = 'flex'; item.classList.remove('extra-item'); }
                });
                const newButton = showMoreButton.cloneNode(true);
                showMoreButton.parentNode.replaceChild(newButton, showMoreButton);
                newButton.addEventListener('click', () => toggleExtraItems(categoryDiv, newButton));
            } else {
                showMoreButton.style.display = 'none';
                allItems.forEach(item => { item.style.display = 'flex'; item.classList.remove('extra-item'); });
            }
        });
    }
    
    // --- Category Link Scrolling ---
    function setupCategoryLinkScrolling() {
        if (!categoryLinksListUl) return;
        const links = categoryLinksListUl.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('#category-nav-container a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
                const targetElement = document.querySelector(this.hash);
                if (targetElement) {
                    const navHeight = categoryNavContainer ? categoryNavContainer.offsetHeight : 0;
                    const offset = navHeight + 15; 
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            });
        });
    }

    // --- Scroll Spy for Category Navigation ---
    function handleScrollSpy() {
        if (!categoryNavContainer || !unifiedMenuDiv || !categoryLinksListUl) return;
        
        const navLinks = categoryLinksListUl.querySelectorAll('a');
        const sectionsToSpy = [];
        if (featuredItemsSection && featuredItemsSection.style.display !== 'none' && featuredItemsGrid && featuredItemsGrid.children.length > 0) {
            sectionsToSpy.push(featuredItemsSection);
        }
        sectionsToSpy.push(...unifiedMenuDiv.querySelectorAll('.menu-category:not(.featured-items)'));

        if (navLinks.length === 0 || sectionsToSpy.length === 0) return;

        let currentSectionInView = "";
        const navContainerHeight = categoryNavContainer.offsetHeight;
        const scrollSpyOffset = navContainerHeight + 30; 

        for (let i = sectionsToSpy.length - 1; i >= 0; i--) {
            const section = sectionsToSpy[i];
            const sectionRect = section.getBoundingClientRect();
            if (sectionRect.top <= scrollSpyOffset) {
                currentSectionInView = section.getAttribute('id');
                break; 
            }
        }
        
        if (!currentSectionInView && sectionsToSpy.length > 0) {
            const firstSectionRect = sectionsToSpy[0].getBoundingClientRect();
             if (!(firstSectionRect.top > scrollSpyOffset)) {
                 currentSectionInView = sectionsToSpy[0].getAttribute('id');
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionInView}`) {
                link.classList.add('active');
                if (categoryNavContainer.scrollWidth > categoryNavContainer.clientWidth) {
                    link.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        });
    }
    window.addEventListener('scroll', handleScrollSpy, { passive: true });

    // --- Back to Top Button ---
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 280) { 
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        }, { passive: true });
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Scroll Animations for Menu Items ---
    const itemObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.05 }); 

    function observeMenuItems(parentElement) { 
        const itemsToAnimate = parentElement.querySelectorAll('.menu-item.animate-on-scroll');
        itemsToAnimate.forEach(item => {
            item.classList.remove('is-visible'); 
            item.style.opacity = '0'; 
            item.style.transform = 'translateY(30px)';
            itemObserver.observe(item);
        });
    }

    // --- Initial Setup ---
    if (unifiedMenuDiv) {
        initializeUnifiedMenu(); // This function will now handle all setup for the single menu
    }
    
    // Event delegation for "Add to Cart"
    function handleAddToCartClick(event) {
        if (event.target.classList.contains('add-to-cart')) {
            const menuItem = event.target.closest('.menu-item');
            const itemName = menuItem ? menuItem.querySelector('.item-details h3')?.textContent : 'منتج';
            alert(`تمت إضافة "${itemName}" للسلة (وظيفة تجريبية).`);
        }
    }
    const mainElement = document.querySelector('.site-main');
    if (mainElement) {
        mainElement.addEventListener('click', handleAddToCartClick);
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    handleScrollSpy(); // Initial call for scroll spy
});
