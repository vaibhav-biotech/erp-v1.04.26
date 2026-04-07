export function ProductInfo({
  title = "Snake Plant",
  price = 349,
  originalPrice = 499,
  rating = 4.5,
  reviews = 128
}) {
  return (
    <div>
      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
        {title}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className="bg-green-600 text-white px-2 py-0.5 rounded-md font-medium">
          {rating} ★
        </span>
        <span className="text-gray-500">({reviews} reviews)</span>
      </div>

      {/* Price */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">₹{price}</span>
        <span className="text-gray-400 line-through">₹{originalPrice}</span>
        <span className="text-green-600 text-sm font-medium">
          {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
        </span>
      </div>

     
    </div>
  );
}
