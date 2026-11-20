
/* =====================================
   PAMAC FOOT WEAR COLLECTION
   Customer Shop - Supabase Integration
===================================== */

const PAMAC_WHATSAPP = "254795766465";

let allProducts = [];
let selectedCategory = "All";
let databaseReady = false;

/* HTML SECURITY */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* DISPLAY DATABASE ERRORS */

function showDatabaseError(error) {
  console.error("PAMAC DATABASE ERROR:", error);

  const container = document.getElementById("products");
  const count = document.getElementById("count");

  if (count) count.textContent = "Connection problem";

  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load PAMAC products</h3>
        <p style="color:#d62828">
          ${escapeHTML(error.message || "Unknown database error")}
        </p>
        <button onclick="loadProducts()" class="order-btn">
          Try Again
        </button>
      </div>
    `;
  }
}

/* LOAD PRODUCTS FROM SUPABASE */

async function loadProducts() {

  const container = document.getElementById("products");
  const count = document.getElementById("count");

  if (!container) {
    console.error("PAMAC: Products container not found.");
    return;
  }

  container.innerHTML = `
    <div class="shop-loading">
      Loading PAMAC shoe collection...
    </div>
  `;

  if (count) count.textContent = "Connecting to database...";

  if (typeof supabaseClient === "undefined") {
    showDatabaseError({
      message: "Supabase client not found. Check js/config.js and the script order in shop.html."
    });
    return;
  }

  try {

    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showDatabaseError(error);
      return;
    }

    allProducts = data || [];
    databaseReady = true;

    console.log("PAMAC products loaded:", allProducts);

    renderProducts();

  } catch (error) {

    databaseReady = false;
    showDatabaseError(error);

  }
}

/* CATEGORY FILTER */

function filterCategory(category, button) {

  selectedCategory = category;

  document.querySelectorAll(".category").forEach(item => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  renderProducts();
}

/* SEARCH AND DISPLAY PRODUCTS */

function renderProducts() {

  const container = document.getElementById("products");
  const count = document.getElementById("count");

  if (!container) return;

  if (!databaseReady) return;

  const searchElement = document.getElementById("search");

  const search = searchElement
    ? searchElement.value.toLowerCase().trim()
    : "";

  const filteredProducts = allProducts.filter(product => {

    const name = String(product.name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();

    const matchesSearch =
      name.includes(search) || category.includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;

  });

  if (count) {
    count.textContent =
      `${filteredProducts.length} products found`;
  }

  if (filteredProducts.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <h3>No shoes found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = filteredProducts.map(product => {

    const soldOut = Number(product.qty) <= 0;

    const image = product.image_url
      ? `
        <img
          src="${escapeHTML(product.image_url)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      `
      : `<span>👟</span>`;

    const sizes = Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "";

    return `
      <article class="product-card">

        <div class="product-image">
          ${image}
        </div>

        <div class="product-info">

          <span class="product-category">
            ${escapeHTML(product.category)}
          </span>

          <h3>${escapeHTML(product.name)}</h3>

          <div class="product-price">
            KSh ${Number(product.price).toLocaleString("en-KE")}
          </div>

          <p>
            <strong>Available sizes:</strong>
            ${escapeHTML(sizes)}
          </p>

          <p>
            <strong>Stock:</strong>
            ${soldOut ? "Sold Out" : Number(product.qty) + " pairs"}
          </p>

          <button
            class="order-btn"
            data-order-id="${escapeHTML(product.id)}"
            ${soldOut ? "disabled" : ""}
          >
            ${soldOut ? "Sold Out" : "Order on WhatsApp"}
          </button>

        </div>

      </article>
    `;

  }).join("");

  /* WHATSAPP BUTTON EVENTS */

  container.querySelectorAll("[data-order-id]").forEach(button => {

    button.addEventListener("click", () => {

      orderProduct(button.dataset.orderId);

    });

  });

}

/* WHATSAPP ORDERING */

function orderProduct(id) {

  const product = allProducts.find(item =>
    String(item.id) === String(id)
  );

  if (!product || Number(product.qty) <= 0) return;

  const sizes = Array.isArray(product.sizes)
    ? product.sizes.join(", ")
    : "Please confirm sizes";

  const message = `
Hello PAMAC FOOT WEAR COLLECTION!

I would like to order:

Product: ${product.name}
Price: KSh ${product.price}
Available sizes: ${sizes}

Please assist me with my order.

Thank you!
  `.trim();

  const whatsappURL =
    "https://wa.me/" +
    PAMAC_WHATSAPP +
    "?text=" +
    encodeURIComponent(message);

  window.open(whatsappURL, "_blank");

}

/* NAVIGATION MENU */

function toggleMenu() {

  const navigation = document.getElementById("navigation");

  if (navigation) {
    navigation.classList.toggle("show");
  }

}

/* INITIALIZE PAMAC SHOP */

document.addEventListener("DOMContentLoaded", () => {

  console.log("PAMAC Shop initialized.");

  const search = document.getElementById("search");

  if (search) {
    search.addEventListener("input", renderProducts);
  }

  loadProducts();

});

