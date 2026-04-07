'use client';
import { useState } from 'react';

const images = [
  'https://lh3.google.com/d/1JntBSa_g79LZjuC-xD50UXYGPMwApiWq=w800',
  'https://lh3.google.com/d/1OYd1WFhG_C5aeH-jGlHkFHRd_lUJQl_S=w800',
  'https://lh3.google.com/d/1fAgMm8_PJ7opa9nZTBRKwri7o8s1ocuZ=w800',
  'https://lh3.google.com/d/1HWSpxNGbJXQTMpS7eEXrhGWrIC_3saOZ=w800',
];

export default function ProductGallery() {
  const [selected, setSelected] = useState(images[0]);

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="rounded-lg overflow-hidden shadow-md flex justify-center items-center bg-gray-50 aspect-square max-w-[600px] sm:max-w-[800px] lg:max-w-[1024px]">
        <img
          src={selected}
          alt="product"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnails (Centered) */}
      <div className="flex justify-center gap-3 mt-4">
        {images.map((img, index) => (
          <div
            key={index}
            onClick={() => setSelected(img)}
            className={`cursor-pointer rounded-xl overflow-hidden border-2 ${
              selected === img
                ? 'border-green-600'
                : 'border-transparent'
            }`}
          >
            <img
              src={img}
              alt="thumb"
              className="w-20 h-20 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
