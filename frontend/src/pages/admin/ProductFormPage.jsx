import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducts } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { generateUUID } from '../../utils/generateId'
import { parseCsvImport } from '../../utils/productHelpers.js'

const CATEGORIES = ['Honey', 'Ghee', 'Sweeteners', 'Spices', 'Other']
const TABS = ['Basic Info', 'Variants', 'Images']

const emptyVariant = () => ({
  id: generateUUID(),
  label: '',
  price: '',
  mrp: '',
  discountPercent: '',
  stock: '',
  sku: '',
  lowStockThreshold: 10,
})

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProduct, createProduct, updateProduct, bulkImport } = useProducts()
  const isEdit = !!id

  const [activeTab, setActiveTab] = useState('Basic Info')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  // Basic Info
  const [basicForm, setBasicForm] = useState({
    name: '',
    category: '',
    shortDescription: '',
    description: '',
    ingredients: '',
    isFeatured: false,
    status: 'active',
  })

  // Variants
  const [variants, setVariants] = useState([emptyVariant()])

  // Images
  const [images, setImages] = useState([])
  const fileInputRef = useRef(null)

  // CSV Import
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)
  const [csvErrors, setCsvErrors] = useState([])
  const csvInputRef = useRef(null)

  // Load existing product for edit
  useEffect(() => {
    if (isEdit) {
      async function loadProduct() {
        try {
          const product = await getProduct(id)
          if (product) {
            setBasicForm({
              name: product.name,
              category: product.category,
              shortDescription: product.shortDescription,
              description: product.description,
              ingredients: product.ingredients || '',
              isFeatured: product.isFeatured,
              status: product.status,
            })
            setVariants(
              product.variants.map((v) => ({
                ...v,
                price: String(v.price),
                mrp: v.mrp != null ? String(v.mrp) : '',
                discountPercent: v.discountPercent != null ? String(v.discountPercent) : '',
                stock: String(v.stock),
              }))
            )
            setImages(product.images || [])
          }
        } catch {
          // product not found
        }
      }
      loadProduct()
    }
  }, [id, isEdit, getProduct])

  const validateBasic = () => {
    const errs = {}
    if (!basicForm.name.trim()) errs.name = 'Name is required'
    if (!basicForm.category) errs.category = 'Category is required'
    if (!basicForm.shortDescription.trim()) errs.shortDescription = 'Short description is required'
    if (!basicForm.description.trim()) errs.description = 'Description is required'
    return errs
  }

  const validateVariants = () => {
    const errs = {}
    variants.forEach((v, i) => {
      if (!v.label.trim()) errs[`variant_${i}_label`] = 'Label is required'

      const price = Number(v.price)
      if (v.price === '' || isNaN(price) || price < 0)
        errs[`variant_${i}_price`] = 'Valid selling price required (in paise)'

      if (v.mrp !== '') {
        const mrp = Number(v.mrp)
        if (isNaN(mrp) || mrp < 0)
          errs[`variant_${i}_mrp`] = 'MRP must be a non-negative number'
        else if (!isNaN(price) && mrp > 0 && mrp < price)
          errs[`variant_${i}_mrp`] = 'MRP must be greater than or equal to selling price'
      }

      if (v.discountPercent !== '') {
        const dp = Number(v.discountPercent)
        if (isNaN(dp) || dp < 0 || dp > 100)
          errs[`variant_${i}_discountPercent`] = 'Discount must be between 0 and 100'
      }

      if (v.stock === '' || isNaN(Number(v.stock)) || Number(v.stock) < 0)
        errs[`variant_${i}_stock`] = 'Valid stock required'
      if (!v.sku.trim()) errs[`variant_${i}_sku`] = 'SKU is required'
    })
    return errs
  }

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target
    setBasicForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleBasicBlur = (e) => {
    const { name, value } = e.target
    const errs = validateBasic()
    if (errs[name]) setErrors((prev) => ({ ...prev, [name]: errs[name] }))
    else setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleVariantChange = (idx, field, value) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)))
    const key = `variant_${idx}_${field}`
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()])
  const removeVariant = (idx) => setVariants((prev) => prev.filter((_, i) => i !== idx))

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages((prev) => [...prev, ev.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const basicErrs = validateBasic()
    const variantErrs = validateVariants()
    const allErrs = { ...basicErrs, ...variantErrs }

    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs)
      if (Object.keys(basicErrs).length > 0) setActiveTab('Basic Info')
      else if (Object.keys(variantErrs).length > 0) setActiveTab('Variants')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...basicForm,
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          mrp: v.mrp !== '' ? Number(v.mrp) : undefined,
          discountPercent: v.discountPercent !== '' ? Number(v.discountPercent) : undefined,
          stock: Number(v.stock),
          lowStockThreshold: Number(v.lowStockThreshold) || 10,
        })),
        images,
      }

      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }
      navigate('/admin/products')
    } catch (err) {
      setServerError(err?.message || 'Failed to save product.')
    } finally {
      setLoading(false)
    }
  }

  // CSV Import
  const handleCsvChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      // Parse for preview only — don't import yet
      const { valid, errors: errs } = parseCsvImport(text)
      setCsvPreview({ text, valid, errors: errs })
      setCsvErrors(errs)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = () => {
    if (!csvPreview?.text) return
    bulkImport(csvPreview.text)
    setShowCsvModal(false)
    navigate('/admin/products')
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
        <Button variant="outline" size="sm" onClick={() => setShowCsvModal(true)}>
          📥 CSV Import
        </Button>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
          {serverError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-green text-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Basic Info Tab */}
        {activeTab === 'Basic Info' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <FormField
              id="name"
              name="name"
              label="Product name"
              value={basicForm.name}
              onChange={handleBasicChange}
              onBlur={handleBasicBlur}
              error={errors.name}
              placeholder="e.g. Raw Tulsi Honey"
            />

            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-green mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={basicForm.category}
                onChange={handleBasicChange}
                onBlur={handleBasicBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="shortDescription" className="block text-sm font-medium text-green mb-1">
                Short description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={basicForm.shortDescription}
                onChange={handleBasicChange}
                onBlur={handleBasicBlur}
                rows={2}
                placeholder="Brief product summary (shown on cards)"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green resize-none ${
                  errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.shortDescription && (
                <p className="text-xs text-red-500 mt-1">{errors.shortDescription}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-green mb-1">
                Full description
              </label>
              <textarea
                id="description"
                name="description"
                value={basicForm.description}
                onChange={handleBasicChange}
                onBlur={handleBasicBlur}
                rows={5}
                placeholder="Detailed product description"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <FormField
              id="ingredients"
              name="ingredients"
              label="Ingredients (optional)"
              value={basicForm.ingredients}
              onChange={handleBasicChange}
              placeholder="e.g. Raw Honey (100%)"
            />

            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={basicForm.isFeatured}
                  onChange={handleBasicChange}
                  className="accent-green w-4 h-4"
                />
                <span className="text-sm text-gray-700">Featured product</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Status:</span>
                <select
                  name="status"
                  value={basicForm.status}
                  onChange={handleBasicChange}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'Variants' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Product Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                + Add Variant
              </Button>
            </div>

            {variants.map((variant, idx) => (
              <div key={variant.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Variant {idx + 1}</span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
                    <input
                      value={variant.label}
                      onChange={(e) => handleVariantChange(idx, 'label', e.target.value)}
                      placeholder="e.g. 500g"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_label`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors[`variant_${idx}_label`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_label`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
                    <input
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      placeholder="e.g. HONEY-TULSI-500G"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_sku`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors[`variant_${idx}_sku`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_sku`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      MRP (paise) <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <input
                      type="number"
                      value={variant.mrp}
                      onChange={(e) => handleVariantChange(idx, 'mrp', e.target.value)}
                      placeholder="e.g. 68000"
                      min="0"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_mrp`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {variant.mrp && !isNaN(Number(variant.mrp)) && (
                      <p className="text-xs text-gray-400 mt-1">= {formatINR(Number(variant.mrp))}</p>
                    )}
                    {errors[`variant_${idx}_mrp`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_mrp`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Discount % <span className="text-gray-400 font-normal">optional</span>
                    </label>
                    <input
                      type="number"
                      value={variant.discountPercent}
                      onChange={(e) => handleVariantChange(idx, 'discountPercent', e.target.value)}
                      placeholder="e.g. 15"
                      min="0"
                      max="100"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_discountPercent`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors[`variant_${idx}_discountPercent`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_discountPercent`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (paise) *</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                      placeholder="e.g. 57800"
                      min="0"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_price`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {variant.price && !isNaN(Number(variant.price)) && (
                      <p className="text-xs text-gray-400 mt-1">= {formatINR(Number(variant.price))}</p>
                    )}
                    {errors[`variant_${idx}_price`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_price`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                      placeholder="e.g. 100"
                      min="0"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                        errors[`variant_${idx}_stock`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors[`variant_${idx}_stock`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`variant_${idx}_stock`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'Images' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Product Images</h2>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files)
                files.forEach((file) => {
                  const reader = new FileReader()
                  reader.onload = (ev) => setImages((prev) => [...prev, ev.target.result])
                  reader.readAsDataURL(file)
                })
              }}
            >
              <span className="text-3xl mb-2 block">🖼️</span>
              <p className="text-sm text-gray-500">Drag & drop images here, or click to select</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Product image ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1">
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>

      {/* CSV Import Modal */}
      <Modal isOpen={showCsvModal} onClose={() => setShowCsvModal(false)} title="CSV Bulk Import">
        <div className="text-sm text-gray-600 mb-4">
          <p className="mb-2">Upload a CSV file with the following columns:</p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
            name, category, shortDescription, description, variantLabel, price, stock, sku
          </code>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              const csv = 'name,category,shortDescription,description,variantLabel,price,stock,sku\nExample Product,Honey,Short desc,Full description,250g,45000,100,EXAMPLE-SKU'
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'product_template.csv'
              a.click()
            }}
            className="text-green underline text-xs mt-2 inline-block"
          >
            Download template
          </a>
        </div>

        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleCsvChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => csvInputRef.current?.click()}
          className="mb-4"
        >
          Choose CSV File
        </Button>

        {csvFile && <p className="text-xs text-gray-500 mb-3">Selected: {csvFile.name}</p>}

        {csvPreview && (
          <div className="mb-4">
            <p className="text-xs font-medium text-green mb-2">
              {csvPreview.valid?.length || 0} valid rows found
            </p>
            {csvErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                {csvErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    Row {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowCsvModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCsvImport}
            disabled={!csvPreview?.valid?.length}
            className="flex-1"
          >
            Import {csvPreview?.valid?.length || 0} Products
          </Button>
        </div>
      </Modal>
    </div>
  )
}
