const validateProduct = (product) => {
  const errors = [];

  // Name validation
  if (!product.name || typeof product.name !== 'string') {
    errors.push('name: Product name is required and must be a string');
  } else if (product.name.trim().length < 3) {
    errors.push('name: Product name must be at least 3 characters');
  } else if (product.name.length > 100) {
    errors.push('name: Product name cannot exceed 100 characters');
  }

  // Category validation
  if (!product.category || typeof product.category !== 'string') {
    errors.push('category: Category is required and must be a string');
  } else if (product.category.trim().length < 2) {
    errors.push('category: Category must be at least 2 characters');
  } else if (product.category.length > 50) {
    errors.push('category: Category cannot exceed 50 characters');
  }

  // Subcategory validation
  if (!product.subcategory || typeof product.subcategory !== 'string') {
    errors.push('subcategory: Subcategory is required and must be a string');
  } else if (product.subcategory.trim().length < 2) {
    errors.push('subcategory: Subcategory must be at least 2 characters');
  } else if (product.subcategory.length > 50) {
    errors.push('subcategory: Subcategory cannot exceed 50 characters');
  }

  // Original Price validation
  if (typeof product.originalPrice !== 'number') {
    errors.push('originalPrice: Original price must be a number');
  } else if (product.originalPrice < 0) {
    errors.push('originalPrice: Original price cannot be negative');
  } else if (product.originalPrice > 999999) {
    errors.push('originalPrice: Original price cannot exceed 999999');
  }

  // Final Price validation
  if (typeof product.finalPrice !== 'number') {
    errors.push('finalPrice: Final price must be a number');
  } else if (product.finalPrice < 0) {
    errors.push('finalPrice: Final price cannot be negative');
  } else if (product.finalPrice > 999999) {
    errors.push('finalPrice: Final price cannot exceed 999999');
  }

  // Price logic check
  if (typeof product.originalPrice === 'number' && typeof product.finalPrice === 'number') {
    if (product.finalPrice > product.originalPrice) {
      errors.push('finalPrice: Final price cannot be greater than original price');
    }
  }

  // Rating validation
  if (typeof product.rating !== 'number') {
    errors.push('rating: Rating must be a number');
  } else if (product.rating < 0 || product.rating > 5) {
    errors.push('rating: Rating must be between 0 and 5');
  }

  // Reviews validation
  if (typeof product.reviews !== 'number') {
    errors.push('reviews: Reviews count must be a number');
  } else if (product.reviews < 0) {
    errors.push('reviews: Reviews count cannot be negative');
  }

  // Images validation
  if (!Array.isArray(product.images)) {
    errors.push('images: Images must be an array');
  } else if (product.images.length === 0) {
    errors.push('images: At least one image is required');
  } else {
    product.images.forEach((img, index) => {
      if (typeof img !== 'string') {
        errors.push(`images[${index}]: Each image must be a string URL`);
      } else if (!img.startsWith('https://')) {
        errors.push(`images[${index}]: Image must be HTTPS URL (AWS S3 only)`);
      }
    });
  }

  // Size Variants validation
  if (product.sizeVariants) {
    if (!Array.isArray(product.sizeVariants)) {
      errors.push('sizeVariants: Size variants must be an array');
    } else {
      product.sizeVariants.forEach((variant, index) => {
        validateVariant(variant, `sizeVariants[${index}]`, errors);
      });
    }
  }

  // Pot Variants validation
  if (product.potVariants) {
    if (!Array.isArray(product.potVariants)) {
      errors.push('potVariants: Pot variants must be an array');
    } else {
      product.potVariants.forEach((variant, index) => {
        validateVariant(variant, `potVariants[${index}]`, errors);
      });
    }
  }

  // Status validation
  if (product.status) {
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!validStatuses.includes(product.status)) {
      errors.push(`status: Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a single variant (size or pot)
 */
const validateVariant = (variant, fieldPath, errors) => {
  if (!variant.id || typeof variant.id !== 'number') {
    errors.push(`${fieldPath}.id: Variant id must be a number`);
  }

  if (!variant.name || typeof variant.name !== 'string') {
    errors.push(`${fieldPath}.name: Variant name must be a string`);
  }

  if (typeof variant.price !== 'number') {
    errors.push(`${fieldPath}.price: Variant price must be a number`);
  } else if (variant.price < 0) {
    errors.push(`${fieldPath}.price: Variant price cannot be negative`);
  }

  if (variant.tag && typeof variant.tag !== 'string') {
    errors.push(`${fieldPath}.tag: Variant tag must be a string`);
  }
};

/**
 * Validates multiple products (for bulk upload)
 */
const validateBulkProducts = (products) => {
  const valid = [];
  const invalid = [];

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

module.exports = {
  validateProduct,
  validateBulkProducts
};
