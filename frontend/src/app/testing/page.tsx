'use client';

import PublicLayout from '@/components/PublicLayout';
import ProductDetailCard from '@/components/ProductDetailCard';

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
    images: [
      'https://images.unsplash.com/photo-1599599810694-b3b4efb9d6a0?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1624763216266-4fa8dbd5f221?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1648903519362-7d1d7d4b6f7f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1657826203914-3da0c7b2b6bb?w=800&h=800&fit=crop'
    ],
    description: 'Beautiful and easy-to-care monstera plant with large, vibrant green leaves. Perfect for any indoor space to add a touch of nature. The Monstera Deliciosa is native to Mexico and is famous for its large fenestrated (split) leaves. This tropical beauty thrives in bright, indirect light and is extremely forgiving, making it perfect for both beginners and experienced plant parents. With proper care, your Monstera can grow to impressive heights and become a stunning focal point in any room.',
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
    ],
    sizeVariants: [
      { id: 1, name: 'Small (6")', price: 0 },
      { id: 2, name: 'Medium (8")', price: 300 },
      { id: 3, name: 'Large (10")', price: 600 }
    ],
    potVariants: [
      { id: 1, name: 'Without Pot', price: 0 },
      { id: 2, name: 'Ceramic Pot', price: 500 },
      { id: 3, name: 'Premium Planter', price: 1000 }
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
      {/* Old UI - Original ProductDetailCard */}
      <div className="border-b-4 border-gray-300 bg-gray-50 py-8 px-4 sm:px-6 lg:px-12">
        <ProductDetailCard
          product={product}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      </div>
    </PublicLayout>
  );
}
