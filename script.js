document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select');
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.createElement('ul'); // Create UL for nav links
    if (categoryNavContainer) categoryNavContainer.appendChild(categoryLinksListUl);
    
    const menuDisplayArea = document.getElementById('menu-display-area');
    let currentVisibleMenuItems = {}; 
    const MAX_VISIBLE_ITEMS_DEFAULT = 3; 

    // --- Theme Toggle ---
    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        document.body.classList.toggle('dark-mode', !isLight);
        if (themeToggleButton) {
            themeToggleButton.querySelector('.icon-light').style.display = isLight ? 'none' : 'inline';
            themeToggleButton.querySelector('.icon-dark').style.display = isLight ? 'inline' : 'none';
        }
    }
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

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
            const categoryName = category.dataset.categoryName || category.querySelector('h2').textContent.replace(`(${branchValue})`, '').trim();
            
            if (categoryId && categoryName) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${categoryId}`;
                link.textContent = categoryName;
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('#category-nav-container a').forEach(a => a.classList.remove('active'));
                    this.classList.add('active');
                    const targetElement = document.getElementById(this.hash.substring(1));
                    if (targetElement) {
                        // Calculate offset if category nav is sticky
                        const navHeight = categoryNavContainer.offsetHeight;
                        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20; // 20px buffer
                        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    }
                });
                listItem.appendChild(link);
                categoryLinksListUl.appendChild(listItem);
            }
        });
        if (categoryLinksListUl.querySelector('a')) {
            categoryLinksListUl.querySelector('a').classList.add('active');
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
        button.textContent = isExpanded ? 'عرض أقل' : `عرض المزيد من ${categoryDiv.dataset.categoryName || 'الأصناف'}`;
        
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
        const showMoreButton = categoryDiv.querySelector('.show-more-button');
        if (!itemsGrid || !showMoreButton) {
            if(showMoreButton) showMoreButton.style.display = 'none';
            return;
        }

        const allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
        if (allItems.length > MAX_VISIBLE_ITEMS_DEFAULT) {
            showMoreButton.style.display = 'block';
            const categoryName = categoryDiv.dataset.categoryName || 'الأصناف';
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
            
            // Event listener (clone to avoid multiple bindings if re-initialized)
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
        categories.forEach(category => {
            initializeShowMoreForCategory(category);
        });
    }

    // --- Initial Setup & Event Listeners ---
    if (branchSelect) {
        updateActiveMenu(branchSelect.value); // Initialize on page load
        branchSelect.addEventListener('change', function() {
            updateActiveMenu(this.value);
            // Scroll to top of menu display area after branch change for better UX
            if(menuDisplayArea) menuDisplayArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } else { // Fallback if no branch selector
        const firstBranchMenu = document.querySelector('.branch-menu');
        if(firstBranchMenu) {
            firstBranchMenu.classList.add('active-menu');
            updateCategoryNavigation(firstBranchMenu.id.replace('menu-', ''));
            initializeShowMoreForBranch(firstBranchMenu);
        }
    }
    
    // Event delegation for "Add to Cart" buttons
    if (menuDisplayArea) {
        menuDisplayArea.addEventListener('click', function(event) {
            if (event.target.classList.contains('add-to-cart')) {
                const menuItem = event.target.closest('.menu-item');
                const itemName = menuItem ? menuItem.querySelector('.item-details h3')?.textContent : 'منتج';
                alert(`تمت إضافة "${itemName}" للسلة (وظيفة تجريبية).`);
            }
        });
    }

    // Update year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Active category link highlighting on scroll (Scroll Spy)
    const categoryNavLinks = categoryNavContainer ? categoryNavContainer.querySelectorAll('ul a') : [];
    const menuCategories = menuDisplayArea ? menuDisplayArea.querySelectorAll('.menu-category') : [];

    function onScroll() {
        let currentCategory = "";
        menuCategories.forEach(category => {
            const categoryTop = category.getBoundingClientRect().top;
            // Adjust offset based on sticky nav height + some buffer
            const offset = (categoryNavContainer ? categoryNavContainer.offsetHeight : 0) + 50; 
            if (categoryTop <= offset) {
                currentCategory = category.getAttribute('id');
            }
        });

        categoryNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentCategory}`) {
                link.classList.add('active');
                // Scroll the nav to keep active link in view if nav is scrollable horizontally
                if(categoryNavContainer.scrollWidth > categoryNavContainer.clientWidth) {
                    link.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }
        });
    }
    if (categoryNavLinks.length > 0 && menuCategories.length > 0) {
      window.addEventListener('scroll', onScroll);
    }

});
