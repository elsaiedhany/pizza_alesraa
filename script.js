document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select');
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.getElementById('category-links-list'); // Make sure this UL exists in HTML or is created
    
    const menuDisplayArea = document.getElementById('menu-display-area');
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

    // --- Branch Specific Menu & Category Navigation Logic ---
    function updateCategoryNavigation(branchValue) {
        if (!categoryLinksListUl) return; // Ensure UL exists
        categoryLinksListUl.innerHTML = ''; 

        const activeMenuDiv = document.getElementById(`menu-${branchValue}`);
        if (!activeMenuDiv) return;

        const categories = activeMenuDiv.querySelectorAll('.menu-category');
        categories.forEach(category => {
            const categoryId = category.id;
            const categoryName = category.dataset.categoryName || category.querySelector('h2')?.textContent.replace(`(${branchValue})`, '').trim();
            
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
    
    function updateActiveMenu(selectedBranchValue) {
        document.querySelectorAll('.branch-menu').forEach(menu => {
            menu.classList.remove('active-menu');
        });
        const activeMenuDiv = document.getElementById(`menu-${selectedBranchValue}`);
        if (activeMenuDiv) {
            activeMenuDiv.classList.add('active-menu');
            updateCategoryNavigation(selectedBranchValue);
            initializeShowMoreForBranch(activeMenuDiv);
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
            }
        });
    }
    
    function initializeShowMoreForCategory(categoryDiv) {
        const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
        let showMoreButton = categoryDiv.querySelector('.show-more-button');
        
        if (!itemsGrid || !showMoreButton) {
            if(showMoreButton) showMoreButton.style.display = 'none';
            return;
        }

        const allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
        const categoryName = categoryDiv.dataset.categoryName || 'الأصناف';

        if (allItems.length > MAX_VISIBLE_ITEMS_DEFAULT) {
            showMoreButton.style.display = 'block';
            showMoreButton.textContent = `عرض المزيد من ${categoryName}`;
            showMoreButton.classList.remove('expanded');

            allItems.forEach((item, index) => {
                if (index >= MAX_VISIBLE_ITEMS_DEFAULT) {
                    item.style.display = 'none';
                    item.classList.add('extra-item');
                } else {
                    item.style.display = 'flex';
                    item.classList.remove('extra-item');
                }
            });
            
            const newButton = showMoreButton.cloneNode(true); // Clone to remove old listeners
            showMoreButton.parentNode.replaceChild(newButton, showMoreButton);
            newButton.addEventListener('click', () => toggleExtraItems(categoryDiv, newButton));
        } else {
            showMoreButton.style.display = 'none';
            allItems.forEach(item => { item.style.display = 'flex'; item.classList.remove('extra-item'); });
        }
    }

    function initializeShowMoreForBranch(branchMenuDiv) {
        const categories = branchMenuDiv.querySelectorAll('.menu-category');
        categories.forEach(categoryDiv => {
            initializeShowMoreForCategory(categoryDiv);
        });
    }
    
    function setupCategoryLinkScrolling() {
        const links = categoryLinksListUl.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('#category-nav-container a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
                const targetElement = document.querySelector(this.hash);
                if (targetElement) {
                    const navContainerHeight = categoryNavContainer ? categoryNavContainer.offsetHeight : 0;
                    const offset = navContainerHeight + 20; // 20px buffer for spacing
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            });
        });
    }

    // --- Initial Setup & Event Listeners ---
    if (branchSelect) {
        updateActiveMenu(branchSelect.value); 
        branchSelect.addEventListener('change', function() {
            updateActiveMenu(this.value);
            if(menuDisplayArea) {
                 const navContainerHeight = categoryNavContainer ? categoryNavContainer.offsetHeight : 0;
                 const offset = navContainerHeight + 10; 
                 // Scroll to just below the category nav
                 const targetPosition = (categoryNavContainer ? categoryNavContainer.getBoundingClientRect().bottom : 0) + window.pageYOffset - offset;
                 window.scrollTo({ top: targetPosition > 0 ? targetPosition : 0, behavior: 'smooth'});
            }
        });
    } else { 
        const firstBranchMenu = document.querySelector('.branch-menu');
        if(firstBranchMenu) {
            firstBranchMenu.classList.add('active-menu');
            updateCategoryNavigation(firstBranchMenu.id.replace('menu-', ''));
            initializeShowMoreForBranch(firstBranchMenu);
        }
    }
    
    if (menuDisplayArea) {
        menuDisplayArea.addEventListener('click', function(event) {
            if (event.target.classList.contains('add-to-cart')) {
                const menuItem = event.target.closest('.menu-item');
                const itemName = menuItem ? menuItem.querySelector('.item-details h3')?.textContent : 'منتج';
                alert(`تمت إضافة "${itemName}" للسلة (وظيفة تجريبية).`);
            }
        });
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Scroll Spy for Category Navigation ---
    function handleScrollSpy() {
        if (!categoryNavContainer || !menuDisplayArea) return;
        
        const navLinks = categoryLinksListUl.querySelectorAll('a');
        // Ensure we are checking categories within the *active* branch menu
        const activeBranchMenu = menuDisplayArea.querySelector('.branch-menu.active-menu');
        if (!activeBranchMenu) return;
        const categories = activeBranchMenu.querySelectorAll('.menu-category');

        if (navLinks.length === 0 || categories.length === 0) return;

        let currentCategoryInView = "";
        const navContainerHeight = categoryNavContainer.offsetHeight;
        // Adjust offset to be slightly more than the sticky nav height for better accuracy
        const scrollSpyOffset = navContainerHeight + 30; 

        categories.forEach(category => {
            const categoryRect = category.getBoundingClientRect();
            // Check if the top of the category is above the offset and part of it is still visible
            if (categoryRect.top <= scrollSpyOffset && categoryRect.bottom >= scrollSpyOffset) {
                currentCategoryInView = category.getAttribute('id');
            } else if (categoryRect.top <= scrollSpyOffset && categoryRect.top > 0 && !currentCategoryInView) { 
                // If multiple categories are above, pick the one closest to the top of viewport (but still below nav)
                // This part might need refinement based on exact scroll behavior desired.
                // For now, the first one to pass the offset check from top to bottom will be marked.
                if (!currentCategoryInView) currentCategoryInView = category.getAttribute('id');
            }
        });
        
        // If no category is "active" by the above logic (e.g., scrolled to very top), activate the first one.
        if (!currentCategoryInView && categories.length > 0) {
            const firstCategoryRect = categories[0].getBoundingClientRect();
            if (firstCategoryRect.top > scrollSpyOffset) { // If first category is well below the spy line
                // No category should be active yet
            } else { // Otherwise, default to the first one if nothing else is explicitly active
                 currentCategoryInView = categories[0].getAttribute('id');
            }
        }


        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentCategoryInView}`) {
                link.classList.add('active');
                if (categoryNavContainer.scrollWidth > categoryNavContainer.clientWidth) {
                    link.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
                }
            }
        });
    }
    window.addEventListener('scroll', handleScrollSpy, { passive: true }); // Use passive listener for scroll
    // Initial check
    if (menuDisplayArea.querySelector('.branch-menu.active-menu .menu-category')) {
        handleScrollSpy();
    }
});
