/**
 * Express server — serves a minimal cart UI and JSON API endpoints.
 * Start with `node src/server.js` then open http://localhost:3000.
 * The Playwright E2E suite runs against this server.
 */

const express = require("express");
const path = require("path");
const { createCart } = require("./cart");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------------ */
/*  In-memory product catalogue and orders                            */
/* ------------------------------------------------------------------ */
const PRODUCTS = [
  { id: "widget-a", name: "Widget Alpha", price: 25.0 },
  { id: "widget-b", name: "Widget Beta", price: 40.0 },
  { id: "widget-c", name: "Widget Gamma", price: 15.0 },
];

const orders = [];
let orderCounter = 1000;

/* ------------------------------------------------------------------ */
/*  JSON API                                                          */
/* ------------------------------------------------------------------ */
app.get("/api/products", (_req, res) => {
  res.json(PRODUCTS);
});

app.post("/api/orders", (req, res) => {
  const { items, shipping } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!shipping || !shipping.name || !shipping.address) {
    return res.status(400).json({ error: "Shipping info required" });
  }

  const orderId = `ORD-${++orderCounter}`;
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const order = { orderId, items, shipping, total, createdAt: new Date().toISOString() };
  orders.push(order);
  res.status(201).json(order);
});

/* ------------------------------------------------------------------ */
/*  HTML pages (inline for zero build-step simplicity)                */
/* ------------------------------------------------------------------ */
function productRow(p) {
  return `
    <tr data-product-id="${p.id}">
      <td>${p.name}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>
        <button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
          Add to Cart
        </button>
      </td>
    </tr>`;
}

function shopPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Shop</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
    th, td { padding: .5rem; border: 1px solid #ddd; text-align: left; }
    button { cursor: pointer; padding: .4rem .8rem; }
    #cart-summary { margin-top: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 4px; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <h1>Shop</h1>
  <table>
    <thead><tr><th>Product</th><th>Price</th><th></th></tr></thead>
    <tbody>${PRODUCTS.map(productRow).join("")}</tbody>
  </table>

  <div id="cart-summary" class="hidden">
    <h2>Cart</h2>
    <ul id="cart-items"></ul>
    <p><strong>Total: $<span id="cart-total">0.00</span></strong></p>
    <a href="/checkout"><button id="checkout-btn">Proceed to Checkout</button></a>
  </div>

  <script>
    const cart = [];

    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, name, price } = btn.dataset;
        const existing = cart.find(i => i.id === id);
        if (existing) { existing.quantity++; }
        else { cart.push({ id, name, price: parseFloat(price), quantity: 1 }); }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
      });
    });

    function renderCart() {
      const summary = document.getElementById('cart-summary');
      const list = document.getElementById('cart-items');
      const totalEl = document.getElementById('cart-total');
      list.innerHTML = '';
      let total = 0;
      cart.forEach(item => {
        total += item.price * item.quantity;
        const li = document.createElement('li');
        li.textContent = item.name + ' x' + item.quantity + ' — $' + (item.price * item.quantity).toFixed(2);
        list.appendChild(li);
      });
      totalEl.textContent = total.toFixed(2);
      summary.classList.toggle('hidden', cart.length === 0);
    }
  </script>
</body>
</html>`;
}

function checkoutPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Checkout</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; }
    label { display: block; margin-top: .5rem; }
    input { width: 100%; padding: .4rem; margin-top: .2rem; box-sizing: border-box; }
    button { margin-top: 1rem; padding: .5rem 1rem; cursor: pointer; }
    #error { color: red; }
  </style>
</head>
<body>
  <h1>Checkout</h1>
  <div id="cart-review"></div>
  <form id="shipping-form">
    <h2>Shipping Information</h2>
    <label>Full Name <input type="text" name="name" id="shipping-name" required /></label>
    <label>Address <input type="text" name="address" id="shipping-address" required /></label>
    <label>City <input type="text" name="city" id="shipping-city" required /></label>
    <label>ZIP Code <input type="text" name="zip" id="shipping-zip" required /></label>
    <p id="error"></p>
    <button type="submit" id="place-order-btn">Place Order</button>
  </form>

  <script>
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const review = document.getElementById('cart-review');
    if (cart.length === 0) {
      review.innerHTML = '<p>Your cart is empty. <a href="/">Go back to the shop</a>.</p>';
    } else {
      let html = '<h2>Order Summary</h2><ul>';
      let total = 0;
      cart.forEach(i => {
        total += i.price * i.quantity;
        html += '<li>' + i.name + ' x' + i.quantity + ' — $' + (i.price * i.quantity).toFixed(2) + '</li>';
      });
      html += '</ul><p><strong>Total: $' + total.toFixed(2) + '</strong></p>';
      review.innerHTML = html;
    }

    document.getElementById('shipping-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const shipping = {
        name: document.getElementById('shipping-name').value,
        address: document.getElementById('shipping-address').value,
        city: document.getElementById('shipping-city').value,
        zip: document.getElementById('shipping-zip').value,
      };
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart, shipping }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.removeItem('cart');
        window.location.href = '/confirmation?orderId=' + data.orderId;
      } catch (err) {
        document.getElementById('error').textContent = err.message;
      }
    });
  </script>
</body>
</html>`;
}

function confirmationPage(orderId) {
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Not Found</title></head>
<body><h1>Order not found</h1><a href="/">Back to shop</a></body></html>`;
  }
  let itemsHtml = "<ul>";
  order.items.forEach((i) => {
    itemsHtml += `<li>${i.name} x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}</li>`;
  });
  itemsHtml += "</ul>";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Order Confirmed</title>
<style>body{font-family:sans-serif;max-width:600px;margin:2rem auto;}</style>
</head>
<body>
  <h1>Order Confirmed!</h1>
  <p>Thank you, <strong>${order.shipping.name}</strong>.</p>
  <p>Order ID: <strong id="order-id">${order.orderId}</strong></p>
  <h2>Items</h2>
  ${itemsHtml}
  <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
  <p>Shipping to: ${order.shipping.address}, ${order.shipping.city} ${order.shipping.zip}</p>
  <a href="/">Continue Shopping</a>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Routes                                                            */
/* ------------------------------------------------------------------ */
app.get("/", (_req, res) => res.send(shopPage()));
app.get("/checkout", (_req, res) => res.send(checkoutPage()));
app.get("/confirmation", (req, res) => res.send(confirmationPage(req.query.orderId)));

/* ------------------------------------------------------------------ */
/*  Start                                                             */
/* ------------------------------------------------------------------ */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cart app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
