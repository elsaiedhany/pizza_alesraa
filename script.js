document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    const sunIcon = themeToggleButton ? themeToggleButton.querySelector('.icon-light') : null;
    const moonIcon = themeToggleButton ? themeToggleButton.querySelector('.icon-dark') : null;

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline';
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            if (sunIcon) sunIcon.style.display = 'inline';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }

    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        // Default to dark mode if no theme saved and body doesn't already have light-mode
        if (!document.body.classList.contains('light-mode')) {
            applyTheme('dark');
        }
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let themeToSet;
            if (document.body.classList.contains('dark-mode')) {
                themeToSet = 'light';
            } else {
                themeToSet = 'dark';
            }
            applyTheme(themeToSet);
            localStorage.setItem('theme', themeToSet);
        });
    }

    // Add to cart alert (placeholder)
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (event) => {
            const menuItemContainer = event.target.closest('.menu-item');
            if (!menuItemContainer) return;

            const itemNameElement = menuItemContainer.querySelector('.item-details h3');
            const itemName = itemNameElement ? itemNameElement.textContent : 'منتج غير معروف';
            
            alert(`تم إضافة "${itemName}" للسلة (هذه وظيفة تجريبية للتوضيح).`);
        });
    });

    // Update year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Branch selector logic (placeholder)
    const branchSelector = document.getElementById('branch');
    if (branchSelector) {
        branchSelector.addEventListener('change', function() {
            console.log('تم اختيار الفرع:', this.value, this.options[this.selectedIndex].text);
            // Add logic here to handle branch change if needed
        });
    }
});
