const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 3000;
const productsPath = path.join(__dirname, '..', 'datastore', 'products.json');

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

function getProducts() {
  return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sortProducts(products, sortBy, sortOrder) {
  const allowedSortFields = new Set(['title', 'category', 'brand', 'price', 'rating', 'stock']);
  const field = allowedSortFields.has(sortBy) ? sortBy : 'title';
  const direction = sortOrder === 'desc' ? -1 : 1;

  return [...products].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue).localeCompare(String(rightValue)) * direction;
  });
}

function productMatchesSearch(product, search) {
  return [
    product.title,
    product.description,
    product.category,
    product.brand,
    ...(product.tags || []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(search);
}

const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    title: { type: 'string', example: 'Essence Mascara Lash Princess' },
    description: { type: 'string' },
    category: { type: 'string', example: 'beauty' },
    brand: { type: 'string', example: 'Essence' },
    price: { type: 'number', example: 9.99 },
    discountPercentage: { type: 'number', example: 10.48 },
    rating: { type: 'number', example: 4.94 },
    stock: { type: 'integer', example: 5 },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
    image: { type: 'string', example: '/images/products/product-01.webp' },
  },
};

const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Mister Backend API',
    version: '1.0.0',
    description: 'API documentation for the Mister backend.',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local development server',
    },
  ],
  paths: {
    '/api/products': {
      get: {
        summary: 'List products',
        description: 'Returns locally stored products with pagination, search, and sorting.',
        tags: ['Products'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['title', 'category', 'brand', 'price', 'rating', 'stock'],
              default: 'title',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          200: {
            description: 'A paginated product result.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                    sort: { $ref: '#/components/schemas/Sort' },
                    search: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        summary: 'Get one product',
        tags: ['Products'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'A product.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          404: {
            description: 'Product not found.',
          },
        },
      },
    },
    '/api/products/suggestions': {
      get: {
        summary: 'Suggest products',
        description: 'Returns lightweight type-ahead product suggestions for searches of at least 3 characters.',
        tags: ['Products'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 3 },
          },
        ],
        responses: {
          200: {
            description: 'A list of product suggestions.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProductSuggestion' },
                    },
                    search: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Check API health',
        tags: ['System'],
        responses: {
          200: {
            description: 'The API is running.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    uptime: {
                      type: 'number',
                      example: 12.34,
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2026-10-01T00:00:00.000Z',
                    },
                  },
                  required: ['status', 'uptime', 'timestamp'],
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Product: productSchema,
      ProductSuggestion: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Essence Mascara Lash Princess' },
          category: { type: 'string', example: 'beauty' },
          brand: { type: 'string', example: 'Essence' },
          image: { type: 'string', example: '/images/products/product-01.webp' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 12 },
          totalItems: { type: 'integer', example: 50 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
      },
      Sort: {
        type: 'object',
        properties: {
          sortBy: { type: 'string', example: 'title' },
          sortOrder: { type: 'string', example: 'asc' },
        },
      },
    },
  },
};

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/products', (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1);
  const pageSize = Math.min(parsePositiveInteger(req.query.pageSize, 12), 50);
  const search = String(req.query.search || '').trim().toLowerCase();
  const sortBy = String(req.query.sortBy || 'title');
  const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  const filteredProducts = getProducts().filter((product) => {
    if (!search) {
      return true;
    }

    return productMatchesSearch(product, search);
  });

  const sortedProducts = sortProducts(filteredProducts, sortBy, sortOrder);
  const totalItems = sortedProducts.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const start = (page - 1) * pageSize;
  const items = sortedProducts.slice(start, start + pageSize);

  res.json({
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    sort: {
      sortBy,
      sortOrder,
    },
    search,
  });
});

app.get('/api/products/suggestions', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();

  if (search.length < 3) {
    res.json({ items: [], search });
    return;
  }

  const items = getProducts()
    .filter((product) => productMatchesSearch(product, search))
    .sort((left, right) => {
      const leftTitle = left.title.toLowerCase();
      const rightTitle = right.title.toLowerCase();
      const leftStartsWith = leftTitle.startsWith(search);
      const rightStartsWith = rightTitle.startsWith(search);

      if (leftStartsWith !== rightStartsWith) {
        return leftStartsWith ? -1 : 1;
      }

      return leftTitle.localeCompare(rightTitle);
    })
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      brand: product.brand,
      image: product.image,
    }));

  res.json({ items, search });
});

app.get('/api/products/:id', (req, res) => {
  const productId = Number.parseInt(req.params.id, 10);
  const product = getProducts().find((item) => item.id === productId);

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(product);
});

app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
