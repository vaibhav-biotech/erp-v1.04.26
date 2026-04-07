'use client';

import DescriptionSection from './DescriptionSection';
import BenefitsSection from './BenefitsSection';
import CareSection from './CareSection';

interface ProductDetailsProps {
  description?: string;
  benefits?: string[];
  care?: string[];
}

export default function ProductDetails({
  description,
  benefits,
  care
}: ProductDetailsProps) {
  // Don't render if no data
  if (!description && (!benefits || benefits.length === 0) && (!care || care.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {description && <DescriptionSection description={description} />}
      {benefits && benefits.length > 0 && <BenefitsSection benefits={benefits} />}
      {care && care.length > 0 && <CareSection care={care} />}
    </div>
  );
}
