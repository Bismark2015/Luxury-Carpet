// ===== LUXURY CARPET CHATBOT ENGINE =====
(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    whatsappNumber: "233263405722",
    businessHours: {
      start: 8,
      end: 18,
    },
    deliveryAreas: {
      accra:      { time: "1 hour",   fee: 0,   minForFree: 1000 },
      kumasi:     { time: "Same day", fee: 50,  minForFree: 1500 },
      tema:       { time: "Same day", fee: 30,  minForFree: 1200 },
      takoradi:   { time: "Same day", fee: 60,  minForFree: 1500 },
      nationwide: { time: "2-3 days", fee: 100, minForFree: 2000 },
    },
    paymentMethods: [
      "MTN Mobile Money",
      "Vodafone Cash",
      "AirtelTigo Money",
      "Cash on Delivery",
      "Bank Transfer",
      "Card Payment",
    ],
  };

  // State
  let chatHistory = [];
  let productsData = [];
  let isTyping = false;
  let conversationContext = {
    lastIntent: null,
    mentionedCategory: null,
    selectedProducts: [],
  };

  // DOM Elements
  const chatbotBtn      = document.getElementById("luxury-carpet-chatbot-btn");
  const chatbotWindow   = document.getElementById("luxury-carpet-chatbot-window");
  const chatbotClose    = document.getElementById("luxury-carpet-chatbot-close");
  const chatbotMessages = document.getElementById("luxury-carpet-chatbot-messages");
  const chatbotInput    = document.getElementById("luxury-carpet-chatbot-input");
  const chatbotSend     = document.getElementById("luxury-carpet-chatbot-send");
  const chatbotBadge    = document.getElementById("luxury-carpet-chatbot-badge");

  // Initialize
  function init() {
    loadProducts();
    setupEventListeners();
    showWelcomeMessage();
  }

  // Load products from products.json
  async function loadProducts() {
    try {
      const response = await fetch("products.json");
      const data = await response.json();
      productsData = data.products || [];
      console.log("Chatbot loaded", productsData.length, "products");
    } catch (error) {
      console.error("Chatbot: Error loading products:", error);
      productsData = [];
    }
  }

  // Event Listeners
  function setupEventListeners() {
    chatbotBtn.addEventListener("click", toggleChatbot);
    chatbotClose.addEventListener("click", closeChatbot);
    chatbotSend.addEventListener("click", sendMessage);
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  // Toggle Chatbot
  function toggleChatbot() {
    chatbotWindow.classList.toggle("active");
    if (chatbotWindow.classList.contains("active")) {
      chatbotInput.focus();
      chatbotBadge.style.display = "none";
    }
  }

  // Close Chatbot
  function closeChatbot() {
    chatbotWindow.classList.remove("active");
  }

  // Show Welcome Message
  function showWelcomeMessage() {
    setTimeout(() => {
      addBotMessage("Akwaaba! 🎉 Welcome to Luxury Carpet Ghana!");
      setTimeout(() => {
        addBotMessage(
          "I'm here to help you find the perfect carpet for your home. How can I assist you today?"
        );
        showQuickReplies([
          "🎨 Show 3D Carpets",
          "☁️ Show Fluffy Carpets",
          "💰 Check Prices",
          "🚚 Delivery Info",
          "💳 Payment Options",
        ]);
      }, 1000);
    }, 500);
  }

  // Add Bot Message
  function addBotMessage(text, delay = 0) {
    setTimeout(() => {
      const messageDiv = document.createElement("div");
      messageDiv.className = "chatbot-message chatbot-message-bot";
      messageDiv.textContent = text;
      chatbotMessages.appendChild(messageDiv);
      scrollToBottom();
    }, delay);
  }

  // Add User Message
  function addUserMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chatbot-message chatbot-message-user";
    messageDiv.textContent = text;
    chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  // Show Typing Indicator
  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-typing";
    typingDiv.id = "chatbot-typing-indicator";
    typingDiv.innerHTML = `
      <div class="chatbot-typing-dot"></div>
      <div class="chatbot-typing-dot"></div>
      <div class="chatbot-typing-dot"></div>
    `;
    chatbotMessages.appendChild(typingDiv);
    scrollToBottom();
  }

  // Hide Typing Indicator
  function hideTyping() {
    isTyping = false;
    const typingIndicator = document.getElementById("chatbot-typing-indicator");
    if (typingIndicator) typingIndicator.remove();
  }

  // Show Quick Replies
  function showQuickReplies(replies) {
    const quickRepliesDiv = document.createElement("div");
    quickRepliesDiv.className = "chatbot-quick-replies";
    replies.forEach((reply) => {
      const button = document.createElement("button");
      button.className = "chatbot-quick-reply-btn";
      button.textContent = reply;
      button.addEventListener("click", () => handleQuickReply(reply));
      quickRepliesDiv.appendChild(button);
    });
    chatbotMessages.appendChild(quickRepliesDiv);
    scrollToBottom();
  }

  // Handle Quick Reply Click
  function handleQuickReply(reply) {
    addUserMessage(reply);
    processMessage(reply);
  }

  // Send Message
  function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;
    addUserMessage(message);
    chatbotInput.value = "";
    processMessage(message);
  }

  // Process Message
  function processMessage(message) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      const intent = detectIntent(message);
      const response = generateResponse(intent, message);
      addBotMessage(response.text);
      if (response.products)     displayProducts(response.products);
      if (response.quickReplies) showQuickReplies(response.quickReplies);
      if (response.whatsapp) {
        setTimeout(() => {
          chatbotMessages.appendChild(createWhatsAppButton(response.whatsapp));
          scrollToBottom();
        }, 500);
      }
    }, 800);
  }

  // Detect Intent
  function detectIntent(message) {
    const msg = message.toLowerCase();

    if (/^(hi|hello|hey|akwaaba|good morning|good afternoon|good evening)/i.test(msg))
      return "greeting";
    if (/3d|three.?d|dimension/i.test(msg)) {
      conversationContext.mentionedCategory = "3d";
      return "show_3d_carpets";
    }
    if (/fluffy|soft|cloud|plush/i.test(msg)) {
      conversationContext.mentionedCategory = "fluffy";
      return "show_fluffy_carpets";
    }
    if (/(price|cost|how much|affordable|cheap|expensive)/i.test(msg))   return "pricing";
    if (/(size|dimension|small|medium|large|140|160|200|230|300)/i.test(msg)) return "sizes";
    if (/(deliver|delivery|ship|shipping|arrive|fast|when|how long)/i.test(msg)) return "delivery";
    if (/(pay|payment|momo|mobile money|cash|card|bank)/i.test(msg))     return "payment";
    if (/(accra|kumasi|tema|takoradi|cape coast|location|area)/i.test(msg)) return "location";
    if (/(quality|material|durable|last|warranty|guarantee)/i.test(msg)) return "quality";
    if (/(order|buy|purchase|want|interested|get)/i.test(msg))           return "order";
    if (/(help|assist|support|question)/i.test(msg))                     return "help";

    return "general";
  }

  // Generate Response
  function generateResponse(intent) {
    const responses = {
      greeting: {
        text: "Hello! 👋 Welcome to Luxury Carpet! I'm excited to help you find the perfect carpet. What are you looking for today?",
        quickReplies: ["🎨 3D Carpets", "☁️ Fluffy Carpets", "💰 Prices", "🚚 Delivery"],
      },
      show_3d_carpets: {
        text: "🎨 Our 3D carpets are stunning! They add amazing depth and visual appeal to any room. Check out these popular options:",
        products: productsData.filter((p) => p.category === "3d").slice(0, 3),
        quickReplies: ["Show more 3D", "Fluffy carpets instead", "Price range?"],
      },
      show_fluffy_carpets: {
        text: "☁️ Our fluffy carpets are incredibly soft! Perfect for bedrooms and living rooms. Here are some favorites:",
        products: productsData.filter((p) => p.category === "fluffy").slice(0, 3),
        quickReplies: ["Show more Fluffy", "3D carpets instead", "Delivery info?"],
      },
      pricing: {
        text: "💰 Our prices are very competitive!\n\n📏 Small (140x200cm): GH₵ 320-380\n📏 Medium (160x230cm): GH₵ 380-450\n📏 Large (200x300cm): GH₵ 550-580\n\nAll carpets come with 1-year quality guarantee! 🛡️",
        quickReplies: ["Show 3D carpets", "Show Fluffy carpets", "Delivery cost?"],
      },
      sizes: {
        text: "📏 We have 3 standard sizes:\n\n✓ Small: 140x200cm (Perfect for bedrooms)\n✓ Medium: 160x230cm (Great for living rooms)\n✓ Large: 200x300cm (Spacious areas)\n\nWhich size interests you?",
        quickReplies: ["Small carpets", "Medium carpets", "Large carpets"],
      },
      delivery: {
        text: "🚚 Fast Delivery Across Ghana!\n\n✓ Accra: 1 hour (FREE over GH₵1000)\n✓ Kumasi/Tema/Takoradi: Same day\n✓ Nationwide: 2-3 days\n\nWhere should we deliver?",
        quickReplies: ["Accra", "Kumasi", "Other location", "Order now"],
      },
      payment: {
        text: "💳 We accept multiple payment methods:\n\n✓ MTN Mobile Money\n✓ Vodafone Cash\n✓ AirtelTigo Money\n✓ Cash on Delivery\n✓ Bank Transfer\n✓ Card Payment\n\nAll payments are secure! 🔒",
        quickReplies: ["Order via WhatsApp", "See products", "Ask question"],
      },
      location: {
        text: "📍 We serve all of Ghana!\n\nFastest delivery in:\n• Accra (1 hour)\n• Kumasi (Same day)\n• Tema (Same day)\n• Takoradi (Same day)\n\nNationwide delivery available in 2-3 days!",
        quickReplies: ["Delivery cost?", "See products", "Order now"],
      },
      quality: {
        text: "🛡️ Premium Quality Guaranteed!\n\n✓ 1-year quality warranty\n✓ Durable materials\n✓ Easy to clean\n✓ Fade resistant\n✓ 7-day return policy\n\nYour satisfaction is our priority!",
        quickReplies: ["Show products", "Prices?", "Order now"],
      },
      order: {
        text: "🛒 Ready to order? Great!\n\nEasiest way:\n1️⃣ Browse our carpets\n2️⃣ Pick your favorite\n3️⃣ Message us on WhatsApp\n4️⃣ We confirm & deliver!\n\nWhat type interests you?",
        quickReplies: ["3D Carpets", "Fluffy Carpets", "Chat on WhatsApp"],
        whatsapp: "Hi Luxury Carpet! I want to order a carpet. Can you help me?",
      },
      help: {
        text: "🤝 I'm here to help!\n\nI can assist with:\n✓ Product recommendations\n✓ Pricing information\n✓ Delivery details\n✓ Payment options\n✓ Order placement\n\nWhat do you need?",
        quickReplies: ["See products", "Prices", "Delivery", "Payment"],
      },
      general: {
        text: "I can help you with:\n\n✓ Finding the perfect carpet\n✓ Checking prices & sizes\n✓ Delivery information\n✓ Payment methods\n✓ Placing orders\n\nWhat would you like to know?",
        quickReplies: ["Show carpets", "Prices", "Delivery info", "Order now"],
      },
    };

    return responses[intent] || responses.general;
  }

  // Display Products
  function displayProducts(products) {
    if (!products || products.length === 0) {
      addBotMessage("Sorry, no products found matching your criteria.");
      return;
    }
    products.forEach((product, index) => {
      setTimeout(() => {
        chatbotMessages.appendChild(createProductCard(product));
        scrollToBottom();
      }, index * 300);
    });
  }

  // Create Product Card
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "chatbot-product-card";
    const whatsappMsg = `Hi Luxury Carpet! I'm interested in ${product.name} (${product.size}) - GH₵ ${product.price}`;
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="chatbot-product-image"
           onerror="this.src='assets/images/placeholder.jpg'">
      <div class="chatbot-product-info">
        <div class="chatbot-product-name">${product.name}</div>
        <div class="chatbot-product-price">GH₵ ${product.price}</div>
        <div class="chatbot-product-size">Size: ${product.size}</div>
        <div class="chatbot-product-actions">
          <button class="chatbot-product-btn chatbot-product-btn-whatsapp"
            onclick="window.open('https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}', '_blank')">
            📱 WhatsApp
          </button>
          <button class="chatbot-product-btn chatbot-product-btn-details"
            onclick="alert('Product: ${product.name}\\nPrice: GH₵ ${product.price}\\nSize: ${product.size}\\n\\n${product.description}')">
            ℹ️ Details
          </button>
        </div>
      </div>
    `;
    return card;
  }

  // Create WhatsApp Button
  function createWhatsAppButton(message) {
    const div = document.createElement("div");
    div.style.textAlign = "center";
    div.style.margin = "10px 0";
    const button = document.createElement("button");
    button.className = "chatbot-product-btn chatbot-product-btn-whatsapp";
    button.style.width = "100%";
    button.textContent = "💬 Continue on WhatsApp";
    button.onclick = () => {
      window.open(
        `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    };
    div.appendChild(button);
    return div;
  }

  // Scroll to Bottom
  function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();