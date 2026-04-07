'use client';
import { FiCheck } from 'react-icons/fi';

interface VariantCardProps {
  variant: {
    name: string;
    price: number;
    tag?: string;
  };
  active: boolean;
  onClick: () => void;
}

export default function VariantCard({ variant, active, onClick }: VariantCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl px-3 py-2 min-w-[100px] transition-all border ${
        active
          ? 'border-amber-400  shadow-sm border-2'
          : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      {/* Check Badge */}
      {active && (
        <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full flex items-center justify-center w-5 h-5">
          <FiCheck size={12} strokeWidth={3} />
        </div>
      )}

      {/* Tag */}
      {variant.tag && (
        <div className="absolute -top-3 left-3 text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full">
          {variant.tag}
        </div>
      )}

      <p className="font-medium text-sm text-green-700">{variant.name}</p>
      <p className="text-base font-semibold text-green-700">
        ₹{variant.price}
      </p>
    </div>
  );
}
