const express = require('express');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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
};

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
