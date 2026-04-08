'use client';

interface DescriptionSectionProps {
  description?: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  if (!description) return null;

  return (
    <div className="border-b border-gray-200 py-6">
      <h3 className="text-base font-montserrat font-normal text-gray-900 uppercase tracking-wide mb-4">About This Product</h3>
      <p className="text-gray-700 leading-relaxed font-montserrat font-light text-sm">{description}</p>
    </div>
  );
}
