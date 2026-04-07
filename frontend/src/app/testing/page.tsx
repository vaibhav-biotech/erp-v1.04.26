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
    description: 'Beautiful and easy-to-care monstera plant with large, vibrant green leaves. Perfect for any indoor space to add a touch of nature.',
    benefits: [
      '100% organic and pesticide-free',
      'Improves air quality by filtering toxins',
      'Easy to maintain and care for',
      'Adds natural aesthetic to your space',
      'Great for beginners and plant lovers'
    ],
    care: [
      'Water once every 7-10 days when soil is dry',
      'Place in bright, indirect sunlight',
      'Maintain temperature between 18-24°C',
      'Wipe leaves with damp cloth monthly',
      'Rotate plant every 2 weeks for even growth',
      'Trim brown or yellowing leaves regularly'
    ]
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
