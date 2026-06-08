const db = window.sb || window.supabaseClient;

let products = [];
let importedItems = [];

function safeToast(title, message = "", type = "success") {
  if (typeof showToast === "function") {
    showToast(title, message, type);
  } else {
    console.log(title, message, type);
  }
}

function unsafeToast(title, message = "", type = "failed") {
  if (typeof showToast === "function") {
    showToast(title, message, type);
  } else {
    console.log(title, message, type);
  }
}

async function loadProducts() {

  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

async function renderSubscriptionProducts() {

  products = await loadProducts();

  importedItems = JSON.parse(
    sessionStorage.getItem("subscriptionCart") || "[]"
  );

  const selectedMap = new Map(
    importedItems.map(item => [
      item.product_id,
      item
    ])
  );

  const container =
    document.getElementById("subscription-items");

  container.innerHTML = importedItems.map(item => `
    <div class="subscription-item">
      <div class="subscription-product">
        <strong>${item.name}</strong>
      </div>

      <div>
        ${item.cartons} carton${item.cartons > 1 ? "s" : ""}
      </div>
    </div>
  `).join("");

  updateSubscriptionTotal();
}

function updateSubscriptionTotal() {

  console.log(importedItems);

  const total = importedItems.reduce((sum, item) => {

    const cartons = Number(item.cartons) || 0;
    const price = Number(item.price_per_carton) || 0;

    return sum + cartons * price;

  }, 0);

  document.getElementById(
    "subscription-total"
  ).innerHTML =
    `<h3>Total: SGD $${total.toFixed(2)}</h3>`;
}

let isSubmitting = false;

async function createSubscription() {
  try {

    if (isSubmitting) return;
    isSubmitting = true;

    if (!importedItems.length) {
      unsafeToast("Your cart is empty.");
      isSubmitting = false;
      return;
    }

    const frequency =
      document.getElementById("frequency").value;

    const user = await db.auth.getUser();

    const { data: subscription, error: subError } =
      await db
        .from("subscriptions")
        .insert({
          frequency,
          status: "active",
          user_id: user.data.user.id
        })
        .select()
        .single();

    if (subError) throw subError;

    const items = importedItems.map(item => ({
      subscription_id: subscription.id,
      product_id: item.product_id,
      cartons: item.cartons,
      price_per_carton: item.price_per_carton
    }));

    const { error: itemError } =
      await db
        .from("subscription_items")
        .insert(items);

    if (itemError) throw itemError;

    sessionStorage.removeItem("subscriptionCart");
    sessionStorage.removeItem("subscriptionInterval");
    localStorage.removeItem("espressgo_cart");

    safeToast("Subscription created successfully!");

    setTimeout(() => {
      window.location.href = "catalog.html";
    }, 800);

  } catch (err) {
    console.error(err);
    unsafeToast(`Failed to create subscription: ${err.message}`);
  } finally {
    isSubmitting = false;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await renderSubscriptionProducts();

    const savedInterval =
      sessionStorage.getItem(
        "subscriptionInterval"
      );

    const frequencySelect =
      document.getElementById("frequency");

    if (savedInterval && frequencySelect) {
      frequencySelect.value = savedInterval;
    }

    document
      .getElementById(
        "create-subscription-btn"
      )
      .addEventListener(
        "click",
        createSubscription
      );
  }
);