'use client';

import PublicLayout from '@/components/PublicLayout';
import ProductDetailCard from '@/components/ProductDetailCard';
import AddProductForm from '@/components/AddProductForm';

export default function TestingPage() {
  const product = {
    id: '1',
    name: 'Monstera - Green Plant',
    category: 'Plants',
    subcategory: 'Indoor Plants',
    rating: 4.8,
    reviews: 256,
    originalPrice: 1599,
    finalPrice: 1199,
    discount: 25,
  };

  const handleAddToCart = (quantity: number, size: number, pot: number, isGift: boolean) => {
    console.log('Add to cart:', { quantity, size, pot, isGift });
    alert(`Added ${quantity} to cart! Size: ${size}, Pot: ${pot}, Gift: ${isGift}`);
  };

  const handleBuyNow = (quantity: number, size: number, pot: number, isGift: boolean) => {
    console.log('Buy now:', { quantity, size, pot, isGift });
    alert(`Buy now! Quantity: ${quantity}, Size: ${size}, Pot: ${pot}, Gift: ${isGift}`);
  };

  return (
    <PublicLayout>
      <ProductDetailCard
        product={product}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
      
      {/* Add Product Form */}
      <div className="px-4 sm:px-8 lg:px-16 py-12 sm:py-16">
        <AddProductForm 
          onSubmit={(data) => {
            console.log('Product submitted:', data);
            alert('Product data logged! Check console.');
          }}
        />
      </div>
    </PublicLayout>
  );
}
