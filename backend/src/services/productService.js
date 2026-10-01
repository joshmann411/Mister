const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '..', '..', 'datastore', 'products.json');
const allowedSortFields = new Set(['title', 'category', 'brand', 'price', 'rating', 'stock']);

function getProducts() {
  return JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeListOptions(query) {
  const page = parsePositiveInteger(query.page, 1);
  const pageSize = Math.min(parsePositiveInteger(query.pageSize, 12), 50);
  const search = String(query.search || '').trim().toLowerCase();
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'title';
  const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
  };
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

function sortProducts(products, sortBy, sortOrder) {
  const direction = sortOrder === 'desc' ? -1 : 1;

  return [...products].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue).localeCompare(String(rightValue)) * direction;
  });
}

function listProducts(options) {
  const filteredProducts = getProducts().filter((product) => {
    if (!options.search) {
      return true;
    }

    return productMatchesSearch(product, options.search);
  });

  const sortedProducts = sortProducts(filteredProducts, options.sortBy, options.sortOrder);
  const totalItems = sortedProducts.length;
  const totalPages = Math.max(Math.ceil(totalItems / options.pageSize), 1);
  const start = (options.page - 1) * options.pageSize;
  const items = sortedProducts.slice(start, start + options.pageSize);

  return {
    items,
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      totalItems,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
    },
    sort: {
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    },
    search: options.search,
  };
}

function getProductById(productId) {
  return getProducts().find((product) => product.id === productId);
}

function getProductSuggestions(search) {
  if (search.length < 3) {
    return [];
  }

  return getProducts()
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
}

module.exports = {
  getProductById,
  getProductSuggestions,
  listProducts,
  normalizeListOptions,
};
