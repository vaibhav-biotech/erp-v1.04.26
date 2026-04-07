'use client';

interface DescriptionSectionProps {
  description?: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  if (!description) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">About This Product</h3>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}
