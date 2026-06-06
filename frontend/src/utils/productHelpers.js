/**
 * @fileoverview Client-side product utility functions.
 * These are pure helper functions that don't require API calls.
 */

/**
 * Get the minimum price across all variants of a product (in paise).
 * @param {object} product
 * @returns {number}
 */
function minVariantPrice(product) {
  if (!product.variants || product.variants.length === 0) return 0
  return Math.min(...product.variants.map((v) => v.price))
}

/**
 * Sorts a product array by the given sort key.
 * Returns a new array (does not mutate the input).
 * @param {object[]} products
 * @param {'price-asc' | 'price-desc' | 'newest' | 'best-selling'} sortBy
 * @returns {object[]}
 */
export function sortProducts(products, sortBy) {
  const copy = [...products]

  switch (sortBy) {
    case 'price-asc':
      return copy.sort((a, b) => minVariantPrice(a) - minVariantPrice(b))
    case 'price-desc':
      return copy.sort((a, b) => minVariantPrice(b) - minVariantPrice(a))
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    case 'best-selling':
      return copy.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    default:
      return copy
  }
}

/**
 * Returns true if the variant's stock is below its lowStockThreshold (default 10).
 * @param {object} variant
 * @returns {boolean}
 */
export function isLowStock(variant) {
  const threshold = variant.lowStockThreshold ?? 10
  return variant.stock < threshold
}

/**
 * Parses a CSV string into product payloads.
 * @param {string} csv
 * @returns {{ valid: object[], errors: Array<{row: number, message: string}> }}
 */
export function parseCsvImport(csv) {
  const valid = []
  const errors = []

  if (!csv || csv.trim() === '') {
    return { valid, errors }
  }

  const lines = csv.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  if (lines.length < 2) {
    errors.push({ row: 0, message: 'CSV must contain a header row and at least one data row' })
    return { valid, errors }
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())

  const requiredColumns = ['name', 'category', 'shortdescription', 'description', 'variantlabel', 'price', 'stock', 'sku']
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col))
  if (missingColumns.length > 0) {
    errors.push({ row: 0, message: `Missing required columns: ${missingColumns.join(', ')}` })
    return { valid, errors }
  }

  const validCategories = ['Honey', 'Ghee', 'Sweeteners', 'Spices', 'Other']

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1
    const values = parseCsvLine(lines[i])

    if (values.length !== headers.length) {
      errors.push({ row: rowNumber, message: `Column count mismatch (expected ${headers.length}, got ${values.length})` })
      continue
    }

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim()
    })

    const rowErrors = []

    if (!row['name']) rowErrors.push('name is required')
    if (!row['category']) {
      rowErrors.push('category is required')
    } else if (!validCategories.includes(row['category'])) {
      rowErrors.push(`category must be one of: ${validCategories.join(', ')}`)
    }
    if (!row['shortdescription']) rowErrors.push('shortDescription is required')
    if (!row['description']) rowErrors.push('description is required')
    if (!row['variantlabel']) rowErrors.push('variantLabel is required')
    if (!row['sku']) rowErrors.push('sku is required')

    const price = Number(row['price'])
    if (row['price'] === '' || isNaN(price) || price < 0) {
      rowErrors.push('price must be a non-negative number (in paise)')
    }

    const stock = Number(row['stock'])
    if (row['stock'] === '' || isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      rowErrors.push('stock must be a non-negative integer')
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      continue
    }

    const payload = {
      name: row['name'],
      slug: slugify(row['name']),
      category: row['category'],
      shortDescription: row['shortdescription'],
      description: row['description'],
      ingredients: row['ingredients'] || undefined,
      images: row['images'] ? row['images'].split('|').map((s) => s.trim()) : [],
      variants: [
        {
          label: row['variantlabel'],
          price,
          stock,
          lowStockThreshold: row['lowstockthreshold'] ? Number(row['lowstockthreshold']) : 10,
          sku: row['sku'],
        },
      ],
      status: row['status'] === 'inactive' ? 'inactive' : 'active',
      isFeatured: row['isfeatured'] === 'true',
    }

    valid.push(payload)
  }

  return { valid, errors }
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}
