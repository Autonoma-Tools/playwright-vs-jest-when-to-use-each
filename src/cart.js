/**
 * Cart module — pure business logic with no framework dependencies.
 * Jest tests exercise this directly; the Express app (server.js) wraps it for the browser.
 */

const DISCOUNT_CODES = {
  SAVE10: { type: "percent", value: 10 },
  FLAT5: { type: "flat", value: 5 },
};

function createCart() {
  const items = [];

  function addItem(product) {
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += product.quantity ?? 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity ?? 1,
      });
    }
  }

  function removeItem(productId) {
    const index = items.findIndex((i) => i.id === productId);
    if (index === -1) {
      throw new Error(`Item ${productId} not in cart`);
    }
    items.splice(index, 1);
  }

  function getItems() {
    return items.slice();
  }

  function subtotal() {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function applyDiscount(code) {
    const discount = DISCOUNT_CODES[code.toUpperCase()];
    if (!discount) {
      throw new Error(`Invalid discount code: ${code}`);
    }
    const sub = subtotal();
    if (discount.type === "percent") {
      return Math.round((sub - sub * (discount.value / 100)) * 100) / 100;
    }
    return Math.max(0, Math.round((sub - discount.value) * 100) / 100);
  }

  function clear() {
    items.length = 0;
  }

  return { addItem, removeItem, getItems, subtotal, applyDiscount, clear };
}

module.exports = { createCart, DISCOUNT_CODES };
