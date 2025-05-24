document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select');
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.getElementById('category-links-list'); // Assuming this UL is now directly in HTML or created if not
    
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
        if (!categoryLinksListUl) return;
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
        // Smooth scroll for new category links
        setupCategoryLinkScrolling();
        // Activate first link by default or based on scroll position
        if (categoryLinksListUl.querySelector('a')) {
           // categoryLinksListUl.querySelector('a').classList.add('active'); // Let scroll spy handle this
           handleScrollSpy(); // Initial check
        }
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
                // Toggle display. 'flex' is assumed for .menu-item
                item.style.display = isExpanded ? 'flex' : 'none'; 
                item.classList.toggle('extra-item', !isExpanded);
            }
        });
    }
    
    function initializeShowMoreForCategory(categoryDiv) {
        const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
        let showMoreButton = categoryDiv.querySelector('.show-more-button'); // Let, as we might replace it
        
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
            
            const newButton = showMoreButton.cloneNode(true);
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
                    const controlsWrapperHeight = document.querySelector('.controls-wrapper') ? document.querySelector('.controls-wrapper').offsetHeight : 0;
                    // const headerHeight = document.querySelector('.site-header') ? document.querySelector('.site-header').offsetHeight : 0;
                    // Total offset for elements that become sticky above the target
                    const totalOffset = navContainerHeight + controlsWrapperHeight + 20; // 20px buffer

                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - totalOffset;
                    
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
                // Scroll to a point slightly above the menu display area to account for sticky navs
                 const controlsWrapperHeight = document.querySelector('.controls-wrapper') ? document.querySelector('.controls-wrapper').offsetHeight : 0;
                 const offset = controlsWrapperHeight + 10; // 10px buffer
                 const targetPosition = menuDisplayArea.getBoundingClientRect().top + window.pageYOffset - offset;
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
        const categories = menuDisplayArea.querySelectorAll('.branch-menu.active-menu .menu-category');
        if (navLinks.length === 0 || categories.length === 0) return;

        let currentCategory = '';
        const navContainerHeight = categoryNavContainer.offsetHeight;
        const controlsWrapperHeight = document.querySelector('.controls-wrapper').offsetHeight;
        const scrollSpyOffset = navContainerHeight + controlsWrapperHeight + 30; // Adjusted offset

        categories.forEach(category => {
            const categoryTop = category.getBoundingClientRect().top;
            if (categoryTop <= scrollSpyOffset) {
                currentCategory = category.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentCategory}`) {
                link.classList.add('active');
                // Scroll active link into view if category nav is horizontally scrollable
                if (categoryNavContainer.scrollWidth > categoryNavContainer.clientWidth) {
                    link.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        });
    }
    window.addEventListener('scroll', handleScrollSpy);
    // Call once on load if there are categories
    if (menuDisplayArea.querySelector('.branch-menu.active-menu .menu-category')) {
        handleScrollSpy();
    }
});
