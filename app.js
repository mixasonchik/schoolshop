const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const ADMIN_CHAT_ID = "PUT_YOUR_TELEGRAM_ID_HERE"; // потом заменишь на свой id
const USER_BALANCE = 1000; // временно, потом будет храниться на сервере

const products = [
  {
    id: "dubai-frenchkiss",
    name: "Дубайский Шоколад (Frenchkiss)",
    price: 699,
    oldPrice: 899,
    rating: 324,
    badge: "🔥 Хит",
    image: "https://dummyimage.com/500x500/e8d4c6/8b3a3a&text=Frenchkiss+Dubai"
  },
  {
    id: "buckwheat-milk",
    name: "Гречишный молочный шоколад (Фабрика Природы)",
    price: 269,
    oldPrice: 354,
    rating: 165,
    badge: "💵 Скидка",
    image: "https://dummyimage.com/500x500/d07a25/ffffff&text=Молочный+шоколад"
  },
  {
    id: "buckwheat-dark",
    name: "Гречишный горький шоколад (Фабрика Природы)",
    price: 269,
    oldPrice: 354,
    rating: 165,
    badge: "💵 Скидка",
    image: "https://dummyimage.com/500x500/4b2b1e/ffffff&text=Горький+шоколад"
  }
];

let cart = JSON.parse(localStorage.getItem("cart") || "{}");
let currentTab = "home";

const screen = document.getElementById("screen");
const cartCount = document.getElementById("cartCount");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  cartCount.textContent = count;
  cartCount.style.display = count ? "block" : "none";
}

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
  if (tab === "home") renderHome();
  if (tab === "cart") renderCart();
  if (tab === "schedule") renderPlaceholder("Расписание", "Тут позже можно добавить время выдачи: например после 2, 4 и 6 урока.");
  if (tab === "orders") renderPlaceholder("Заказы", "Тут позже будут прошлые заказы и их статус.");
}

function renderHome() {
  screen.innerHTML = document.getElementById("homeTemplate").innerHTML;
  const container = document.getElementById("products");
  container.innerHTML = products.map(product => `
    <article class="card">
      <div class="badge">${product.badge}</div>
      <div class="image-wrap"><img class="product-img" src="${product.image}" alt="${product.name}"></div>
      <div class="info">
        <div><span class="price">${product.price} ₽</span><span class="old-price">${product.oldPrice} ₽</span></div>
        <div class="rating">⭐ ${product.rating}</div>
        <div class="name">${product.name}</div>
        <button class="add-btn" data-id="${product.id}">В корзину</button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      tg?.HapticFeedback?.impactOccurred("light");
      btn.textContent = "Добавлено";
      setTimeout(() => btn.textContent = "В корзину", 650);
    });
  });
}

function renderCart() {
  screen.innerHTML = document.getElementById("cartTemplate").innerHTML;
  const items = Object.entries(cart).map(([id, qty]) => ({ ...products.find(p => p.id === id), qty }));
  const list = document.getElementById("cartItems");
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (!items.length) {
    list.innerHTML = `<div class="empty">Корзина пустая</div>`;
  } else {
    list.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div><h3>${item.name}</h3><p>${item.price * item.qty} ₽</p></div>
        <div class="qty">
          <button data-action="minus" data-id="${item.id}">−</button>
          <b>${item.qty}</b>
          <button data-action="plus" data-id="${item.id}">+</button>
        </div>
      </div>
    `).join("");
  }

  document.getElementById("balanceText").textContent = `${USER_BALANCE} ₽`;
  document.getElementById("totalText").textContent = `${total} ₽`;
  document.getElementById("checkoutBtn").disabled = !items.length || total > USER_BALANCE;
  document.getElementById("checkoutBtn").textContent = total > USER_BALANCE ? "Не хватает баланса" : "Оформить заказ";

  list.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "plus") cart[id] = (cart[id] || 0) + 1;
      if (btn.dataset.action === "minus") {
        cart[id] -= 1;
        if (cart[id] <= 0) delete cart[id];
      }
      saveCart();
      renderCart();
    });
  });

  document.getElementById("checkoutBtn").addEventListener("click", () => checkout(items, total));
}

function checkout(items, total) {
  const order = {
    type: "new_order",
    user: tg?.initDataUnsafe?.user || null,
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    total,
    createdAt: new Date().toISOString()
  };

  // Пока без backend: покажет данные заказа. Потом это уйдет на сервер и в админ-бот.
  tg?.sendData(JSON.stringify(order));
  alert(`Заказ создан на ${total} ₽. Следующий шаг — подключим сервер и уведомления тебе в Telegram.`);
  cart = {};
  saveCart();
  setTab("home");
}

function renderPlaceholder(title, text) {
  screen.innerHTML = `<section class="page"><h1>${title}</h1><div class="placeholder">${text}</div></section>`;
}

document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));
updateCartCount();
renderHome();
