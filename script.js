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
    const unifiedMenuDiv = document.getElementById('unified-menu'); // This should be the ID of the div that holds all menu categories now

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
            console.error("Unified menu container (#unified-menu) not found!");
            return;
        }

        // Ensure the unified menu div is visible (it has .active-menu by default in HTML)
        unifiedMenuDiv.style.display = 'block'; 
        
        // Remove other branch menus as they are not used anymore in this unified setup
        const tantaMenu = document.getElementById('menu-tanta');
        const mitghamrMenu = document.getElementById('menu-mitghamr');
        if(tantaMenu) tantaMenu.remove(); // Remove instead of hide
        if(mitghamrMenu) mitghamrMenu.remove(); // Remove instead of hide

        populateFeaturedItemsForUnifiedMenu(unifiedMenuDiv); 
        updateCategoryNavigationForUnifiedMenu(unifiedMenuDiv); 
        initializeShowMoreForCategories(unifiedMenuDiv);
        observeMenuItems(unifiedMenuDiv); 
        if (featuredItemsGrid && featuredItemsGrid.children.length > 0) { // Check if featured items were actually populated
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
        // Example: Pick first 3 items
        for (let i = 0; i < itemsToConsiderForFeatured.length && count < 3; i++) {
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
                if (isExpanded && item.classList.contains('animate-on-scroll') && !item.classList.contains('is-visible')) {
                    // If revealing, ensure it's re-observed if it wasn't visible yet
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
        if (featuredItemsSection && featuredItemsSection.style.display !== 'none' && featuredItemsGrid.children.length > 0) {
            sectionsToSpy.push(featuredItemsSection);
        }
        sectionsToSpy.push(...unifiedMenuDiv.querySelectorAll('.menu-category:not(.featured-items)'));

        if (navLinks.length === 0 || sectionsToSpy.length === 0) return;

        let currentSectionInView = "";
        const navContainerHeight = categoryNavContainer.offsetHeight;
        // Offset should be slightly more than the sticky nav's height to ensure the section title is well past the nav
        const scrollSpyOffset = navContainerHeight + 30; 

        for (let i = sectionsToSpy.length - 1; i >= 0; i--) { // Check from bottom up
            const section = sectionsToSpy[i];
            const sectionRect = section.getBoundingClientRect();
            // If the top of the section is above or at the spy line
            if (sectionRect.top <= scrollSpyOffset) {
                currentSectionInView = section.getAttribute('id');
                break; 
            }
        }
        
        // If scrolled to the very top and no section is "active", or if the first section is partially visible
        if (!currentSectionInView && sectionsToSpy.length > 0) {
            const firstSection = sectionsToSpy[0];
            const firstSectionRect = firstSection.getBoundingClientRect();
            // If the first section is at the top of the viewport or just slightly below the spy line after nav
            if (firstSectionRect.top < window.innerHeight && firstSectionRect.bottom > scrollSpyOffset) {
                 currentSectionInView = firstSection.getAttribute('id');
            }
        }


        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionInView}`) {
                link.classList.add('active');
                if (categoryNavContainer.scrollWidth > categoryNavContainer.clientWidth && link.offsetParent) { // Check if link is visible
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
    }, { threshold: 0.05 }); // Trigger animation when 5% of item is visible

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
        initializeUnifiedMenu(); 
    } else {
        console.error("Main menu container '#unified-menu' not found. Site may not function correctly.");
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
    
    // Call scroll spy once after everything is set up to highlight the correct initial section
    setTimeout(handleScrollSpy, 100); // Timeout to ensure DOM is fully painted
});
