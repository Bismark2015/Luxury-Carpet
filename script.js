// ===== GLOBAL VARIABLES =====
let productsData = [];
let testimonialsData = [];
let cart = JSON.parse(localStorage.getItem('luxuryCarpetCart')) || [];
let currentFilter = 'all';
let currentSort = 'featured';

// Full Screen Image Viewer Variables
let currentImageIndex = 0;
let currentProductImages = [];

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
});

async function initializeApp() {
    try {
        // Load products data
        const productsResponse = await fetch('products.json');
        const productsJson = await productsResponse.json();
        productsData = productsJson.products;
        
        // Load testimonials data
        const testimonialsResponse = await fetch('testimonials.json');
        const testimonialsJson = await testimonialsResponse.json();
        testimonialsData = testimonialsJson.testimonials;
        
        // Hide loader
        hideLoader();
        
        // Load categories
        renderCategories();
        
        // Load products
        renderProducts();
        
        // Load testimonials
        renderTestimonials();
        
        // Update cart display
        updateCart();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup search
        setupSearch();
        
        // Setup FAQ
        setupFAQ();
        
        // Setup fullscreen image viewer
        setupFullscreenImageListeners();
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to inline data if files not found
        loadFallbackData();
        hideLoader();
        renderCategories();
        renderProducts();
        renderTestimonials();
        updateCart();
        setupEventListeners();
        setupSearch();
        setupFAQ();
        setupFullscreenImageListeners();
    }
}

// ===== LOADER FUNCTION =====
function hideLoader() {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
        }, 500);
    }, 1000);
}

// ===== SHOPPING CART FUNCTIONS =====
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex > -1) {
        // Increase quantity
        cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: product.size,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('luxuryCarpetCart', JSON.stringify(cart));
    
    // Update cart display
    updateCart();
    
    // Update button state
    const addButton = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
    if (addButton) {
        addButton.innerHTML = '<i class="fas fa-check"></i> Added';
        addButton.classList.add('added');
        
        // Revert button after 2 seconds
        setTimeout(() => {
            if (addButton) {
                addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                addButton.classList.remove('added');
            }
        }, 2000);
    }
    
    // Show cart sidebar
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('luxuryCarpetCart', JSON.stringify(cart));
    updateCart();
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('luxuryCarpetCart', JSON.stringify(cart));
        updateCart();
    }
}

function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const whatsappCheckout = document.getElementById('whatsappCheckout');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartItems) cartItems.style.display = 'none';
        if (cartFooter) {
            cartFooter.style.display = 'none';
            cartFooter.innerHTML = '';
        }
    } else {
        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartItems) {
            cartItems.style.display = 'flex';
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <div class="cart-item-price">GH₵ ${item.price}</div>
                        <div class="cart-item-size">Size: ${item.size}</div>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                       onchange="updateCartQuantity(${item.id}, this.value)">
                                <button class="quantity-btn increase" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal > 1000 ? 0 : 50; // Free delivery for orders over GH₵1000
        const grandTotal = subtotal + delivery;
        
        // Update cart footer with screenshot instructions
        if (cartFooter) {
            cartFooter.style.display = 'block';
            cartFooter.innerHTML = `
                <div class="cart-summary">
                    <div class="cart-total">
                        <span>Subtotal:</span>
                        <span class="cart-subtotal">GH₵ ${subtotal}</span>
                    </div>
                    <div class="cart-total">
                        <span>Delivery:</span>
                        <span class="cart-delivery">${delivery === 0 ? 'FREE' : `GH₵ ${delivery}`}</span>
                    </div>
                    <div class="cart-total grand-total">
                        <span>Total:</span>
                        <span class="cart-grand-total">GH₵ ${grandTotal}</span>
                    </div>
                </div>
                
                <!-- Screenshot Instruction -->
                <div class="screenshot-instruction">
                    <i class="fas fa-info-circle"></i>
                    <p><strong>Easy Ordering:</strong> Take a screenshot of your cart and send it to us on WhatsApp. This helps us see exactly what you want!</p>
                </div>
                
                <!-- Screenshot Helper -->
                <div class="screenshot-help">
                    <button class="btn btn-info" id="prepareScreenshot">
                        <i class="fas fa-camera"></i> Highlight Cart for Screenshot
                    </button>
                    <p class="help-text">Click to highlight all items, then take a clear screenshot</p>
                </div>
                
                <div class="cart-actions">
                    <a href="https://wa.me/233263405722" target="_blank" class="btn btn-whatsapp checkout-btn" id="whatsappCheckoutBtn">
                        <i class="fab fa-whatsapp"></i> Send Order on WhatsApp
                    </a>
                    <button class="btn btn-secondary clear-cart-btn" id="clearCartBtn">
                        <i class="fas fa-trash"></i> Clear Cart
                    </button>
                </div>
            `;
            
            // Update WhatsApp checkout link with screenshot instruction
            const cartItemsText = cart.map(item => 
                `• ${item.name} (${item.size}) x${item.quantity} - GH₵ ${item.price * item.quantity}`
            ).join('%0A');
            
            const checkoutMessage = `Hi Luxury Carpet,%0A%0AI want to order these items:%0A%0A${cartItemsText}%0A%0A**I will send you a screenshot of my cart**%0A%0ATotal Amount: GH₵ ${grandTotal}%0A%0APlease send me payment details and delivery options.`;
            
            const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');
            if (whatsappCheckoutBtn) {
                whatsappCheckoutBtn.href = `https://wa.me/233263405722?text=${checkoutMessage}`;
            }
            
            // Add event listener for screenshot helper button
            const screenshotBtn = document.getElementById('prepareScreenshot');
            if (screenshotBtn) {
                screenshotBtn.addEventListener('click', highlightCartForScreenshot);
            }
            
            // Add event listener for clear cart button
            const clearCartBtn = document.getElementById('clearCartBtn');
            if (clearCartBtn) {
                clearCartBtn.addEventListener('click', clearCart);
            }
        }
    }
}

// Function to highlight cart items for screenshot
function highlightCartForScreenshot() {
    const cartItems = document.querySelectorAll('.cart-item');
    
    // Remove any existing highlights
    cartItems.forEach(item => {
        item.classList.remove('highlighted');
    });
    
    // Add highlight class to all items
    setTimeout(() => {
        cartItems.forEach(item => {
            item.classList.add('highlighted');
        });
    }, 100);
    
    // Show instruction
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const instruction = isMobile 
        ? '✅ Cart items highlighted!\n\n📱 Take Screenshot:\n• Android: Volume Down + Power\n• iPhone: Side Button + Volume Up\n\nThe highlight will disappear in 10 seconds.'
        : '✅ Cart items highlighted!\n\n💻 Take Screenshot:\n• Windows: Press Print Screen key\n• Mac: Shift + Command + 4\n\nThe highlight will disappear in 10 seconds.';
    
    alert(instruction);
    
    // Remove highlight after 10 seconds
    setTimeout(() => {
        cartItems.forEach(item => {
            item.classList.remove('highlighted');
        });
    }, 10000);
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        localStorage.removeItem('luxuryCarpetCart');
        updateCart();
    }
}

function openCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.add('active');
}

function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.remove('active');
}

// ===== PRODUCT FUNCTIONS =====
function loadFallbackData() {
    // Fallback product data
    productsData = [
        {
            id: 1,
            name: "3D Center Carpet",
            price: 300,
            category: "3d",
            size: "140x200 cm",
            description: "Soft and elegant 3D design for your living room. Perfect for modern homes.",
            rating: 5,
            reviews: 128,
            stock: 15,
            colors: ["#8B4513", "#D2691E", "#F5DEB3"],
            badges: ["bestseller", "3d"],
            image: "assets/images/3d/3d1.1.jpg"
        },
        {
            id: 2,
            name: "Fluffy Cloud Carpet",
            price: 450,
            category: "fluffy",
            size: "200x300 cm",
            description: "Ultra-soft fluffy carpet that feels like walking on clouds. Perfect for bedrooms.",
            rating: 4.5,
            reviews: 89,
            stock: 8,
            colors: ["#FFFFFF", "#F5F5F5", "#E8E8E8"],
            badges: ["new", "fluffy"],
            image: "assets/images/fluffy/fluffy1.jpg"
        },
        {
            id: 3,
            name: "3D Wave Carpet",
            price: 380,
            category: "3d",
            size: "230x160 cm",
            description: "Modern wave design that adds depth and style to any room. Water-resistant material.",
            rating: 4.8,
            reviews: 156,
            stock: 12,
            colors: ["#2C3E50", "#34495E", "#5D6D7E"],
            badges: ["bestseller", "3d"],
            image: "assets/images/3d/3d2.jpg"
        }
    ];
    
    // Fallback testimonial data
    testimonialsData = [
        {
            id: 1,
            name: "Akua Mensah",
            location: "East Legon, Accra",
            rating: 5,
            text: "Best carpet shop in Accra! The quality is amazing and the customer service is excellent. Highly recommend!",
            product: "3D Center Carpet",
            date: "2024-01-15",
            avatar: "AM"
        }
    ];
}

function renderTestimonials() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    
    if (!testimonialsGrid || testimonialsData.length === 0) return;
    
    testimonialsGrid.innerHTML = testimonialsData.map(testimonial => `
        <div class="testimonial-card">
            ${testimonial.verified ? `
                <div class="testimonial-verified">
                    <i class="fas fa-check-circle"></i> Verified Purchase
                </div>
            ` : ''}
            
            <div class="testimonial-stars">
                ${'<i class="fas fa-star"></i>'.repeat(testimonial.rating)}
                ${'<i class="far fa-star"></i>'.repeat(5 - testimonial.rating)}
            </div>
            
            <p class="testimonial-text">"${testimonial.text}"</p>
            
            <div class="testimonial-author">
                <div class="author-avatar">${testimonial.avatar}</div>
                <div class="author-info">
                    <h4>${testimonial.name}</h4>
                    <p class="author-location">
                        <i class="fas fa-map-marker-alt"></i> ${testimonial.location}
                    </p>
                    ${testimonial.product ? `
                        <p class="author-product">
                            <i class="fas fa-carpet"></i> ${testimonial.product}
                        </p>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Categories for filtering
const categories = [
    { id: 'all', name: 'All Products', icon: 'fas fa-th' },
    { id: '3d', name: '3D Carpets', icon: 'fas fa-cube' },
    { id: 'fluffy', name: 'Fluffy Carpets', icon: 'fas fa-cloud' },
    { id: 'bestseller', name: 'Best Sellers', icon: 'fas fa-star' },
    { id: 'new', name: 'New Arrivals', icon: 'fas fa-fire' },
    { id: 'small', name: 'Small (140x200)', icon: 'fas fa-ruler' },
    { id: 'medium', name: 'Medium (230x160)', icon: 'fas fa-ruler-combined' },
    { id: 'large', name: 'Large (200x300)', icon: 'fas fa-expand' }
];

function renderCategories() {
    const filterButtons = document.getElementById('filterButtons');
    if (!filterButtons) return;
    
    filterButtons.innerHTML = categories.map(category => `
        <button class="filter-btn ${category.id === 'all' ? 'active' : ''}" 
                data-category="${category.id}">
            <i class="${category.icon}"></i> ${category.name}
        </button>
    `).join('');
    
    // Add click events to filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Filter products
            currentFilter = this.dataset.category;
            renderProducts();
        });
    });
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const productsEmpty = document.getElementById('productsEmpty');
    
    if (!productsGrid || !productsEmpty || productsData.length === 0) return;
    
    // Filter products
    let filteredProducts = [...productsData];
    
    if (currentFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
            if (currentFilter === 'bestseller') {
                return product.badges.includes('bestseller');
            } else if (currentFilter === 'new') {
                return product.badges.includes('new');
            } else if (currentFilter === 'small') {
                return product.size.includes('140x200');
            } else if (currentFilter === 'medium') {
                return product.size.includes('230x160');
            } else if (currentFilter === 'large') {
                return product.size.includes('200x300');
            } else {
                return product.category === currentFilter || 
                       product.badges.includes(currentFilter);
            }
        });
    }
    
    // Sort products
    filteredProducts = sortProducts(filteredProducts, currentSort);
    
    // Update products count
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = filteredProducts.length;
    }
    
    // Render products or show empty state
    if (filteredProducts.length === 0) {
        productsGrid.style.display = 'none';
        productsEmpty.style.display = 'block';
    } else {
        productsGrid.style.display = 'grid';
        productsEmpty.style.display = 'none';
        
        productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
        
        // Add event listeners to add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId);
                addToCart(productId);
            });
        });
        
        // Add event listeners to quick view buttons
        document.querySelectorAll('.quick-view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId);
                openQuickView(productId);
            });
        });
        
        // Add event listeners for fullscreen image viewing
        document.querySelectorAll('.product-image').forEach(img => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                const productCard = this.closest('.product-card');
                if (productCard) {
                    const productId = parseInt(productCard.dataset.productId);
                    openFullscreenImage(productId, this.src);
                }
            });
        });
    }
}

function createProductCard(product) {
    const stars = '⭐'.repeat(Math.floor(product.rating)) + 
                  (product.rating % 1 >= 0.5 ? '½' : '');
    
    const badgesHTML = product.badges.map(badge => {
        const badgeText = badge === '3d' ? '3D' : 
                         badge === 'fluffy' ? 'FLUFFY' :
                         badge.charAt(0).toUpperCase() + badge.slice(1);
        const badgeClass = `badge-${badge}`;
        return `<span class="product-badge ${badgeClass}">${badgeText}</span>`;
    }).join('');
    
    const colorsHTML = product.colors.map(color => 
        `<span class="color-dot" style="background: ${color}" title="${color}"></span>`
    ).join('');
    
    const whatsappMessage = `Hi Luxury Carpet, I'm interested in the ${product.name} (${product.size}) - GH₵ ${product.price}`;
    const whatsappURL = `https://wa.me/233263405722?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Check if product is already in cart
    const cartItem = cart.find(item => item.id === product.id);
    const cartButtonText = cartItem ? `<i class="fas fa-check"></i> Added` : `<i class="fas fa-cart-plus"></i> Add to Cart`;
    const cartButtonClass = cartItem ? 'add-to-cart-btn added' : 'add-to-cart-btn';
    
    return `
        <div class="product-card" data-product-id="${product.id}" data-category="${product.category} ${product.badges.join(' ')}">
            ${badgesHTML}
            <img src="${product.image}" alt="${product.name}" class="product-image" 
                 style="cursor: pointer;" 
                 onerror="this.src='assets/images/placeholder.jpg'">
            <div class="product-info">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${product.category.toUpperCase()}</span>
                </div>
                <div class="product-size">Size: ${product.size}</div>
                <div class="product-price">GH₵ ${product.price}</div>
                <div class="product-meta">
                    <div class="product-rating">
                        ${stars} (${product.reviews})
                    </div>
                    <div class="product-stock">
                        ${product.stock > 5 ? '✓ In Stock' : '⚠️ Low Stock'}
                    </div>
                </div>
                <div class="product-colors">
                    ${colorsHTML}
                </div>
                <p class="product-description">${product.description}</p>
                <div class="product-actions">
                    <button class="${cartButtonClass}" data-product-id="${product.id}">
                        ${cartButtonText}
                    </button>
                    <a href="${whatsappURL}" target="_blank" class="whatsapp-btn">
                        <i class="fab fa-whatsapp"></i> Buy Now
                    </a>
                </div>
            </div>
        </div>
    `;
}

function sortProducts(products, sortType) {
    switch(sortType) {
        case 'price-low':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-high':
            return [...products].sort((a, b) => b.price - a.price);
        case 'popular':
            return [...products].sort((a, b) => b.reviews - a.reviews);
        default:
            return products;
    }
}

function openQuickView(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const modalBody = document.getElementById('modalBody');
    const whatsappMessage = `Hi Luxury Carpet, I'm interested in the ${product.name} (${product.size}) - GH₵ ${product.price}`;
    const whatsappURL = `https://wa.me/233263405722?text=${encodeURIComponent(whatsappMessage)}`;
    
    const colorsHTML = product.colors.map(color => 
        `<span class="color-dot" style="background: ${color}; width: 30px; height: 30px;" title="${color}"></span>`
    ).join('');
    
    const badgesHTML = product.badges.map(badge => {
        const badgeText = badge === '3d' ? '3D Carpet' : 
                         badge === 'fluffy' ? 'Fluffy Carpet' :
                         badge.charAt(0).toUpperCase() + badge.slice(1) + ' Product';
        return `<span class="product-badge badge-${badge}">${badgeText}</span>`;
    }).join('');
    
    // Check if product is in cart
    const cartItem = cart.find(item => item.id === product.id);
    const cartButtonText = cartItem ? `<i class="fas fa-check"></i> Added to Cart` : `<i class="fas fa-cart-plus"></i> Add to Cart`;
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>${product.name}</h2>
        </div>
        <img src="${product.image}" alt="${product.name}" 
             style="width:100%; height:300px; object-fit:cover; border-radius:12px; margin-bottom:20px; cursor: pointer;" 
             onclick="openFullscreenImage(${product.id}, '${product.image}')"
             onerror="this.src='assets/images/placeholder.jpg'">
        <div class="modal-price" style="font-size:2rem; color:#C19A6B; font-weight:700; margin-bottom:20px;">
            GH₵ ${product.price}
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:30px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-ruler-combined" style="color:#C19A6B;"></i>
                <div>
                    <strong>Size:</strong>
                    <p style="margin:5px 0 0; color:#666;">${product.size}</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-star" style="color:#C19A6B;"></i>
                <div>
                    <strong>Rating:</strong>
                    <p style="margin:5px 0 0; color:#666;">${product.rating}/5 (${product.reviews} reviews)</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-box" style="color:#C19A6B;"></i>
                <div>
                    <strong>Stock:</strong>
                    <p style="margin:5px 0 0; color:#666;">${product.stock} units available</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fas fa-palette" style="color:#C19A6B;"></i>
                <div>
                    <strong>Colors:</strong>
                    <div style="display:flex; gap:5px; margin-top:5px;">${colorsHTML}</div>
                </div>
            </div>
        </div>
        
        <div style="display:flex; gap:10px; margin-bottom:20px;">
            ${badgesHTML}
        </div>
        
        <p style="margin-bottom:30px; line-height:1.8; color:#555;">${product.description}</p>
        
        <div style="display:flex; gap:15px;">
            <button class="btn btn-primary add-to-cart-btn-modal" data-product-id="${product.id}" style="flex:1;">
                ${cartButtonText}
            </button>
            <a href="${whatsappURL}" target="_blank" class="btn btn-whatsapp" style="flex:1; text-align:center;">
                <i class="fab fa-whatsapp"></i> Buy Now
            </a>
        </div>
    `;
    
    // Show modal
    const modal = document.getElementById('quickViewModal');
    modal.style.display = 'flex';
    
    // Add event listener to add to cart button in modal
    const modalAddButton = modalBody.querySelector('.add-to-cart-btn-modal');
    if (modalAddButton) {
        modalAddButton.addEventListener('click', function() {
            addToCart(product.id);
            this.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
            this.classList.add('added');
        });
    }
}

function closeModal() {
    const modal = document.getElementById('quickViewModal');
    if (modal) modal.style.display = 'none';
}

// ===== FULL SCREEN IMAGE VIEWER FUNCTIONS =====
function openFullscreenImage(productId, clickedImage) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('fullscreenModal');
    const image = document.getElementById('fullscreenImage');
    const productName = document.getElementById('fullscreenProductName');
    const productPrice = document.getElementById('fullscreenProductPrice');
    
    // Get all images for this product
    currentProductImages = [product.image];
    currentImageIndex = 0;
    
    // Set image source
    image.src = clickedImage || product.image;
    image.alt = product.name;
    image.classList.remove('zoomed');
    
    // Set product info
    productName.textContent = product.name;
    productPrice.textContent = `GH₵ ${product.price}`;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add loading state
    image.classList.add('loading');
    image.onload = function() {
        image.classList.remove('loading');
    };
    
    // Preload images
    preloadImages(currentProductImages);
}

function closeFullscreenImage() {
    const modal = document.getElementById('fullscreenModal');
    const image = document.getElementById('fullscreenImage');
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    image.classList.remove('zoomed');
}

function nextImage() {
    if (currentProductImages.length <= 1) return;
    
    currentImageIndex = (currentImageIndex + 1) % currentProductImages.length;
    updateFullscreenImage();
}

function prevImage() {
    if (currentProductImages.length <= 1) return;
    
    currentImageIndex = (currentImageIndex - 1 + currentProductImages.length) % currentProductImages.length;
    updateFullscreenImage();
}

function updateFullscreenImage() {
    const image = document.getElementById('fullscreenImage');
    
    if (currentProductImages[currentImageIndex]) {
        image.classList.add('loading');
        image.src = currentProductImages[currentImageIndex];
        image.onload = function() {
            image.classList.remove('loading');
        };
    }
    
    image.classList.remove('zoomed');
}

function preloadImages(imageUrls) {
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

function toggleZoom() {
    const image = document.getElementById('fullscreenImage');
    image.classList.toggle('zoomed');
}

function downloadImage() {
    const image = document.getElementById('fullscreenImage');
    const productName = document.getElementById('fullscreenProductName').textContent;
    
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `${productName.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setupFullscreenImageListeners() {
    const modal = document.getElementById('fullscreenModal');
    const closeBtn = document.getElementById('fullscreenClose');
    const prevBtn = document.getElementById('fullscreenPrev');
    const nextBtn = document.getElementById('fullscreenNext');
    const downloadBtn = document.getElementById('fullscreenDownload');
    const fullscreenImage = document.getElementById('fullscreenImage');
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreenImage);
    }
    
    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', prevImage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextImage);
    }
    
    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    // Click outside to close
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeFullscreenImage();
            }
        });
    }
    
    // Zoom on image click
    if (fullscreenImage) {
        fullscreenImage.addEventListener('click', toggleZoom);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!modal || !modal.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeFullscreenImage();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case ' ':
                e.preventDefault();
                toggleZoom();
                break;
            case 'd':
            case 'D':
                if (e.ctrlKey) downloadImage();
                break;
        }
    });
    
    // Add click events to all product images (delegation)
    document.addEventListener('click', function(e) {
        const productImage = e.target.closest('.product-image');
        if (productImage) {
            const productCard = productImage.closest('.product-card');
            if (productCard) {
                const productId = parseInt(productCard.dataset.productId);
                openFullscreenImage(productId, productImage.src);
            }
        }
    });
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            renderProducts();
        });
    }
    
    // Modal close button
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const quickViewModal = document.getElementById('quickViewModal');
    if (quickViewModal) {
        quickViewModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.innerHTML = navMenu.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) navMenu.classList.remove('active');
            if (menuToggle) menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Cart functionality
    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    
    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    
    // Close cart when clicking outside (for mobile overlay)
    document.addEventListener('click', function(event) {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartToggle = document.getElementById('cartToggle');
        
        if (cartSidebar && cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(event.target) && 
            cartToggle && !cartToggle.contains(event.target)) {
            closeCart();
        }
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.pageYOffset > 50) {
                header.style.padding = '0';
                header.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            } else {
                header.style.padding = '';
                header.style.boxShadow = '';
            }
        }
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        document.querySelectorAll('.product-card').forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const description = card.querySelector('.product-description').textContent.toLowerCase();
            const category = card.querySelector('.product-category').textContent.toLowerCase();
            
            if (searchTerm === '' || 
                title.includes(searchTerm) || 
                description.includes(searchTerm) ||
                category.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update products count
        const productsCount = document.getElementById('productsCount');
        const visibleProducts = document.querySelectorAll('.product-card[style="display: block"]').length;
        
        if (productsCount) {
            productsCount.textContent = visibleProducts;
        }
        
        // Show empty state if no products
        const productsEmpty = document.getElementById('productsEmpty');
        if (productsEmpty) {
            if (visibleProducts === 0 && searchTerm !== '') {
                productsEmpty.style.display = 'block';
                productsEmpty.querySelector('h3').textContent = 'No matching carpets found';
                productsEmpty.querySelector('p').textContent = 'Try a different search term';
            } else if (searchTerm === '') {
                productsEmpty.style.display = 'none';
            }
        }
    });
}

function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked FAQ if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

function resetFilters() {
    // Reset all filters
    currentFilter = 'all';
    currentSort = 'featured';
    
    // Update UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    // Re-render products
    renderProducts();
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // ESC to close modal and cart
    if (e.key === 'Escape') {
        closeModal();
        closeFullscreenImage();
        closeCart();
    }
    
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
});

// Add CSS for cart and other styles
const style = document.createElement('style');
style.textContent = `
    .author-product {
        font-size: 0.875rem;
        color: var(--primary-color);
        margin-top: 0.25rem;
        font-style: italic;
    }
    
    /* Cart Styles */
    .cart-toggle {
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        background: var(--primary-color);
        color: var(--white);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-shadow: var(--shadow-lg);
        transition: all var(--transition-normal);
        z-index: 999;
    }
    
    .cart-toggle:hover {
        background: var(--primary-dark);
        transform: scale(1.1);
    }
    
    .cart-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--accent-color);
        color: var(--white);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .cart-sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: var(--white);
        box-shadow: -5px 0 20px rgba(0,0,0,0.1);
        z-index: 1000;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
    }
    
    .cart-sidebar.active {
        right: 0;
    }
    
    .cart-header {
        padding: 1.25rem;
        border-bottom: 1px solid var(--light-gray);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .cart-header h3 {
        color: var(--secondary-color);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }
    
    .cart-close {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: var(--gray-color);
        cursor: pointer;
        transition: color var(--transition-fast);
    }
    
    .cart-close:hover {
        color: var(--accent-color);
    }
    
    .cart-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.25rem;
    }
    
    .cart-empty {
        text-align: center;
        padding: 2.5rem 1.25rem;
        color: var(--gray-color);
    }
    
    .cart-empty i {
        font-size: 3rem;
        margin-bottom: 0.9375rem;
        opacity: 0.3;
    }
    
    .cart-items {
        display: none;
        flex-direction: column;
        gap: 0.9375rem;
    }
    
    .cart-item {
        display: flex;
        gap: 0.9375rem;
        padding: 0.9375rem;
        background: var(--light-color);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--light-gray);
        transition: all 0.3s ease;
    }
    
    .cart-item-image {
        width: 80px;
        height: 80px;
        border-radius: var(--border-radius-sm);
        object-fit: cover;
    }
    
    .cart-item-details {
        flex: 1;
    }
    
    .cart-item-title {
        font-weight: 600;
        color: var(--secondary-color);
        margin-bottom: 0.3125rem;
        font-size: 0.95rem;
    }
    
    .cart-item-price {
        color: var(--primary-color);
        font-weight: 700;
        margin-bottom: 0.625rem;
    }
    
    .cart-item-size {
        font-size: 0.875rem;
        color: var(--gray-color);
        margin-bottom: 0.625rem;
    }
    
    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }
    
    .quantity-control {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
    }
    
    .quantity-btn {
        width: 25px;
        height: 25px;
        border: 1px solid var(--light-gray);
        background: var(--white);
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background var(--transition-fast);
    }
    
    .quantity-btn:hover {
        background: var(--light-gray);
    }
    
    .quantity-input {
        width: 40px;
        text-align: center;
        border: 1px solid var(--light-gray);
        border-radius: var(--border-radius-sm);
        padding: 0.125rem;
    }
    
    .remove-item {
        background: none;
        border: none;
        color: var(--accent-color);
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        transition: color var(--transition-fast);
    }
    
    .remove-item:hover {
        color: #c0392b;
    }
    
    .cart-footer {
        padding: 1.25rem;
        border-top: 1px solid var(--light-gray);
        background: var(--light-color);
    }
    
    .cart-summary {
        margin-bottom: 1.25rem;
    }
    
    .cart-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.625rem;
        padding-bottom: 0.625rem;
        border-bottom: 1px dashed var(--light-gray);
    }
    
    .cart-total:last-child {
        border-bottom: none;
    }
    
    .grand-total {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--secondary-color);
        margin-top: 0.625rem;
    }
    
    .cart-actions {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }
    
    .add-to-cart-btn.added {
        background: var(--success-color);
    }
    
    /* Screenshot Instructions */
    .screenshot-instruction {
        background: rgba(193, 154, 107, 0.1);
        border-left: 4px solid var(--primary-color);
        padding: 12px 16px;
        border-radius: var(--border-radius-md);
        margin-bottom: 20px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    
    .screenshot-instruction i {
        color: var(--primary-color);
        font-size: 1.2rem;
        margin-top: 2px;
    }
    
    .screenshot-instruction p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--secondary-color);
        line-height: 1.5;
    }
    
    .screenshot-instruction strong {
        color: var(--primary-dark);
    }
    
    /* Screenshot Helper */
    .screenshot-help {
        text-align: center;
        margin-bottom: 15px;
        padding: 15px;
        background: rgba(52, 152, 219, 0.05);
        border-radius: var(--border-radius-md);
        border: 1px dashed var(--info-color);
    }
    
    .screenshot-help .btn-info {
        background: var(--info-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: var(--border-radius-md);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all var(--transition-normal);
        margin-bottom: 8px;
    }
    
    .screenshot-help .btn-info:hover {
        background: #2980b9;
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    
    .screenshot-help .help-text {
        font-size: 0.8rem;
        color: var(--gray-color);
        margin: 0;
        line-height: 1.4;
    }
    
    /* Highlight effect for screenshot */
    .cart-item.highlighted {
        border: 3px solid var(--primary-color) !important;
        box-shadow: 0 0 20px rgba(193, 154, 107, 0.5) !important;
        transform: scale(1.02);
        transition: all 0.3s ease;
    }
    
    @media (max-width: 576px) {
        .cart-sidebar {
            width: 100%;
            right: -100%;
        }
        
        .cart-toggle {
            bottom: 1rem;
            left: 1rem;
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
        }
        
        .product-actions {
            grid-template-columns: 1fr;
        }
        
        .screenshot-instruction {
            padding: 10px 12px;
        }
        
        .screenshot-help {
            padding: 12px;
        }
    }
`;
document.head.appendChild(style);