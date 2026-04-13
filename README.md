# Playwright vs Jest: The 70/20/10 Rule That Settles It

Companion code for the Autonoma blog post 'Playwright vs Jest: The 70/20/10 Rule That Settles It'. This repo contains a minimal cart application tested at three layers: Jest unit tests, Jest+MSW integration tests, and Playwright E2E tests. It demonstrates that Jest and Playwright are complementary tools at different layers of the testing pyramid, not alternatives.

> Companion code for the Autonoma blog post: **[Playwright vs Jest: The 70/20/10 Rule That Settles It](https://getautonoma.com/blog/playwright-vs-jest-when-to-use-each)**

## Requirements

Node 18+ and npm. The Jest suite runs standalone with no backend (MSW intercepts API calls). The Playwright suite requires the cart app running locally (`npm run dev`).

## Quickstart

```bash
git clone https://github.com/Autonoma-Tools/playwright-vs-jest-when-to-use-each.git
cd playwright-vs-jest-when-to-use-each
npm install
npm test              # Jest unit + integration suite (no backend needed)
npm run dev           # Start the cart app on localhost:3000
npx playwright install
npm run test:e2e      # Playwright E2E suite
```

## Project structure

```
.
├── README.md
├── LICENSE
├── package.json
├── src/
│   ├── cart.js          # Cart business logic (pure functions, no I/O)
│   ├── api.js           # API client (fetch products, submit orders)
│   └── server.js        # Express app serving the shop UI + JSON API
├── jest/
│   └── cart.test.js     # Jest unit + MSW integration tests
├── playwright/
│   ├── checkout.spec.js # Playwright E2E checkout flow
│   └── playwright.config.js
└── examples/
    ├── run-jest-tests.sh
    └── run-playwright-tests.sh
```

- `src/` — primary source files for the snippets referenced in the blog post.
- `examples/` — runnable examples you can execute as-is.
- `docs/` — extended notes, diagrams, or supporting material (when present).

## About

This repository is maintained by [Autonoma](https://getautonoma.com) as reference material for the linked blog post. Autonoma builds autonomous AI agents that plan, execute, and maintain end-to-end tests directly from your codebase.

If something here is wrong, out of date, or unclear, please [open an issue](https://github.com/Autonoma-Tools/playwright-vs-jest-when-to-use-each/issues/new).

## License

Released under the [MIT License](./LICENSE) © 2026 Autonoma Labs.
