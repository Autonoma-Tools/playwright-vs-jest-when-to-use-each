/**
 * API client — fetches product data from the backend.
 * In tests, MSW intercepts these requests so no real server is needed.
 */

const API_BASE = process.env.API_BASE || "http://localhost:3000";

async function fetchProducts() {
  const response = await fetch(`${API_BASE}/api/products`);
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  return response.json();
}

async function submitOrder(order) {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit order: ${response.status}`);
  }
  return response.json();
}

module.exports = { fetchProducts, submitOrder, API_BASE };
