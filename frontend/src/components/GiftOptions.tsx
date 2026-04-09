"use client";
import { useState } from "react";
import VariantCard from "./VariantCard";

export function GiftOptions() {
  const [isGift, setIsGift] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number | null>(null);

  const giftOptions = [
    { id: 1, name: "None", label: "None", price: 0 },
    { id: 2, name: "Gift Wrap", label: "Gift Wrap", price: 50 },
    { id: 3, name: "Gift Wrap + Card", label: "Gift Wrap + Card", price: 100 },
    { id: 4, name: "Premium Gift Box", label: "Premium Gift Box", price: 200 },
  ];

  return (
    <div className="w-full">
      {/* Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(e) => {
            setIsGift(e.target.checked);
            if (!e.target.checked) setSelectedGift(null);
          }}
          className="w-4 h-4 border-2 border-gray-400 rounded cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-900">Mark as gift</span>
      </label>

      {/* Gift Options - Show only when checked */}
      {isGift && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {giftOptions.map((option) => (
            <VariantCard
              key={option.id}
              variant={option}
              active={selectedGift === option.id}
              onClick={() => setSelectedGift(option.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
