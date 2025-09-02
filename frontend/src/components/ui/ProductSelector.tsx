'use client';

import { useState } from 'react';
import { X, Search, Package, Plus, ShoppingCart } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { PRODUCTS, PRODUCT_CATEGORIES, Product, searchProducts, getProductsByCategory } from '@/data/products';

interface ProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any) => void;
}

const ALL_CATEGORIES = ['All', ...PRODUCT_CATEGORIES];

export const ProductSelector: React.FC<ProductSelectorProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: '',
    sku: '',
    description: ''
  });

  const filteredProducts = searchQuery 
    ? searchProducts(searchQuery)
    : selectedCategory === 'All' 
      ? PRODUCTS 
      : getProductsByCategory(selectedCategory);

  const handleAddManualProduct = () => {
    if (!manualProduct.name || !manualProduct.price) return;
    
    const product = {
      product_name: manualProduct.name,
      product_sku: manualProduct.sku || `CUSTOM-${Date.now()}`,
      unit_price: parseFloat(manualProduct.price),
      product_description: manualProduct.description
    };
    
    onSelectProduct(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Product Catalog</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 hover:from-green-600 hover:to-teal-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Product</span>
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {showManualEntry && (
            <div className="mb-6 p-6 border-2 border-dashed border-green-300 rounded-2xl bg-gradient-to-r from-green-50 to-teal-50">
              <h3 className="text-xl font-bold mb-4 text-green-800">Add Custom Product</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Product Name"
                  value={manualProduct.name}
                  onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
                <Input
                  label="Price"
                  type="number"
                  step="0.01"
                  value={manualProduct.price}
                  onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                  placeholder="0.00"
                />
                <Input
                  label="SKU (Optional)"
                  value={manualProduct.sku}
                  onChange={(e) => setManualProduct({ ...manualProduct, sku: e.target.value })}
                  placeholder="Product SKU"
                />
                <Input
                  label="Description (Optional)"
                  value={manualProduct.description}
                  onChange={(e) => setManualProduct({ ...manualProduct, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={handleAddManualProduct}
                  disabled={!manualProduct.name || !manualProduct.price}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualProduct({ name: '', price: '', sku: '', description: '' });
                  }}
                  className="border-2 border-gray-300 hover:border-gray-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-white"
                onClick={() => onSelectProduct({
                  product_name: product.name,
                  product_sku: product.sku,
                  unit_price: product.price,
                  product_description: product.description
                })}
              >
                {/* Product Image */}
                <div className={`h-48 ${product.color} relative overflow-hidden`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                      {product.category}
                    </div>
                  </div>
                  {product.inStock && (
                    <div className="absolute top-3 left-3">
                      <div className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                        In Stock
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-800">
                    Click to Select
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or browse different categories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
