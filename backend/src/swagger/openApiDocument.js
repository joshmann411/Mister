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

function createOpenApiDocument(port) {
  return {
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
}

module.exports = {
  createOpenApiDocument,
};
