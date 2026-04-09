'use client';
import { useState } from 'react';

interface ProductGalleryProps {
  images?: string[];
}

export default function ProductGallery({ images = [] }: ProductGalleryProps) {
  const [selected, setSelected] = useState(images[0] || '');

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-lg overflow-hidden shadow-md flex justify-center items-center bg-gray-50 aspect-square max-w-[600px] sm:max-w-[800px] lg:max-w-[1024px]">
          <div className="text-gray-400">No images available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="rounded-lg overflow-hidden shadow-md flex justify-center items-center bg-gray-50 aspect-square max-w-[600px] sm:max-w-[800px] lg:max-w-[1024px]">
        <img
          src={selected}
          alt="product"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
          }}
        />
      </div>

      {/* Thumbnails (Centered) */}
      <div className="flex justify-center gap-3 mt-4">
        {images.map((img, index) => (
          <div
            key={index}
            onClick={() => setSelected(img)}
            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-colors ${
              selected === img
                ? 'border-green-600'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img
              src={img}
              alt={`thumb-${index}`}
              className="w-20 h-20 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
