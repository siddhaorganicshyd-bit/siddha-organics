/**
 * Product Controller
 * Handles product CRUD, filtering, sorting, stock updates
 * Uses Mongoose Product model for MongoDB persistence.
 */

import { Product } from '../models/index.js'

// GET /api/products
export async function getProducts(req, res) {
  try {
    const { category, sortBy, search, status } = req.query
    const query = {}

    // Admins can see all; public only sees active
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'active'
    } else if (status) {
      query.status = status
    }

    // Filter by category
    if (category) {
      query.category = category
    }

    // Search by name or description
    if (search) {
      const q = search.toLowerCase()
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ]
    }

    // Build sort object
    let sortObj = {}
    if (sortBy === 'price-asc') {
      sortObj = { 'variants.0.price': 1 }
    } else if (sortBy === 'price-desc') {
      sortObj = { 'variants.0.price': -1 }
    } else if (sortBy === 'newest') {
      sortObj = { createdAt: -1 }
    } else if (sortBy === 'best-selling') {
      sortObj = { salesCount: -1 }
    }

    const products = await Product.find(query).sort(sortObj)
    return res.json(products)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error(`[GET /api/products]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// GET /api/products/:id
export async function getProduct(req, res) {
  try {
    const { id } = req.params
    let product = null

    try {
      product = await Product.findById(id)
    } catch (castErr) {
      if (castErr.name === 'CastError') {
        // Invalid ObjectId — try slug lookup
        product = await Product.findOne({ slug: id })
      } else {
        throw castErr
      }
    }

    // If findById returned null (valid ObjectId but no match), try slug
    if (!product) {
      product = await Product.findOne({ slug: id })
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    return res.json(product)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error(`[GET /api/products/:id]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// POST /api/products
export async function createProduct(req, res) {
  try {
    const { name, category, shortDescription, description, variants, images, ingredients, isFeatured, status } = req.body

    // Basic validation
    if (!name || !category || !shortDescription || !description || !variants?.length) {
      return res.status(400).json({ error: 'Missing required fields.' })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')

    const payload = {
      name,
      slug,
      category,
      shortDescription,
      description,
      ingredients: ingredients || '',
      images: images || [],
      variants,
      status: status || 'active',
      isFeatured: isFeatured || false,
      salesCount: 0,
    }

    const newProduct = await Product.create(payload)
    return res.status(201).json(newProduct)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A product with this slug already exists.' })
    }
    console.error(`[POST /api/products]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// PUT /api/products/:id
export async function updateProduct(req, res) {
  try {
    const { id } = req.params
    const { name, category, shortDescription, description, variants, images, ingredients, isFeatured, status } = req.body

    // Only allow safe fields to be updated — prevent overwriting _id, salesCount, createdAt
    const allowedUpdate = {}

    if (name !== undefined) {
      allowedUpdate.name = name
      allowedUpdate.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
    }
    if (category !== undefined) allowedUpdate.category = category
    if (shortDescription !== undefined) allowedUpdate.shortDescription = shortDescription
    if (description !== undefined) allowedUpdate.description = description
    if (ingredients !== undefined) allowedUpdate.ingredients = ingredients
    if (images !== undefined) allowedUpdate.images = Array.isArray(images) ? images : []
    if (isFeatured !== undefined) allowedUpdate.isFeatured = Boolean(isFeatured)
    if (status !== undefined) allowedUpdate.status = status
    if (variants !== undefined) allowedUpdate.variants = variants

    const updatedProduct = await Product.findByIdAndUpdate(id, allowedUpdate, {
      new: true,
      runValidators: true,
    })

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    return res.json(updatedProduct)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A product with this slug already exists.' })
    }
    console.error(`[PUT /api/products/:id]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// DELETE /api/products/:id
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    return res.json({ message: 'Product deleted.' })
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error(`[DELETE /api/products/:id]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// PATCH /api/products/:id/stock
export async function updateStock(req, res) {
  try {
    const { id } = req.params
    const { variantId, stock } = req.body

    if (!variantId || typeof variantId !== 'string') {
      return res.status(400).json({ error: 'variantId is required.' })
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative integer.' })
    }

    // Try updating by variant _id using positional operator
    let updatedProduct = await Product.findOneAndUpdate(
      { _id: id, 'variants._id': variantId },
      { $set: { 'variants.$.stock': stock } },
      { new: true }
    )

    // If not found (variantId might be a legacy string UUID, not an ObjectId),
    // find the product and update the variant manually
    if (!updatedProduct) {
      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' })
      }

      const variant = product.variants.find(
        (v) => v._id.toString() === variantId || v.id === variantId
      )
      if (!variant) {
        return res.status(404).json({ error: 'Variant not found.' })
      }

      variant.stock = stock
      await product.save()
      updatedProduct = product
    }

    return res.json(updatedProduct)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error(`[PATCH /api/products/:id/stock]`, err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
