const mongoose = require('mongoose');
const { Schema } = mongoose;

const variantSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  tag: { type: String, default: null }
});

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    subcategory: {
      type: String,
      required: [true, 'Subcategory is required'],
      trim: true,
      minlength: [2, 'Subcategory must be at least 2 characters'],
      maxlength: [50, 'Subcategory cannot exceed 50 characters']
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative'],
      max: [999999, 'Price cannot exceed 999999']
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final price is required'],
      min: [0, 'Price cannot be negative'],
      max: [999999, 'Price cannot exceed 999999']
    },
    discount: {
      type: Number,
      default: null
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviews: {
      type: Number,
      required: [true, 'Reviews count is required'],
      min: [0, 'Reviews cannot be negative'],
      default: 0
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0 && v.every(url => url.startsWith('https://'));
        },
        message: 'Images must be valid HTTPS URLs (AWS S3 URLs only)'
      }
    },
    description: {
      type: String,
      default: null
    },
    benefits: {
      type: [String],
      default: []
    },
    care: {
      type: [String],
      default: []
    },
    sizeVariants: {
      type: [variantSchema],
      default: []
    },
    potVariants: {
      type: [variantSchema],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

// Index for faster queries
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ status: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
