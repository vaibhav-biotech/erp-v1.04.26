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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying link:', err);
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 border border-gray-200 hover:border-green-200 rounded-full transition-all flex-shrink-0"
          title="Share Product"
        >
          {copied ? (
            <>
              <FiCheck className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <FiShare2 className="w-4 h-4" />
              <span>Share</span>
            </>
          )}
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
