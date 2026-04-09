export function ProductInfo({
  title = "Snake Plant",
  price = 349,
  originalPrice = 499,
  rating = 4.5,
  reviews = 128,
  plantPrice = 0,
  potPrice = 0,
}) {
  const totalPrice = plantPrice + potPrice || price;
  const displayPrice = totalPrice;
  const displayOriginal = originalPrice;
  const discount = displayOriginal ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100) : 0;

  return (
    <div>
      {/* Title */}
      <h1 className="text-3xl font-normal text-gray-900 leading-tight font-playfair">
        {title}
      </h1>

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
