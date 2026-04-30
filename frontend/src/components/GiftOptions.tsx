"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VariantCard from "./VariantCard";
import { fetchWithStore } from "@/lib/storeConfig";

interface GiftOption {
  _id: string;
  name: string;
  price: number;
  displayOrder: number;
}

interface GiftOptionsProps {
  onGiftSelected?: (option: GiftOption | null) => void;
}

export function GiftOptions({ onGiftSelected }: GiftOptionsProps) {
  const [isGift, setIsGift] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch gift wrap options from API
  useEffect(() => {
    const fetchGiftOptions = async () => {
      try {
        setIsLoading(true);
        const res = await fetchWithStore('/api/admin/gift-wrap-options');

        if (res.ok) {
          const payload = await res.json();
          const options = Array.isArray(payload?.data) ? payload.data : [];
          // Sort by displayOrder
          const sorted = options.sort((a: GiftOption, b: GiftOption) => a.displayOrder - b.displayOrder);
          setGiftOptions(sorted);
        }
      } catch (error) {
        console.error('Error fetching gift options:', error);
        setGiftOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftOptions();
  }, []);

  const handleGiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newState = e.target.checked;
    setIsGift(newState);
    
    // If unchecked, clear selection and notify parent
    if (!newState) {
      setSelectedGift(null);
      onGiftSelected?.(null);
    }
  };

  const handleGiftSelect = (option: GiftOption) => {
    setSelectedGift(option._id);
    onGiftSelected?.(option);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={false}
            readOnly
            disabled
            className="w-4 h-4 border-2 border-gray-400 rounded cursor-not-allowed"
          />
          <span className="text-sm font-medium text-gray-500">Loading gift options...</span>
        </label>
      </div>
    );
  }

  // Don't show if no gift options available
  if (giftOptions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isGift}
          onChange={handleGiftChange}
          className="w-4 h-4 border-2 border-gray-400 rounded cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-900">Mark as gift</span>
      </label>

      {/* Gift Options - Smooth animated open/close */}
      <AnimatePresence initial={false}>
        {isGift && (
          <motion.div
            key="gift-options"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-4 gap-2">
              {giftOptions.map((option) => (
                <VariantCard
                  key={option._id}
                  variant={{
                    name: option.name,
                    price: option.price,
                  }}
                  active={selectedGift === option._id}
                  onClick={() => handleGiftSelect(option)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
