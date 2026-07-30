import { useState } from 'react';
import { FiShare2, FiCheck } from 'react-icons/fi';

export function ProductInfo({
  title = "Snake Plant",
  price = 349,
  originalPrice = 499,
  rating = 4.5,
  reviews = 128,
  plantPrice = 0,
  potPrice = 0,
}) {
  const displayPrice = price;
  const displayOriginal = originalPrice;
  const discount = displayOriginal && displayOriginal > displayPrice 
    ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100) 
    : 0;

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            url: window.location.href,
          });
        } catch (err) {
          console.error('Error sharing:', err);
        }
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div>
      {/* Title & Share */}
      <div className="flex justify-between items-start gap-4">
        <h1 className="text-3xl font-normal text-gray-900 leading-tight font-playfair">
          {title}
        </h1>
        <button 
          onClick={handleShare}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
          title="Share Product"
        >
          {copied ? <FiCheck className="w-5 h-5 text-green-600" /> : <FiShare2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-3 text-sm font-montserrat">
        <span className="text-gray-900 font-normal">
          {rating} <span className="text-amber-400">★</span>
        </span>
        <span className="text-gray-500">({reviews} reviews)</span>
      </div>

      {/* Price */}
      <div className="mt-5 flex items-center gap-3 font-montserrat">
        <span className="text-3xl font-bold text-gray-900">₹{displayPrice}</span>
        {displayOriginal > displayPrice && (
          <>
            <span className="text-gray-400 line-through">₹{displayOriginal}</span>
            <span className="text-green-600 text-sm font-normal">
              {discount}% OFF
            </span>
          </>
        )}
      </div>
    </div>
  );
}
