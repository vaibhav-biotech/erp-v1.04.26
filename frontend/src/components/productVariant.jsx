"use client";
import { Check } from "lucide-react";

export default function VariantCard({ variant, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl px-5 py-4 min-w-[110px] transition-all border ${
        active
          ? "border-green-600 bg-green-50 shadow-sm"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      {/* Check Badge */}
      {active && (
        <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1">
          <Check size={14} />
        </div>
      )}

      {/* Tag */}
      {variant.tag && (
        <div className="absolute -top-3 left-3 text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full">
          {variant.tag}
        </div>
      )}

      <p className="font-medium text-base">{variant.name}</p>
      <p className="text-lg font-semibold text-green-700">
        ₹{variant.price}
      </p>
    </div>
  );
}