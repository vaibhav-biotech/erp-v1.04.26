import { IProduct, IVariant } from '../models/Product';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

export const validateProduct = (product: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!product.name || typeof product.name !== 'string') {
    errors.push({ field: 'name', message: 'Product name is required and must be a string' });
  } else if (product.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Product name must be at least 3 characters' });
  } else if (product.name.length > 100) {
    errors.push({ field: 'name', message: 'Product name cannot exceed 100 characters' });
  }

  // Category validation
  if (!product.category || typeof product.category !== 'string') {
    errors.push({ field: 'category', message: 'Category is required and must be a string' });
  } else if (product.category.trim().length < 2) {
    errors.push({ field: 'category', message: 'Category must be at least 2 characters' });
  } else if (product.category.length > 50) {
    errors.push({ field: 'category', message: 'Category cannot exceed 50 characters' });
  }

  // Subcategories validation (supports both subcategory string and subcategories array for backward compatibility)
  if (product.subcategories) {
    // New format: array of subcategories
    if (!Array.isArray(product.subcategories)) {
      errors.push({ field: 'subcategories', message: 'Subcategories must be an array' });
    } else if (product.subcategories.length === 0) {
      errors.push({ field: 'subcategories', message: 'At least one subcategory is required' });
    } else {
      product.subcategories.forEach((sub: any, index: number) => {
        if (typeof sub !== 'string' || sub.trim().length === 0) {
          errors.push({ field: `subcategories[${index}]`, message: 'Each subcategory must be a non-empty string' });
        }
      });
    }
  } else if (product.subcategory) {
    // Old format: single subcategory string (backward compatibility)
    if (typeof product.subcategory !== 'string') {
      errors.push({ field: 'subcategory', message: 'Subcategory is required and must be a string' });
    } else if (product.subcategory.trim().length < 2) {
      errors.push({ field: 'subcategory', message: 'Subcategory must be at least 2 characters' });
    } else if (product.subcategory.length > 50) {
      errors.push({ field: 'subcategory', message: 'Subcategory cannot exceed 50 characters' });
    }
  } else {
    errors.push({ field: 'subcategories', message: 'At least one subcategory is required' });
  }

  // Original Price validation
  if (typeof product.originalPrice !== 'number') {
    errors.push({ field: 'originalPrice', message: 'Original price must be a number' });
  } else if (product.originalPrice < 0) {
    errors.push({ field: 'originalPrice', message: 'Original price cannot be negative' });
  } else if (product.originalPrice > 999999) {
    errors.push({ field: 'originalPrice', message: 'Original price cannot exceed 999999' });
  }

  // Final Price validation
  if (typeof product.finalPrice !== 'number') {
    errors.push({ field: 'finalPrice', message: 'Final price must be a number' });
  } else if (product.finalPrice < 0) {
    errors.push({ field: 'finalPrice', message: 'Final price cannot be negative' });
  } else if (product.finalPrice > 999999) {
    errors.push({ field: 'finalPrice', message: 'Final price cannot exceed 999999' });
  }

  // Price logic check
  if (typeof product.originalPrice === 'number' && typeof product.finalPrice === 'number') {
    if (product.finalPrice > product.originalPrice) {
      errors.push({
        field: 'finalPrice',
        message: 'Final price cannot be greater than original price'
      });
    }
  }

  // Rating validation
  if (typeof product.rating !== 'number') {
    errors.push({ field: 'rating', message: 'Rating must be a number' });
  } else if (product.rating < 0 || product.rating > 5) {
    errors.push({ field: 'rating', message: 'Rating must be between 0 and 5' });
  }

  // Reviews validation
  if (typeof product.reviews !== 'number') {
    errors.push({ field: 'reviews', message: 'Reviews count must be a number' });
  } else if (product.reviews < 0) {
    errors.push({ field: 'reviews', message: 'Reviews count cannot be negative' });
  }

  // Images validation
  if (!Array.isArray(product.images)) {
    errors.push({ field: 'images', message: 'Images must be an array' });
  } else if (product.images.length === 0) {
    errors.push({ field: 'images', message: 'At least one image is required' });
  } else {
    product.images.forEach((img: any, index: number) => {
      if (typeof img !== 'string') {
        errors.push({
          field: `images[${index}]`,
          message: 'Each image must be a string URL'
        });
      } else if (!img.startsWith('https://')) {
        errors.push({
          field: `images[${index}]`,
          message: 'Image must be HTTPS URL (AWS S3 only)'
        });
      }
    });
  }

  // Size Variants validation
  if (product.sizeVariants) {
    if (!Array.isArray(product.sizeVariants)) {
      errors.push({ field: 'sizeVariants', message: 'Size variants must be an array' });
    } else {
      product.sizeVariants.forEach((variant: any, index: number) => {
        validateVariant(variant, `sizeVariants[${index}]`, errors);
      });
    }
  }

  // Pot Variants validation
  if (product.potVariants) {
    if (!Array.isArray(product.potVariants)) {
      errors.push({ field: 'potVariants', message: 'Pot variants must be an array' });
    } else {
      product.potVariants.forEach((variant: any, index: number) => {
        validateVariant(variant, `potVariants[${index}]`, errors);
      });
    }
  }

  // Status validation
  if (product.status) {
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!validStatuses.includes(product.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.map(e => `${e.field}: ${e.message}`)
  };
};

/**
 * Validates a single variant (size or pot)
 */
const validateVariant = (variant: any, fieldPath: string, errors: ValidationError[]): void => {
  if (!variant.id || typeof variant.id !== 'number') {
    errors.push({ field: `${fieldPath}.id`, message: 'Variant id must be a number' });
  }

  if (!variant.name || typeof variant.name !== 'string') {
    errors.push({ field: `${fieldPath}.name`, message: 'Variant name must be a string' });
  }

  if (typeof variant.price !== 'number') {
    errors.push({ field: `${fieldPath}.price`, message: 'Variant price must be a number' });
  } else if (variant.price < 0) {
    errors.push({ field: `${fieldPath}.price`, message: 'Variant price cannot be negative' });
  }

  if (variant.tag && typeof variant.tag !== 'string') {
    errors.push({ field: `${fieldPath}.tag`, message: 'Variant tag must be a string' });
  }
};

/**
 * Validates multiple products (for bulk upload)
 */
export const validateBulkProducts = (products: any[]): {
  valid: any[];
  invalid: Array<{ product: any; errors: string[] }>;
} => {
  const valid: any[] = [];
  const invalid: Array<{ product: any; errors: string[] }> = [];

  products.forEach((product, index) => {
    const validation = validateProduct(product);
    if (validation.isValid) {
      valid.push(product);
    } else {
      invalid.push({
        product,
        errors: validation.errors
      });
    }
  });

  return { valid, invalid };
};
