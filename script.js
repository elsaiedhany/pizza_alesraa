document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select');
    const categoryLinksList = document.getElementById('category-links-list');
    const menuDisplayArea = document.getElementById('menu-display-area');
    let currentVisibleMenuItems = {}; // To store how many items are visible per category

    const MAX_VISIBLE_ITEMS_DEFAULT = 3; // Number of items to show before "Show More"

    // --- Theme Toggle ---
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            if (themeToggleButton) {
                themeToggleButton.querySelector('.icon-light').style.display = 'none';
                themeToggleButton.querySelector('.icon-dark').style.display = 'inline';
            }
        } else { // dark or null
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            if (themeToggleButton) {
                themeToggleButton.querySelector('.icon-light').style.display = 'inline';
                themeToggleButton.querySelector('.icon-dark').style.display = 'none';
            }
        }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('dark'); // Default to dark
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Branch Specific Menu Logic ---
    function updateActiveMenu(selectedBranchValue) {
        document.querySelectorAll('.branch-menu').forEach(menu => {
            menu.classList.remove('active-menu');
            menu.style.display = 'none'; // Ensure it's hidden
        });
        const activeMenuDiv = document.getElementById(`menu-${selectedBranchValue}`);
        if (activeMenuDiv) {
            activeMenuDiv.classList.add('active-menu');
            activeMenuDiv.style.display = 'block'; // Ensure it's shown
            updateCategoryNavigation(selectedBranchValue);
            initializeShowMoreForBranch(activeMenuDiv);
        }
    }

    function updateCategoryNavigation(branchValue) {
        if (!categoryLinksList) return;
        categoryLinksList.innerHTML = ''; // Clear existing links

        const activeMenuDiv = document.getElementById(`menu-${branchValue}`);
        if (!activeMenuDiv) return;

        const categories = activeMenuDiv.querySelectorAll('.menu-category');
        categories.forEach(category => {
            const categoryId = category.id;
            const categoryTitle = category.querySelector('h2').textContent.replace(`(${branchValue})`, '').trim(); // Clean title
            if (categoryId && categoryTitle) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${categoryId}`;
                link.textContent = categoryTitle;
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('.category-nav a').forEach(a => a.classList.remove('active'));
                    this.classList.add('active');
                    const targetElement = document.getElementById(this.hash.substring(1));
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                listItem.appendChild(link);
                categoryLinksList.appendChild(listItem);
            }
        });
        // Activate first link by default
        if (categoryLinksList.querySelector('a')) {
            categoryLinksList.querySelector('a').classList.add('active');
        }
    }

    // --- "Show More" Logic ---
    function toggleExtraItems(categoryDiv, button) {
        const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
        if (!itemsGrid) return;

        const categoryId = categoryDiv.id;
        let currentlyVisible = currentVisibleMenuItems[categoryId] || MAX_VISIBLE_ITEMS_DEFAULT;
        let allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
        
        // Check if we are expanding or collapsing
        if (button.classList.contains('expanded')) { // Collapse
            allItems.forEach((item, index) => {
                if (index >= MAX_VISIBLE_ITEMS_DEFAULT) {
                    item.style.display = 'none';
                    item.classList.add('extra-item');
                }
            });
            button.textContent = 'عرض المزيد';
            button.classList.remove('expanded');
            currentVisibleMenuItems[categoryId] = MAX_VISIBLE_ITEMS_DEFAULT;
        } else { // Expand
            allItems.forEach(item => {
                item.style.display = 'flex'; // or 'block' depending on your .menu-item display
                item.classList.remove('extra-item');
            });
            button.textContent = 'عرض أقل';
            button.classList.add('expanded');
            currentVisibleMenuItems[categoryId] = allItems.length;
        }
    }
    
    function initializeShowMoreForCategory(categoryDiv) {
        const itemsGrid = categoryDiv.querySelector('.menu-items-grid');
        const showMoreButton = categoryDiv.querySelector('.show-more-button');
        if (!itemsGrid || !showMoreButton) {
            if(showMoreButton) showMoreButton.style.display = 'none'; // Hide button if no grid
            return;
        }

        const allItems = Array.from(itemsGrid.querySelectorAll('.menu-item'));
        currentVisibleMenuItems[categoryDiv.id] = 0; // Reset counter

        if (allItems.length > MAX_VISIBLE_ITEMS_DEFAULT) {
            showMoreButton.style.display = 'block';
            showMoreButton.textContent = 'عرض المزيد';
            showMoreButton.classList.remove('expanded');

            allItems.forEach((item, index) => {
                if (index >= MAX_VISIBLE_ITEMS_DEFAULT) {
                    item.style.display = 'none';
                    item.classList.add('extra-item');
                } else {
                    item.style.display = 'flex'; // Ensure first few are visible
                    item.classList.remove('extra-item');
                    currentVisibleMenuItems[categoryDiv.id]++;
                }
            });

            // Remove previous event listener to avoid multiple bindings
            const newButton = showMoreButton.cloneNode(true);
            showMoreButton.parentNode.replaceChild(newButton, showMoreButton);
            
            newButton.addEventListener('click', () => {
                toggleExtraItems(categoryDiv, newButton);
            });
        } else {
            showMoreButton.style.display = 'none'; // Hide button if not enough items
             allItems.forEach(item => { // Ensure all items are visible if less than MAX
                item.style.display = 'flex';
                item.classList.remove('extra-item');
            });
        }
    }

    function initializeShowMoreForBranch(branchMenuDiv) {
        const categories = branchMenuDiv.querySelectorAll('.menu-category');
        categories.forEach(category => {
            initializeShowMoreForCategory(category);
        });
    }


    // --- Initial Setup ---
    if (branchSelect) {
        const initialBranch = branchSelect.value;
        updateActiveMenu(initialBranch); // Initialize menu for the default selected branch

        branchSelect.addEventListener('change', function() {
            updateActiveMenu(this.value);
        });
    } else {
        // Fallback if no branch selector - initialize for the first .branch-menu found
        const firstBranchMenu = document.querySelector('.branch-menu');
        if(firstBranchMenu) {
            firstBranchMenu.classList.add('active-menu');
            firstBranchMenu.style.display = 'block';
            updateCategoryNavigation(firstBranchMenu.id.replace('menu-', ''));
            initializeShowMoreForBranch(firstBranchMenu);
        }
    }
    

    // Add to cart alert (placeholder)
    menuDisplayArea.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
            const menuItemContainer = event.target.closest('.menu-item');
            if (!menuItemContainer) return;
            const itemNameElement = menuItemContainer.querySelector('.item-details h3');
            const itemName = itemNameElement ? itemNameElement.textContent : 'منتج غير معروف';
            alert(`تم إضافة "${itemName}" للسلة (هذه وظيفة تجريبية للتوضيح).`);
        }
    });

    // Update year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Smooth scroll for category navigation if it was not handled by link.addEventListener
    // This is more of a global smooth scroll for any #hash links if preferred
    // document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    //     anchor.addEventListener('click', function (e) {
    //         const href = this.getAttribute('href');
    //         if (href.length > 1 && href.startsWith('#')) { // Ensure it's a valid internal link
    //             e.preventDefault();
    //             const targetElement = document.querySelector(href);
    //             if (targetElement) {
    //                 targetElement.scrollIntoView({
    //                     behavior: 'smooth'
    //                 });
    //             }
    //         }
    //     });
    // });
});
