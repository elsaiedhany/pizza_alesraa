document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.documentElement; // Target <html> for class
    const logoImage = document.getElementById('logoImage');
    const lightLogoSrc = 'placeholder_logo_light.png'; // Path to your logo for light mode
    const darkLogoSrc = 'placeholder_logo_dark.png';   // Path to your logo for dark mode (or same if it works on both)

    // Function to set theme and save preference
    function setTheme(theme) {
        if (theme === 'light') {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            if (logoImage) logoImage.src = lightLogoSrc; // Change logo for light mode
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            if (logoImage) logoImage.src = darkLogoSrc; // Change logo for dark mode
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('dark'); // Default to dark mode
    }

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });

    // Update current year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Placeholder for "Add to cart" functionality
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.closest('.menu-item').querySelector('h4').textContent;
            alert(`"${itemName}" تم إضافته للسلة (وظيفة تجريبية).`);
            // Future: Implement actual cart logic here
        });
    });

    // Set initial logo based on current theme (in case it was loaded from localStorage)
    if (body.classList.contains('dark-mode')) {
         if (logoImage) logoImage.src = darkLogoSrc;
    } else {
         if (logoImage) logoImage.src = lightLogoSrc;
    }
    // If you don't have separate logos, you can remove logoImage related lines or use CSS filters as in the header for the light theme.
    // For simplicity, I've used placeholder_logo.png in HTML. You'll need to replace this and potentially adjust JS for logo switching if you have different logo files.
    // If your logo is an SVG or a PNG that works well on both light/dark (or you use CSS filters), this JS part for logo src might be simpler.
    // The example CSS in header uses a filter for the light mode. The JS here is an alternative if you have distinct files.
    // For now, I'll ensure the HTML one 'placeholder_logo.png' is used and the CSS filter handles it for light mode on the text part, image will be as is.
    // Let's simplify the logo handling for now to use the one in HTML and rely on CSS or manual replacement.
    // So, removing the logoSrc changes from JS for now to keep it focused. The CSS filter in header is a good start for text logo.
    // You'll need to provide 'placeholder_logo.png', 'placeholder_logo_light.png', 'placeholder_logo_dark.png' if you use the JS logo switching.
    // Or, provide one 'placeholder_logo.png' and adapt its display with CSS filters if possible.
    // For this example, I will assume you will manually set the `placeholder_logo.png` in HTML to one that works or handle it purely with CSS.
    // The existing `body.light-mode .logo img { filter: brightness(0) invert(1); }` is a good CSS-only way for simple logos on colored background.
});
