/**
 * Product Model
 * Represents a product with multiple size/weight variants.
 * Prices are stored in paise (1 INR = 100 paise).
 */

import mongoose from 'mongoose'

// ─── Variant sub-schema ───────────────────────────────────────────────────────

const variantSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Variant label is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      default: null,
      validate: {
        validator: function (mrp) {
          // MRP must be >= selling price if provided
          return mrp == null || mrp >= this.price
        },
        message: 'MRP must be greater than or equal to the selling price',
      },
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: null,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  { _id: true }
)

// ─── Product schema ───────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Honey', 'Ghee', 'Sweeteners', 'Spices', 'Other'],
        message: '{VALUE} is not a valid category',
      },
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    ingredients: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (variants) => variants.length > 0,
        message: 'At least one variant is required',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

productSchema.index({ category: 1, status: 1 })
productSchema.index({ isFeatured: 1, status: 1 })
productSchema.index({ name: 'text', description: 'text' }) // full-text search

// ─── Virtual: isOutOfStock ────────────────────────────────────────────────────

productSchema.virtual('isOutOfStock').get(function () {
  return this.variants.every((v) => v.stock === 0)
})

// ─── Virtual: minPrice ────────────────────────────────────────────────────────

productSchema.virtual('minPrice').get(function () {
  if (!this.variants.length) return 0
  return Math.min(...this.variants.map((v) => v.price))
})

// ─── Slug auto-generation ─────────────────────────────────────────────────────

productSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
  next()
})

// ─── Transform ────────────────────────────────────────────────────────────────

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v
    return ret
  },
})

const Product = mongoose.model('Product', productSchema)
export default Product
