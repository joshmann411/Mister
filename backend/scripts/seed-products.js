const fs = require('fs/promises');
const path = require('path');

const apiUrl = 'https://dummyjson.com/products?limit=50&skip=0';
const rootDir = path.join(__dirname, '..');
const datastoreDir = path.join(rootDir, 'datastore');
const imagesDir = path.join(rootDir, 'images', 'products');
const productsPath = path.join(datastoreDir, 'products.json');

function getExtension(url) {
  const pathname = new URL(url).pathname;
  const extension = path.extname(pathname);

  return extension || '.webp';
}

async function downloadImage(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(imagesDir, filename), buffer);
}

async function seedProducts() {
  await fs.mkdir(datastoreDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const products = [];

  for (const product of data.products) {
    const sourceImageUrl = product.thumbnail || product.images?.[0];
    const imageFilename = `product-${String(product.id).padStart(2, '0')}${getExtension(sourceImageUrl)}`;

    await downloadImage(sourceImageUrl, imageFilename);

    products.push({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand || 'Generic',
      price: product.price,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
      stock: product.stock,
      tags: product.tags || [],
      image: `/images/products/${imageFilename}`,
    });
  }

  await fs.writeFile(productsPath, `${JSON.stringify(products, null, 2)}\n`);
  console.log(`Seeded ${products.length} products to ${productsPath}`);
  console.log(`Downloaded ${products.length} images to ${imagesDir}`);
}

seedProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
