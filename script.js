document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const branchSelect = document.getElementById('branch-select'); // مازال موجوداً في HTML لكن لن نستخدمه لتبديل المحتوى
    const categoryNavContainer = document.getElementById('category-nav-container');
    const categoryLinksListUl = document.getElementById('category-links-list');
    
    const menuDisplayArea = document.getElementById('menu-display-area');
    const backToTopButton = document.getElementById('back-to-top');
    const featuredItemsGrid = document.getElementById('featured-items-grid');
    const featuredItemsSection = document.getElementById('featured-items-section');

    // المنيو الموحد هو الآن محتوى السنبلاوين المبدئي
    const unifiedMenuContentSource = document.getElementById('menu-senbellawein');

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
    function populateAndActivateUnifiedMenu() {
        if (!unifiedMenuContentSource) return;

        // جعل منيو السنبلاوين (المصدر) هو النشط والظاهر
        unifiedMenuContentSource.classList.add('active-menu');
        unifiedMenuContentSource.style.display = 'block'; // Ensure it's visible

        // نسخ محتوى السنبلاوين إلى طنطا وميت غمر (لأن المنيو موحد)
        const tantaMenuDiv = document.getElementById('menu-tanta');
        const mitghamrMenuDiv = document.getElementById('menu-mitghamr');

        if (tantaMenuDiv) {
            tantaMenuDiv.innerHTML = unifiedMenuContentSource.innerHTML;
            // تعديل IDs الأقسام داخل منيو طنطا المنسوخ ليكون فريداً إذا أردنا تتبع مختلف
            // لكن بما أن المحتوى موحد، والـ JS سيتعامل مع الـ active-menu، قد لا نحتاج لتغيير IDs الأقسام المنسوخة
            // لكن لضمان عمل الـ scroll spy بشكل مثالي، يجب أن تكون IDs الأقسام فريدة لكل حاوية branch-menu
            // أو نعتمد على أن JS للـ scroll spy سيبحث فقط داخل الـ active-menu
             tantaMenuDiv.querySelectorAll('.menu-category').forEach(cat => {
                if (cat.id && cat.id.startsWith('senbellawein-')) {
                    cat.id = cat.id.replace('senbellawein-', 'tanta-');
                }
            });
        }
        if (mitghamrMenuDiv) {
            mitghamrMenuDiv.innerHTML = unifiedMenuContentSource.innerHTML;
            mitghamrMenuDiv.querySelectorAll('.menu-category').forEach(cat => {
                 if (cat.id && cat.id.startsWith('senbellawein-')) {
                    cat.id = cat.id.replace('senbellawein-', 'mitghamr-');
                }
            });
        }
        
        // الآن بعد أن أصبح لدينا منيو واحد (محتوى السنبلاوين)، نقوم بتهيئته
        populateFeaturedItemsForUnifiedMenu(unifiedMenuContentSource); 
        updateCategoryNavigationForUnifiedMenu(unifiedMenuContentSource); 
        initializeShowMoreForCategories(unifiedMenuContentSource);
        observeMenuItems(unifiedMenuContentSource); 
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
                link.href = `#${featuredCatId}`; // هذا الـ ID يجب أن يكون في الصفحة
                link.textContent = featuredCatName;
                listItem.appendChild(link);
                categoryLinksListUl.appendChild(listItem);
            }
        }
        
        const categories = activeMenuDiv.querySelectorAll('.menu-category:not(.featured-items)');
        categories.forEach(category => {
            const categoryId = category.id; // IDs الأقسام يجب أن تكون فريدة الآن داخل unified-menu
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
        if (!featuredItemsGrid || !featuredItemsSection || !activeMenuDiv) return;
        featuredItemsGrid.innerHTML = ''; 

        const itemsToConsiderForFeatured = [];
        activeMenuDiv.querySelectorAll('.menu-category:not(.featured-items) .menu-item').forEach(item => {
            itemsToConsiderForFeatured.push(item);
        });

        let count = 0;
        // اختيار أول 3 أصناف كأصناف مميزة (يمكن تغيير هذا المنطق)
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

    // --- "Show More" Logic (remains mostly the same, targets items in unified menu) ---
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
    function initializeShowMoreForCategories(menuContainer) { // menuContainer is now unifiedMenuDiv
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
    // No branch selector logic needed for displaying menus, only one main menu div ('unified-menu')
    // which is already set to active-menu in HTML.
    // We just need to initialize its features.
    if (unifiedMenuDiv) {
        populateAndActivateUnifiedMenu(); // This will set up everything for the unified menu
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
