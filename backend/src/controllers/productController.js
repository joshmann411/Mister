const {
  getProductById,
  getProductSuggestions,
  listProducts,
  normalizeListOptions,
} = require('../services/productService');

function registerProductRoutes(app) {
  app.get('/api/products', (req, res) => {
    const options = normalizeListOptions(req.query);
    res.json(listProducts(options));
  });

  app.get('/api/products/suggestions', (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    res.json({
      items: getProductSuggestions(search),
      search,
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const productId = Number.parseInt(req.params.id, 10);
    const product = getProductById(productId);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  });
}

module.exports = {
  registerProductRoutes,
};
