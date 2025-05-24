document.addEventListener('DOMContentLoaded', () => {
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { // Simulate a bit more loading time if needed
                preloader.classList.add('loaded');
            }, 500); // Adjust timing as needed
        });
    }

    // --- Back to Top Button ---
    const backToTopButton = document.getElementById('back-to-top-btn');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) { // Show button after scrolling 300px
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Scroll Animations for Menu Categories ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observerInstance.unobserve(entry.target); // Optional: stop observing once animated
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else { // Fallback for older browsers or if no elements
        animatedElements.forEach(el => el.classList.add('is-visible')); // Show them directly
    }


    // --- Cart Functionality ---
    const menuItemsElements = document.querySelectorAll('.menu-item');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const cartItemCountElement = document.getElementById('cart-item-count');
    const orderPreviewBar = document.getElementById('order-preview-bar');
    const clearCartButton = document.getElementById('clear-cart-button');
    const toggleOrderPreviewHeader = document.getElementById('order-preview-toggle-header'); // Use header for toggle
    const checkoutButton = document.getElementById('checkout-button'); // Checkout button

    const emptyCartMsgHTML = "<p class='empty-cart-message'>سلة طلباتك فارغة حالياً. أضف بعض الأصناف الشهية!</p>";
    let cart = loadCart(); // Load cart from localStorage

    // Dynamically add "Add to Cart" buttons
    menuItemsElements.forEach((itemElement, index) => {
        const itemName = itemElement.querySelector('h3').textContent.trim();
        const priceElements = itemElement.querySelectorAll('.price');
        const itemIdentifier = `item-${index}`; // Simple identifier for the item

        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.classList.add('add-buttons-wrapper');

        if (priceElements.length === 1 && !priceElements[0].textContent.includes(':')) {
            const priceText = priceElements[0].textContent;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            if (!isNaN(price)) {
                buttonsWrapper.appendChild(createAddToCartButton(itemIdentifier, itemName, 'حجم موحد', price));
            }
        } else {
            priceElements.forEach(priceElem => {
                const priceText = priceElem.textContent.trim();
                const parts = priceText.split(':');
                let size = 'حجم موحد';
                let currentPriceText = priceText;

                if (parts.length > 1) {
                    size = parts[0].trim();
                    currentPriceText = parts[1];
                }
                const price = parseFloat(currentPriceText.replace(/[^0-9.]/g, ''));
                if (!isNaN(price)) {
                    buttonsWrapper.appendChild(createAddToCartButton(itemIdentifier, itemName, size, price));
                }
            });
        }
        if (buttonsWrapper.hasChildNodes()) {
            itemElement.appendChild(buttonsWrapper);
        }
    });

    function createAddToCartButton(itemBaseId, name, size, price) {
        const button = document.createElement('button');
        button.classList.add('add-to-cart-btn');
        const uniqueId = generateCartItemId(itemBaseId, size);
        button.dataset.itemId = uniqueId;
        button.dataset.name = name;
        button.dataset.size = size;
        button.dataset.price = price;

        let buttonText = `أضف <span class="btn-price">(${price.toFixed(2)} ج)</span>`;
        if (size !== 'حجم موحد') {
            buttonText = `أضف "${size}" <span class="btn-price">(${price.toFixed(2)} ج)</span>`;
        }
        button.innerHTML = buttonText;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(button, itemBaseId, name, size, price);
            // Visual feedback
            button.classList.add('added');
            button.innerHTML = `تمت الإضافة! <span class="btn-price">(${price.toFixed(2)} ج)</span>`;
            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = buttonText; // Restore original text
            }, 1500);
        });
        return button;
    }
    
    function generateCartItemId(name, size) {
        // Sanitize name and size for ID generation
        const saneName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const saneSize = size.toLowerCase().replace(/[^a-z0-9\(\)]/g, '').replace(/[\(\)]/g, '');
        return `${saneName}-${saneSize}`;
    }


    function addToCart(buttonElement, itemBaseId, name, size, price) {
        const cartItemId = generateCartItemId(itemBaseId, size); // Use base ID for consistency
        const existingItem = cart.find(item => item.id === cartItemId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: cartItemId, name, size, price, quantity: 1 });
        }
        showAndExpandOrderPreview();
        updateCartDisplayAndSave();
    }

    function updateCartDisplayAndSave() {
        renderCartItems();
        updateCartSummary();
        saveCart();
    }
    
    function renderCartItems() {
        if (!cartItemsContainer) return;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = emptyCartMsgHTML;
            return;
        }
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.dataset.cartItemId = item.id;

            itemElement.innerHTML = `
                <div class="cart-item-details">
                    <strong>${item.name}</strong>
                    <span class="item-size">(${item.size})</span><br>
                    ${item.quantity} &times; ${item.price.toFixed(2)} ج
                </div>
                <div class="cart-item-actions">
                    <button class="btn-qty decrease-qty" data-id="${item.id}" aria-label="تقليل الكمية">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="btn-qty increase-qty" data-id="${item.id}" aria-label="زيادة الكمية">+</button>
                    <button class="btn-remove-item" data-id="${item.id}" aria-label="حذف الصنف">×</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Add event listeners for new buttons
        cartItemsContainer.querySelectorAll('.decrease-qty').forEach(btn => btn.addEventListener('click', handleQuantityChange));
        cartItemsContainer.querySelectorAll('.increase-qty').forEach(btn => btn.addEventListener('click', handleQuantityChange));
        cartItemsContainer.querySelectorAll('.btn-remove-item').forEach(btn => btn.addEventListener('click', handleRemoveItem));
    }

    function handleQuantityChange(event) {
        const itemId = event.target.dataset.id;
        const change = event.target.classList.contains('increase-qty') ? 1 : -1;
        updateQuantity(itemId, change);
    }

    function handleRemoveItem(event) {
        const itemId = event.target.dataset.id;
        removeFromCart(itemId);
    }
    
    function updateQuantity(itemId, change) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Remove item if quantity is zero or less
            }
        }
        updateCartDisplayAndSave();
    }

    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        updateCartDisplayAndSave();
    }

    function updateCartSummary() {
        if (!cartTotalElement || !cartItemCountElement) return;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = total.toFixed(2);
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItemCountElement.textContent = totalItems;

        const cartIcon = document.querySelector('.order-preview-header .cart-icon');
        if (cartIcon) {
            if (totalItems > 0) {
                cartIcon.style.animation = 'cart-icon-pulse 2s infinite ease-in-out';
            } else {
                cartIcon.style.animation = 'none';
            }
        }
    }

    function showAndExpandOrderPreview() {
        if (!orderPreviewBar) return;
        orderPreviewBar.classList.add('order-preview-visible');
        setTimeout(() => { // Allow time for visibility transition before expanding
             orderPreviewBar.classList.add('order-preview-expanded');
        }, 50); // Small delay
    }

    if (toggleOrderPreviewHeader) {
        toggleOrderPreviewHeader.addEventListener('click', (e) => {
            // Prevent toggling if a button inside the header was clicked (though we only have one now)
            if (e.target.closest('button') && e.target.closest('button').id === 'toggle-order-preview-button') {
                 orderPreviewBar.classList.toggle('order-preview-expanded');
            } else if (!e.target.closest('button')) { // If clicked on header area itself, not the arrow button
                 orderPreviewBar.classList.toggle('order-preview-expanded');
            }
        });
        // Specifically for the arrow button
        const arrowButton = document.getElementById('toggle-order-preview-button');
        if(arrowButton) {
            arrowButton.addEventListener('click', (e) => {
                 e.stopPropagation(); // Prevent header click event
                 orderPreviewBar.classList.toggle('order-preview-expanded');
            });
        }
    }
    

    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            if (confirm('هل أنت متأكد أنك تريد مسح كل الطلبات من السلة؟')) {
                cart = [];
                updateCartDisplayAndSave();
                // Optionally, collapse the cart slightly but keep it visible to show it's empty
                // orderPreviewBar.classList.remove('order-preview-expanded'); 
            }
        });
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('سلة طلباتك فارغة! الرجاء إضافة بعض الأصناف أولاً.');
                return;
            }
            // Simulate checkout
            let orderDetails = "تفاصيل طلبك (للتجربة):\n";
            cart.forEach(item => {
                orderDetails += `- ${item.name} (${item.size}) x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ج\n`;
            });
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            orderDetails += `\nالإجمالي: ${total.toFixed(2)} جنيه`;
            
            alert(orderDetails + "\n\nشكراً لك! هذا الطلب تجريبي فقط.");
            // Here you would typically send data to a server or redirect to a payment page.
        });
    }

    // --- LocalStorage for Cart ---
    function saveCart() {
        localStorage.setItem('restaurantMenuCart', JSON.stringify(cart));
    }

    function loadCart() {
        const savedCart = localStorage.getItem('restaurantMenuCart');
        return savedCart ? JSON.parse(savedCart) : [];
    }

    // --- Initial Cart Display & Visibility ---
    updateCartDisplayAndSave(); // Render cart from localStorage on page load
    if (cart.length > 0) {
        orderPreviewBar.classList.add('order-preview-visible'); // Show collapsed bar if cart has items
        // Don't auto-expand on page load, let user do it.
    }

    // --- Copyright Year ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});
