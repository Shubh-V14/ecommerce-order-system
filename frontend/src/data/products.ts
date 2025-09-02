export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  sku: string;
  image: string;
  color: string;
  inStock: boolean;
}

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Beauty',
  'Automotive',
  'Food & Beverages'
];

export const PRODUCTS: Product[] = [
  // Electronics
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 999.99,
    category: 'Electronics',
    description: 'Latest iPhone with titanium design and A17 Pro chip',
    sku: 'IPHONE-15-PRO',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-blue-500 to-purple-600',
    inStock: true
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    price: 1299.99,
    category: 'Electronics',
    description: '13-inch laptop with M3 chip and all-day battery life',
    sku: 'MBA-M3-13',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-gray-500 to-gray-700',
    inStock: true
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5',
    price: 399.99,
    category: 'Electronics',
    description: 'Premium noise-canceling wireless headphones',
    sku: 'SONY-WH1000XM5',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    inStock: true
  },
  {
    id: '4',
    name: 'Samsung 4K Smart TV',
    price: 799.99,
    category: 'Electronics',
    description: '55-inch QLED 4K Smart TV with HDR',
    sku: 'SAMSUNG-55Q70C',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    inStock: true
  },

  // Clothing
  {
    id: '5',
    name: 'Nike Air Max 270',
    price: 149.99,
    category: 'Clothing',
    description: 'Comfortable running shoes with Max Air cushioning',
    sku: 'NIKE-AM270',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-orange-500 to-red-600',
    inStock: true
  },
  {
    id: '6',
    name: 'Levi\'s 501 Jeans',
    price: 89.99,
    category: 'Clothing',
    description: 'Classic straight-fit jeans in premium denim',
    sku: 'LEVIS-501-BLUE',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    inStock: true
  },
  {
    id: '7',
    name: 'Adidas Hoodie',
    price: 79.99,
    category: 'Clothing',
    description: 'Comfortable cotton hoodie with iconic 3-stripes',
    sku: 'ADIDAS-HOODIE-BLK',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-green-500 to-teal-600',
    inStock: true
  },

  // Home & Garden
  {
    id: '8',
    name: 'Dyson V15 Vacuum',
    price: 649.99,
    category: 'Home & Garden',
    description: 'Cordless vacuum with laser dust detection',
    sku: 'DYSON-V15-DETECT',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    inStock: true
  },
  {
    id: '9',
    name: 'Instant Pot Duo',
    price: 99.99,
    category: 'Home & Garden',
    description: '7-in-1 electric pressure cooker',
    sku: 'INSTANT-POT-DUO',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-red-500 to-pink-600',
    inStock: true
  },
  {
    id: '10',
    name: 'Philips Hue Starter Kit',
    price: 199.99,
    category: 'Home & Garden',
    description: 'Smart LED bulbs with color changing capability',
    sku: 'PHILIPS-HUE-STARTER',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-purple-600 to-blue-700',
    inStock: true
  },

  // Sports
  {
    id: '11',
    name: 'Yoga Mat Premium',
    price: 49.99,
    category: 'Sports',
    description: 'Non-slip yoga mat with alignment lines',
    sku: 'YOGA-MAT-PREMIUM',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-teal-500 to-green-600',
    inStock: true
  },
  {
    id: '12',
    name: 'Dumbbell Set',
    price: 299.99,
    category: 'Sports',
    description: 'Adjustable dumbbells 5-50 lbs each',
    sku: 'DUMBBELL-SET-50',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-gray-600 to-gray-800',
    inStock: true
  },

  // Books
  {
    id: '13',
    name: 'The Psychology of Money',
    price: 24.99,
    category: 'Books',
    description: 'Timeless lessons on wealth, greed, and happiness',
    sku: 'BOOK-PSYCH-MONEY',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    inStock: true
  },
  {
    id: '14',
    name: 'Atomic Habits',
    price: 19.99,
    category: 'Books',
    description: 'An easy & proven way to build good habits',
    sku: 'BOOK-ATOMIC-HABITS',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    inStock: true
  },

  // Beauty
  {
    id: '15',
    name: 'Skincare Set',
    price: 129.99,
    category: 'Beauty',
    description: 'Complete skincare routine with cleanser, serum, and moisturizer',
    sku: 'SKINCARE-SET-DELUXE',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-pink-500 to-rose-600',
    inStock: true
  },
  {
    id: '16',
    name: 'Hair Dryer Pro',
    price: 199.99,
    category: 'Beauty',
    description: 'Professional ionic hair dryer with multiple attachments',
    sku: 'HAIRDRYER-PRO-2000',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
    color: 'bg-gradient-to-br from-violet-500 to-purple-600',
    inStock: true
  }
];

export const getProductById = (id: string): Product | undefined => {
  return PRODUCTS.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return PRODUCTS.filter(product => product.category === category);
};

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.category.toLowerCase().includes(lowercaseQuery)
  );
};
