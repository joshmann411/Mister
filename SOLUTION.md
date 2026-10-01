# Solution

## Design

The application is split into two folders:

- `backend`: Express API, Swagger docs, local product datastore, and static product images.
- `ux`: Angular frontend that calls the backend catalog endpoints.

The backend serves products from:

```text
backend/datastore/products.json
```

Product images are stored locally and served by Express from:

```text
backend/images/products
```

The catalog API supports pagination, search, sorting, single-product lookup, and type-ahead suggestions:

```text
GET /api/products
GET /api/products/:id
GET /api/products/suggestions
```

Swagger is available at:

```text
http://localhost:3000/docs
```

## Backend Structure

`server.js` only handles app setup concerns: middleware, static files, health, Swagger, and route registration.

Product behavior is split into:

- `src/controllers/productController.js`: Express route handlers.
- `src/services/productService.js`: product loading, search, sort, pagination, and suggestions.
- `src/swagger/openApiDocument.js`: OpenAPI documentation.

## Trade-Offs

The datastore is JSON-on-disk instead of a real database. This keeps the project simple, portable, and easy to review (as requested), but it is not ideal for large data, concurrent writes, or advanced querying.

Search and sort happen in memory after reading the JSON file. That is fine for 50 products, but a real catalog would move this work to a database or search service.

Images are downloaded and served locally (logic can certainly be enhanced). This makes the app independent from the seed source at runtime, but increases repo size.

Type-ahead suggestions use a separate lightweight endpoint. This keeps the main catalog endpoint focused on paginated results while making suggestions fast and small.

The backend has a small test suite using Node's built-in test runner to avoid adding extra test dependencies.
