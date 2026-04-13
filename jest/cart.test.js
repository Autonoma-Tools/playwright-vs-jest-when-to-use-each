/**
 * Jest unit + integration tests for the cart module.
 *
 * - Unit tests exercise createCart() directly (no I/O, no network).
 * - Integration tests use MSW to intercept fetch() calls so we can
 *   verify the API client without a running backend.
 *
 * Run:  npm test
 */

const { createCart } = require("../src/cart");
const { fetchProducts, submitOrder } = require("../src/api");
const { http, HttpResponse } = require("msw");
const { setupServer } = require("msw/node");

/* ------------------------------------------------------------------ */
/*  Fixtures                                                          */
/* ------------------------------------------------------------------ */
const PRODUCTS_FIXTURE = [
  { id: "widget-a", name: "Widget Alpha", price: 25.0 },
  { id: "widget-b", name: "Widget Beta", price: 40.0 },
  { id: "widget-c", name: "Widget Gamma", price: 15.0 },
];

const ORDER_FIXTURE = {
  orderId: "ORD-1001",
  items: [{ id: "widget-a", name: "Widget Alpha", price: 25, quantity: 2 }],
  shipping: { name: "Jane Doe", address: "123 Main St", city: "Springfield", zip: "62704" },
  total: 50,
  createdAt: "2025-01-15T12:00:00.000Z",
};

/* ------------------------------------------------------------------ */
/*  MSW mock server (intercepts fetch at the Node level)              */
/* ------------------------------------------------------------------ */
const server = setupServer(
  http.get("http://localhost:3000/api/products", () => {
    return HttpResponse.json(PRODUCTS_FIXTURE);
  }),
  http.post("http://localhost:3000/api/orders", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...ORDER_FIXTURE, items: body.items, shipping: body.shipping }, { status: 201 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/* ================================================================== */
/*  UNIT TESTS — pure logic, zero I/O                                 */
/* ================================================================== */
describe("Cart — unit tests", () => {
  let cart;

  beforeEach(() => {
    cart = createCart();
  });

  test("starts empty with a $0.00 subtotal", () => {
    expect(cart.getItems()).toEqual([]);
    expect(cart.subtotal()).toBe(0);
  });

  test("adds a single item and calculates the subtotal", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.subtotal()).toBe(25);
  });

  test("increments quantity when the same item is added twice", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].quantity).toBe(2);
    expect(cart.subtotal()).toBe(50);
  });

  test("adds multiple distinct items and totals correctly", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    cart.addItem({ id: "widget-b", name: "Widget Beta", price: 40, quantity: 2 });
    expect(cart.getItems()).toHaveLength(2);
    expect(cart.subtotal()).toBe(105); // 25 + 40*2
  });

  test("removes an item from the cart", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    cart.addItem({ id: "widget-b", name: "Widget Beta", price: 40 });
    cart.removeItem("widget-a");
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].id).toBe("widget-b");
  });

  test("throws when removing an item that is not in the cart", () => {
    expect(() => cart.removeItem("nonexistent")).toThrow("Item nonexistent not in cart");
  });

  test("applies a percentage discount code (SAVE10 → 10% off)", () => {
    cart.addItem({ id: "widget-b", name: "Widget Beta", price: 40, quantity: 3 });
    expect(cart.subtotal()).toBe(120);
    expect(cart.applyDiscount("SAVE10")).toBe(108); // 120 - 12
  });

  test("applies a flat discount code (FLAT5 → $5 off)", () => {
    cart.addItem({ id: "widget-c", name: "Widget Gamma", price: 15 });
    expect(cart.applyDiscount("FLAT5")).toBe(10); // 15 - 5
  });

  test("flat discount never goes below zero", () => {
    cart.addItem({ id: "widget-c", name: "Widget Gamma", price: 3 });
    expect(cart.applyDiscount("FLAT5")).toBe(0);
  });

  test("throws on an invalid discount code", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    expect(() => cart.applyDiscount("BOGUS")).toThrow("Invalid discount code: BOGUS");
  });

  test("clear() empties the cart", () => {
    cart.addItem({ id: "widget-a", name: "Widget Alpha", price: 25 });
    cart.clear();
    expect(cart.getItems()).toEqual([]);
    expect(cart.subtotal()).toBe(0);
  });
});

/* ================================================================== */
/*  INTEGRATION TESTS — real fetch calls intercepted by MSW           */
/* ================================================================== */
describe("API client — integration tests (MSW)", () => {
  test("fetchProducts() returns the product catalogue", async () => {
    const products = await fetchProducts();
    expect(products).toHaveLength(3);
    expect(products[0]).toMatchObject({ id: "widget-a", name: "Widget Alpha" });
  });

  test("fetchProducts() throws on a server error", async () => {
    server.use(
      http.get("http://localhost:3000/api/products", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    await expect(fetchProducts()).rejects.toThrow("Failed to fetch products: 500");
  });

  test("submitOrder() posts the order and returns confirmation", async () => {
    const order = await submitOrder({
      items: [{ id: "widget-a", name: "Widget Alpha", price: 25, quantity: 2 }],
      shipping: { name: "Jane Doe", address: "123 Main St", city: "Springfield", zip: "62704" },
    });
    expect(order.orderId).toBe("ORD-1001");
    expect(order.shipping.name).toBe("Jane Doe");
  });

  test("submitOrder() throws on a 400 response", async () => {
    server.use(
      http.post("http://localhost:3000/api/orders", () => {
        return HttpResponse.json({ error: "Cart is empty" }, { status: 400 });
      })
    );
    await expect(
      submitOrder({ items: [], shipping: { name: "X", address: "Y" } })
    ).rejects.toThrow("Failed to submit order: 400");
  });
});
