const cors = require('cors');
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { registerProductRoutes } = require('./controllers/productController');
const { createOpenApiDocument } = require('./swagger/openApiDocument');

const app = express();
const port = process.env.PORT || 3000;
const openApiDocument = createOpenApiDocument(port);

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

registerProductRoutes(app);

app.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
  });
}

module.exports = app;
