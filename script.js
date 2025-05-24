document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select');
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.getElementById('category-links-list');
    const menuDisplayArea = document.getElementById('menu-display-area');
    const backToTopButton = document.getElementById('back-to-top');
    const featuredItemsGrid = document.getElementById('featured-items-grid');
    const featuredItemsSection = document.getElementById('featured-items-section');


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

    // --- Branch Specific Menu & Category Navigation ---
    function updateCategoryNavigation(branchValue) {
        if (!categoryLinksListUl) return;
        categoryLinksListUl.innerHTML = '';
        const activeMenuDiv = document.getElementById(`menu-${branchValue}`);
        if (!activeMenuDiv) return;

        // Add link for Featured Items first if it exists and is visible
        if (featuredItemsSection && featuredItemsSection.style.display !== 'none') {
            const featuredCatId = featuredItemsSection.id;
            const featuredCatName = featuredItemsSection.querySelector('h2')?.textContent.trim() || "أطباق مميزة";
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

    function updateActiveMenu(selectedBranchValue, isInitialLoad = false) {
        document.querySelectorAll('.branch-menu').forEach(menu => menu.classList.remove('active-menu'));
        const activeMenuDiv = document.getElementById(`menu-${selectedBranchValue}`);
        if (activeMenuDiv) {
            activeMenuDiv.classList.add('active-menu');
            initializeShowMoreForBranch(activeMenuDiv);
            observeMenuItems(activeMenuDiv);
            populateFeaturedItems(selectedBranchValue); // Populate featured AFTER menu is active
            updateCategoryNavigation(selectedBranchValue); // Update nav AFTER featured might be populated/shown
            
            if (!isInitialLoad && categoryNavContainer) {
                 const navContainerTop = categoryNavContainer.getBoundingClientRect().top + window.pageYOffset;
                 window.scrollTo({ top: navContainerTop - 10, behavior: 'smooth'}); // Scroll to top of nav
            }
        }
    }
    
    // --- Featured Items ---
    function populateFeaturedItems(branchValue) {
        if (!featuredItemsGrid || !featuredItemsSection) return;
        featuredItemsGrid.innerHTML = ''; 

        const activeMenuDiv = document.getElementById(`menu-${branchValue}`);
        if (!activeMenuDiv) {
            featuredItemsSection.style.display = 'none';
            return;
        }
        
        // Example: Pick first 2-3 items from the active branch's first *actual* menu category
        const firstRealCategory = activeMenuDiv.querySelector('.menu-category:not(.featured-items)');
        if (!firstRealCategory) {
            featuredItemsSection.style.display = 'none';
            return;
        }

        const itemsToFeature = Array.from(firstRealCategory.querySelectorAll('.menu-item'));
        let count = 0;
        
        // Simple logic: take first 3, or fewer if not available
        for (let i = 0; i < itemsToFeature.length && count < 3; i++) {
            const clonedItem = itemsToFeature[i].cloneNode(true);
            clonedItem.classList.add('featured-item'); 
            clonedItem.classList.remove('animate-on-scroll', 'extra-item'); 
            clonedItem.style.opacity = 1; 
            clonedItem.style.transform = 'translateY(0)';
            // Remove show more button if it gets cloned from a category item
            const clonedShowMore = clonedItem.querySelector('.show-more-button');
            if(clonedShowMore) clonedShowMore.remove();
            
            featuredItemsGrid.appendChild(clonedItem);
            count++;
        }

        if (count === 0) {
             featuredItemsSection.style.display = 'none';
        } else {
            featuredItemsSection.style.display = 'block';
            observeMenuItems(featuredItemsGrid); // Animate featured items too
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
                // If expanded, make sure it's observed for animation
                if (isExpanded && item.classList.contains('animate-on-scroll')) {
                    item.classList.remove('is-visible'); // Reset animation state
                    itemObserver.observe(item);
                }
            }
        });
    }
    function initializeShowMoreForCategory(categoryDiv) {
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
    }
    function initializeShowMoreForBranch(branchMenuDiv) {
        const categories = branchMenuDiv.querySelectorAll('.menu-category:not(.featured-items)');
        categories.forEach(categoryDiv => { initializeShowMoreForCategory(categoryDiv); });
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
                    const offset = navHeight + 15; // Adjusted buffer
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            });
        });
    }

    // --- Scroll Spy for Category Navigation ---
    function handleScrollSpy() {
        if (!categoryNavContainer || !menuDisplayArea) return;
        const navLinks = categoryLinksListUl.querySelectorAll('a');
        const activeBranchMenu = menuDisplayArea.querySelector('.branch-menu.active-menu');
        if (!activeBranchMenu) return;
        
        // Include featured section in scroll spy if it's visible
        const sectionsToSpy = [
            ...(featuredItemsSection && featuredItemsSection.style.display !== 'none' ? [featuredItemsSection] : []),
            ...activeBranchMenu.querySelectorAll('.menu-category:not(.featured-items)')
        ];

        if (navLinks.length === 0 || sectionsToSpy.length === 0) return;

        let currentSectionInView = "";
        const navContainerHeight = categoryNavContainer.offsetHeight;
        const scrollSpyOffset = navContainerHeight + 30; 

        sectionsToSpy.forEach(section => {
            const sectionRect = section.getBoundingClientRect();
            if (sectionRect.top <= scrollSpyOffset && sectionRect.bottom >= scrollSpyOffset) {
                currentSectionInView = section.getAttribute('id');
            } else if (sectionRect.top <= scrollSpyOffset && sectionRect.top > 0 && !currentSectionInView) {
                if (!currentSectionInView) currentSectionInView = section.getAttribute('id');
            }
        });
        
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
            if (window.pageYOffset > 250) { 
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
    }, { threshold: 0.1 }); 

    function observeMenuItems(parentElement) { // parentElement can be a branchMenuDiv or featuredItemsGrid
        const itemsToAnimate = parentElement.querySelectorAll('.menu-item.animate-on-scroll');
        itemsToAnimate.forEach(item => {
            // Reset animation state if re-observing (e.g., after branch switch)
            item.classList.remove('is-visible');
            item.style.opacity = '0'; 
            item.style.transform = 'translateY(30px)';
            itemObserver.observe(item);
        });
    }

    // --- Initial Setup & Event Listeners ---
    if (branchSelect) {
        // Set default selected branch from HTML <option selected>
        const defaultBranch = branchSelect.value;
        updateActiveMenu(defaultBranch, true); // true for isInitialLoad

        branchSelect.addEventListener('change', function() {
            updateActiveMenu(this.value);
        });
    } else { 
        const firstBranchMenu = document.querySelector('.branch-menu');
        if(firstBranchMenu){
            const defaultBranchID = firstBranchMenu.id.replace('menu-', '');
            if(branchSelect) branchSelect.value = defaultBranchID; 
            updateActiveMenu(defaultBranchID, true);
        }
    }
    
    // Event delegation for "Add to Cart"
    if (menuDisplayArea) {
        menuDisplayArea.addEventListener('click', function(event) {
            if (event.target.classList.contains('add-to-cart')) {
                const menuItem = event.target.closest('.menu-item');
                const itemName = menuItem ? menuItem.querySelector('.item-details h3')?.textContent : 'منتج';
                alert(`تمت إضافة "${itemName}" للسلة (وظيفة تجريبية).`);
            }
        });
    }
    if (featuredItemsGrid) { // Also for featured items
        featuredItemsGrid.addEventListener('click', function(event) {
             if (event.target.classList.contains('add-to-cart')) {
                const menuItem = event.target.closest('.menu-item');
                const itemName = menuItem ? menuItem.querySelector('.item-details h3')?.textContent : 'منتج';
                alert(`تمت إضافة "${itemName}" من الأطباق المميزة للسلة (وظيفة تجريبية).`);
            }
        });
    }


    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    
    handleScrollSpy(); // Initial call
});
