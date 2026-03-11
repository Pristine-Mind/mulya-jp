'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios, { isAxiosError } from 'axios';
import {
  Plus, Download, Pencil, Search, X, Check, Image as ImageIcon,
  Tag, AlertCircle, CheckCircle, Loader2, ArrowLeft,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Inline marketplace API helpers ───────────────────────────────────────────
async function createMarketplaceProduct(productId: number) {
  const res = await axios.post(
    `${apiBase}/api/v1/marketplace/products/create-from-product/`,
    { product_id: productId },
    { headers: authHeaders() }
  );
  return res.data as { message: string };
}

async function getProductDiscountInfo(marketplaceId: number) {
  const res = await axios.get(
    `${apiBase}/api/v1/marketplace/products/${marketplaceId}/discount/`,
    { headers: authHeaders() }
  );
  return res.data as { discount_info: DiscountInfo };
}

async function setProductDiscount(marketplaceId: number, percentage: number) {
  await axios.post(
    `${apiBase}/api/v1/marketplace/products/${marketplaceId}/set-discount/`,
    { discount_percentage: percentage },
    { headers: authHeaders() }
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ProductImage { id: number; image: string; alt_text: string | null }

interface Product {
  id: number;
  marketplace_id?: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  category: string;
  producer: string | number;
  images: ProductImage[];
  category_details: string;
  size?: string | null;
  color?: string | null;
  additional_information?: string | null;
  avg_daily_demand?: number;
  safety_stock?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  category_id?: number;
  subcategory_id?: number;
  sub_subcategory_id?: number;
  producer_id?: number;
}

interface Producer { id: number; name: string }
interface Category { id: number; name: string }

interface DiscountInfo {
  discount_percentage: number;
  listed_price?: number;
  discounted_price?: number;
}

interface ErrorMessages {
  producer?: string[];
  name?: string[];
  description?: string[];
  sku?: string[];
  price?: string[];
  cost_price?: string[];
  stock?: string[];
  reorder_level?: string[];
  category?: string[];
  general?: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────
const SIZE_CHOICES = [
  { value: 'XS', label: 'Extra Small' },
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
  { value: 'XL', label: 'Extra Large' },
  { value: 'XXL', label: 'Double Extra Large' },
  { value: 'XXXL', label: 'Triple Extra Large' },
  { value: 'ONE_SIZE', label: 'One Size' },
  { value: 'CUSTOM', label: 'Custom Size' },
];

const COLOR_CHOICES = [
  { value: 'RED', label: 'Red' }, { value: 'BLUE', label: 'Blue' },
  { value: 'GREEN', label: 'Green' }, { value: 'YELLOW', label: 'Yellow' },
  { value: 'BLACK', label: 'Black' }, { value: 'WHITE', label: 'White' },
  { value: 'GRAY', label: 'Gray' }, { value: 'BROWN', label: 'Brown' },
  { value: 'ORANGE', label: 'Orange' }, { value: 'PURPLE', label: 'Purple' },
  { value: 'PINK', label: 'Pink' }, { value: 'NAVY', label: 'Navy' },
  { value: 'BEIGE', label: 'Beige' }, { value: 'GOLD', label: 'Gold' },
  { value: 'SILVER', label: 'Silver' }, { value: 'MULTICOLOR', label: 'Multicolor' },
  { value: 'TRANSPARENT', label: 'Transparent' }, { value: 'CUSTOM', label: 'Custom Color' },
];

const emptyForm = {
  producer: '', name: '', description: '', sku: '',
  price: '', cost_price: '', stock: '', reorder_level: '10',
  is_active: true, category: '', size: '', color: '', additional_information: '',
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [images, setImages] = useState<FileList | null>(null);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Stock update
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [editingStock, setEditingStock] = useState<{ id: number | null; value: string }>({ id: null, value: '' });
  const [stockUpdateError, setStockUpdateError] = useState('');
  const [stockUpdateSuccess, setStockUpdateSuccess] = useState('');
  const [quickUpdateStock, setQuickUpdateStock] = useState<{ id: number | null; value: string }>({ id: null, value: '' });

  // Export
  const [exportingProductId, setExportingProductId] = useState<number | null>(null);

  // Marketplace
  const [creatingMarketplaceProductId, setCreatingMarketplaceProductId] = useState<number | null>(null);
  const [marketplaceSuccess, setMarketplaceSuccess] = useState('');
  const [marketplaceError, setMarketplaceError] = useState('');

  // Discount
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchProducers();
    fetchCategories();
  }, [searchQuery, categoryFilter, currentPage, itemsPerPage]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let url = `${apiBase}/api/v1/products/?search=${encodeURIComponent(searchQuery)}&limit=${itemsPerPage}&offset=${offset}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      const res = await axios.get(url, { headers: authHeaders() });
      setProducts(res.data.results || []);
      setTotalItems(res.data.count || 0);
      setTotalPages(Math.ceil((res.data.count || 0) / itemsPerPage));
    } catch {
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducers = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/producers/`, { headers: authHeaders() });
      setProducers(res.data.results || res.data || []);
    } catch {
      setProducers([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/categories/`, { headers: authHeaders() });
      setCategories(res.data.results || res.data || []);
    } catch {
      setCategories([]);
    }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData(emptyForm);
    setImages(null);
    setEditingProductId(null);
    setExistingImages([]);
    setDeletedImages([]);
    setErrorMessages({});
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    let producerId = '';
    if (product.producer_id) {
      producerId = product.producer_id.toString();
    } else if (product.producer && producers.length > 0) {
      const val = product.producer.toString();
      const found = producers.find(p =>
        p.name === val || p.name.toLowerCase() === val.toLowerCase() || p.id.toString() === val
      );
      if (found) producerId = found.id.toString();
    }
    setFormData({
      producer: producerId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock: product.stock.toString(),
      reorder_level: product.reorder_level.toString(),
      is_active: product.is_active,
      category: product.category || '',
      size: product.size || '',
      color: product.color || '',
      additional_information: product.additional_information || '',
    });
    setExistingImages(product.images || []);
    setFormVisible(true);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, String(v)));
    if (images) {
      for (let i = 0; i < images.length; i++) fd.append('uploaded_images', images[i]);
    }
    deletedImages.forEach(id => fd.append('deleted_images', id.toString()));

    try {
      if (editingProductId) {
        await axios.patch(`${apiBase}/api/v1/products/${editingProductId}/`, fd, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product updated successfully.');
      } else {
        await axios.post(`${apiBase}/api/v1/products/`, fd, {
          headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product added successfully.');
      }
      setErrorMessages({});
      resetForm();
      setFormVisible(false);
      setCurrentPage(1);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: ['An error occurred. Please try again.'] });
      } else {
        setErrorMessages({ general: ['Failed to add or update product.'] });
      }
    }
  };

  // ── Stock update ─────────────────────────────────────────────────────────
  const handleUpdateStock = async (productId: number) => {
    const value = quickUpdateStock.id === productId ? quickUpdateStock.value : editingStock.value;
    if (!value || isNaN(Number(value))) { setStockUpdateError('Please enter a valid number'); return; }
    try {
      setIsUpdatingStock(true);
      const res = await axios.post(
        `${apiBase}/api/v1/products/${productId}/update-stock/`,
        { stock: Number(value) },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
      );
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: res.data.stock } : p));
      if (viewingProduct?.id === productId) {
        setViewingProduct(prev => prev ? { ...prev, stock: res.data.stock } : null);
      }
      setStockUpdateSuccess('Stock updated successfully!');
      setStockUpdateError('');
      setEditingStock({ id: null, value: '' });
      setQuickUpdateStock({ id: null, value: '' });
      setTimeout(() => setStockUpdateSuccess(''), 3000);
    } catch {
      setStockUpdateError('Failed to update stock.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExportAll = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/export/products/`, {
        responseType: 'blob', headers: authHeaders(),
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setErrorMessages({ general: ['Error exporting data.'] });
    }
  };

  const handleExportStats = async (productId: number) => {
    try {
      setExportingProductId(productId);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${apiBase}/api/v1/daily-product-stats/?product=${productId}&export=excel`,
        { headers: { Authorization: `Token ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `product_${productId}_stats.xlsx`;
      if (contentDisposition) {
        const m = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (m?.[1]) filename = m[1].replace(/['"]/g, '');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch { /* silent */ } finally {
      setExportingProductId(null);
    }
  };

  // ── Marketplace ──────────────────────────────────────────────────────────
  const handleCreateMarketplaceProduct = async (productId: number) => {
    setCreatingMarketplaceProductId(productId);
    setMarketplaceError('');
    setMarketplaceSuccess('');
    try {
      const res = await createMarketplaceProduct(productId);
      setMarketplaceSuccess(res.message);
      setTimeout(() => setMarketplaceSuccess(''), 5000);
    } catch (err) {
      setMarketplaceError(err instanceof Error ? err.message : 'Failed to create marketplace product');
      setTimeout(() => setMarketplaceError(''), 5000);
    } finally {
      setCreatingMarketplaceProductId(null);
    }
  };

  // ── Discount ─────────────────────────────────────────────────────────────
  const handleOpenDiscountModal = async (product: Product) => {
    setSelectedProductForDiscount(product);
    setDiscountPercentage('');
    setDiscountError('');
    setDiscountSuccess('');
    setDiscountInfo(null);
    setDiscountModalOpen(true);
    const marketplaceId = product.marketplace_id || product.id;
    try {
      setDiscountLoading(true);
      const res = await getProductDiscountInfo(marketplaceId);
      setDiscountInfo(res.discount_info);
      if (res.discount_info.discount_percentage > 0) {
        setDiscountPercentage(res.discount_info.discount_percentage.toString());
      }
    } catch { /* no existing discount */ } finally {
      setDiscountLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedProductForDiscount) return;
    const pct = parseFloat(discountPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setDiscountError('Please enter a valid percentage between 0 and 100.');
      return;
    }
    if (pct === 100 && !window.confirm('Are you sure you want to apply a 100% discount?')) return;
    try {
      setDiscountLoading(true);
      setDiscountError('');
      const marketplaceId = selectedProductForDiscount.marketplace_id || selectedProductForDiscount.id;
      await setProductDiscount(marketplaceId, pct);
      setDiscountSuccess('Discount applied successfully!');
      await fetchProducts();
      setTimeout(() => {
        setDiscountModalOpen(false);
        setSelectedProductForDiscount(null);
        setDiscountPercentage('');
        setDiscountInfo(null);
        setDiscountSuccess('');
      }, 1200);
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Failed to apply discount.');
    } finally {
      setDiscountLoading(false);
    }
  };

  const closeDiscountModal = () => {
    setDiscountModalOpen(false);
    setSelectedProductForDiscount(null);
    setDiscountPercentage('');
    setDiscountInfo(null);
    setDiscountError('');
    setDiscountSuccess('');
  };

  // ── Misc ─────────────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setCurrentPage(1);
  };
  const hasFilters = searchQuery || categoryFilter;

  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const total = Math.min(totalPages, 5);
    let start = 1;
    if (totalPages > 5) {
      if (currentPage <= 3) start = 1;
      else if (currentPage >= totalPages - 2) start = totalPages - 4;
      else start = currentPage - 2;
    }
    for (let i = 0; i < total; i++) pages.push(start + i);
    return pages;
  }, [currentPage, totalPages]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Products</h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-vermilion hover:text-deep-red font-medium px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { resetForm(); setFormVisible(true); }}
              className="flex items-center justify-center gap-2 bg-vermilion text-white px-5 py-2.5 rounded-xl hover:bg-deep-red transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {/* Global status banners */}
        {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 text-sm">{success}</div>}
        {marketplaceSuccess && <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded mb-4 text-sm">{marketplaceSuccess}</div>}
        {marketplaceError && <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded mb-4 text-sm">{marketplaceError}</div>}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition bg-white"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition bg-white w-full sm:w-52"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          >
            {[6, 12, 24, 48].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Product grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-vermilion" />
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-semibold text-ink line-clamp-2 pr-2">{product.name}</h3>
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Card meta */}
              <div className="space-y-3 mb-5">
                <div className="text-xs text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: product.description }} />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Price:</span> <span className="font-semibold">¥{product.price.toLocaleString()}</span></div>
                  <div>
                    <span className="text-gray-400">Stock:</span>
                    <span className={`ml-1 font-semibold ${product.stock <= product.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div><span className="text-gray-400">SKU:</span> <span className="text-gray-700">{product.sku}</span></div>
                  <div><span className="text-gray-400">Category:</span> <span className="text-gray-700">{product.category}</span></div>
                </div>
              </div>

              {/* Card actions */}
              <div className="flex flex-col gap-2">
                {/* Row 1 */}
                <div className="flex gap-2">
                  <button onClick={() => setViewingProduct(product)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium">View</button>
                  <button onClick={() => handleEdit(product)} className="flex-1 bg-vermilion text-white py-2 rounded-lg hover:bg-deep-red transition-colors text-xs font-medium flex items-center justify-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
                {/* Row 2 — Quick stock */}
                {quickUpdateStock.id === product.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={quickUpdateStock.value}
                      onChange={e => setQuickUpdateStock({ ...quickUpdateStock, value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-vermilion"
                      placeholder="New stock"
                    />
                    <button onClick={() => handleUpdateStock(product.id)} disabled={isUpdatingStock} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      {isUpdatingStock ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </button>
                    <button onClick={() => setQuickUpdateStock({ id: null, value: '' })} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setQuickUpdateStock({ id: product.id, value: product.stock.toString() })} className="flex-1 bg-orange-50 text-orange-700 py-2 rounded-lg hover:bg-orange-100 transition-colors text-xs font-medium">
                      Update Stock
                    </button>
                    <button
                      onClick={() => handleExportStats(product.id)}
                      disabled={exportingProductId === product.id}
                      className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                    >
                      {exportingProductId === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Download className="h-3 w-3" /> Stats</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">Previous</button>
            {paginationPages.map(n => (
              <button key={n} onClick={() => setCurrentPage(n)} className={`px-3 py-1.5 border text-sm rounded-lg transition ${currentPage === n ? 'bg-vermilion text-white border-vermilion' : 'border-gray-200 hover:bg-gray-50'}`}>{n}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">{viewingProduct.name}</h3>
              <button onClick={() => { setViewingProduct(null); setEditingStock({ id: null, value: '' }); setStockUpdateError(''); setStockUpdateSuccess(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Producer', viewingProduct.producer],
                  ['Category', viewingProduct.category_details || viewingProduct.category],
                  ['SKU', viewingProduct.sku],
                  ['Price', `¥${viewingProduct.price.toFixed(2)}`],
                  ['Cost Price', `¥${viewingProduct.cost_price.toFixed(2)}`],
                  ['Reorder Level', viewingProduct.reorder_level],
                  ...(viewingProduct.size ? [['Size', SIZE_CHOICES.find(c => c.value === viewingProduct.size)?.label || viewingProduct.size]] : []),
                  ...(viewingProduct.color ? [['Color', COLOR_CHOICES.find(c => c.value === viewingProduct.color)?.label || viewingProduct.color]] : []),
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                    <p className="text-gray-900 mt-0.5 font-medium">{String(val)}</p>
                  </div>
                ))}
              </div>

              {viewingProduct.additional_information && (
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Additional Information</span>
                  <p className="text-gray-700 mt-0.5 text-sm whitespace-pre-wrap">{viewingProduct.additional_information}</p>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</span>
                <div className="text-gray-700 mt-0.5 text-sm" dangerouslySetInnerHTML={{ __html: viewingProduct.description }} />
              </div>

              {/* Stock update inline */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Stock:</span>
                {editingStock.id === viewingProduct.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editingStock.value}
                      onChange={e => setEditingStock({ ...editingStock, value: e.target.value })}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-vermilion"
                    />
                    <button onClick={() => handleUpdateStock(viewingProduct.id)} disabled={isUpdatingStock} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      {isUpdatingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setEditingStock({ id: null, value: '' })} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><X className="h-4 w-4 text-gray-500" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{viewingProduct.stock}</span>
                    <button onClick={() => setEditingStock({ id: viewingProduct.id, value: viewingProduct.stock.toString() })} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition">Update</button>
                  </div>
                )}
              </div>
              {stockUpdateError && <p className="text-red-600 text-xs">{stockUpdateError}</p>}
              {stockUpdateSuccess && <p className="text-green-600 text-xs">{stockUpdateSuccess}</p>}

              {/* Inventory metrics */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-vermilion" /> Inventory Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Avg Daily Demand', viewingProduct.avg_daily_demand?.toFixed(2) || 'N/A'],
                    ['Safety Stock', viewingProduct.safety_stock || 'N/A'],
                    ['Reorder Point', viewingProduct.reorder_point || 'N/A'],
                    ['Reorder Quantity', viewingProduct.reorder_quantity || 'N/A'],
                  ].map(([label, val]) => (
                    <div key={String(label)}>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                      <p className="font-medium text-gray-900 mt-0.5">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status: </span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${viewingProduct.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {viewingProduct.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Images */}
              {viewingProduct.images?.length > 0 && (
                <div className="border-t border-gray-100 pt-5">
                  <h4 className="text-sm font-semibold text-ink mb-3">Product Images</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingProduct.images.map(img => (
                      <img key={img.id} src={img.image} alt={img.alt_text || 'Product'} className="w-full h-24 object-cover rounded-lg border border-gray-100" />
                    ))}
                  </div>
                </div>
              )}

              {/* Push to marketplace */}
              <div className="border-t border-gray-100 pt-5">
                <button
                  onClick={() => { handleCreateMarketplaceProduct(viewingProduct.id); setViewingProduct(null); }}
                  disabled={creatingMarketplaceProductId === viewingProduct.id || !viewingProduct.is_active}
                  className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${!viewingProduct.is_active ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {creatingMarketplaceProductId === viewingProduct.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create Marketplace Product</>}
                </button>
                {!viewingProduct.is_active && <p className="text-xs text-gray-400 mt-2 text-center">Product must be active to create marketplace listing.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Form Modal ── */}
      {formVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => { setFormVisible(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
              {errorMessages.general && <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm">{errorMessages.general[0]}</div>}

              {/* Producer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producer <span className="text-vermilion">*</span></label>
                <select
                  value={formData.producer}
                  onChange={e => setFormData({ ...formData, producer: e.target.value })}
                  required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.producer ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select Producer ({producers.length} available)</option>
                  {producers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errorMessages.producer && <p className="text-red-600 text-xs mt-1">{errorMessages.producer[0]}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-vermilion">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.name ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.name && <p className="text-red-600 text-xs mt-1">{errorMessages.name[0]}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-vermilion">*</span></label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.category ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errorMessages.category && <p className="text-red-600 text-xs mt-1">{errorMessages.category[0]}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-vermilion">*</span></label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={4} placeholder="Product description..."
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none ${errorMessages.description ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.description && <p className="text-red-600 text-xs mt-1">{errorMessages.description[0]}</p>}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition" />
                {errorMessages.sku && <p className="text-red-600 text-xs mt-1">{errorMessages.sku[0]}</p>}
              </div>

              {/* Price / Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-vermilion">*</span></label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.price ? 'border-red-400' : 'border-gray-300'}`} />
                  {errorMessages.price && <p className="text-red-600 text-xs mt-1">{errorMessages.price[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price <span className="text-vermilion">*</span></label>
                  <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} required
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.cost_price ? 'border-red-400' : 'border-gray-300'}`} />
                  {errorMessages.cost_price && <p className="text-red-600 text-xs mt-1">{errorMessages.cost_price[0]}</p>}
                </div>
              </div>

              {/* Stock / Reorder */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity <span className="text-vermilion">*</span></label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.stock ? 'border-red-400' : 'border-gray-300'}`} />
                  {errorMessages.stock && <p className="text-red-600 text-xs mt-1">{errorMessages.stock[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" value={formData.reorder_level} onChange={e => setFormData({ ...formData, reorder_level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition" />
                </div>
              </div>

              {/* Size / Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition">
                    <option value="">Select Size</option>
                    {SIZE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition">
                    <option value="">Select Color</option>
                    {COLOR_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                <textarea value={formData.additional_information} onChange={e => setFormData({ ...formData, additional_information: e.target.value })} rows={3}
                  placeholder="Enter any additional product information..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none" />
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-vermilion border-gray-300 rounded focus:ring-vermilion" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Existing Images</label>
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map(img => (
                      <div key={img.id} className="relative group">
                        <img src={img.image} alt={img.alt_text || 'Product'} className="w-full h-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => { setDeletedImages([...deletedImages, img.id]); setExistingImages(existingImages.filter(i => i.id !== img.id)); }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                <input type="file" multiple onChange={e => setImages(e.target.files)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-red-50 file:text-vermilion hover:file:bg-red-100 transition" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setFormVisible(false); resetForm(); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red text-sm font-medium transition-colors">
                  {editingProductId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Discount Modal ── */}
      {discountModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">Manage Discount</h3>
              <button onClick={closeDiscountModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            {selectedProductForDiscount && <p className="text-sm text-gray-500 mb-5">{selectedProductForDiscount.name}</p>}

            {discountLoading && !discountInfo ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm"><Loader2 className="h-5 w-5 animate-spin text-vermilion" /> Loading discount info...</div>
            ) : (
              <div className="space-y-4">
                {discountInfo && discountInfo.discount_percentage > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Current discount: <strong>{discountInfo.discount_percentage}%</strong></p>
                      {discountInfo.discounted_price && <p className="mt-0.5">Discounted price: <strong>¥{discountInfo.discounted_price.toLocaleString()}</strong></p>}
                    </div>
                  </div>
                )}
                {discountError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />{discountError}
                  </div>
                )}
                {discountSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />{discountSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={discountPercentage}
                    onChange={e => setDiscountPercentage(e.target.value)}
                    placeholder="Enter discount percentage"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
                  />
                  {discountPercentage && !isNaN(parseFloat(discountPercentage)) && selectedProductForDiscount && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                      <p>Original: <strong>¥{selectedProductForDiscount.price.toLocaleString()}</strong></p>
                      <p>Savings: <strong>¥{(selectedProductForDiscount.price * parseFloat(discountPercentage) / 100).toFixed(2)}</strong></p>
                      <p>Final: <strong>¥{(selectedProductForDiscount.price * (1 - parseFloat(discountPercentage) / 100)).toFixed(2)}</strong></p>
                    </div>
                  )}
                  {discountPercentage && parseFloat(discountPercentage) > 50 && parseFloat(discountPercentage) < 100 && (
                    <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                      ⚠️ High discount ({parseFloat(discountPercentage).toFixed(2)}%). Verify before applying.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button onClick={closeDiscountModal} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">Cancel</button>
                  <button
                    onClick={handleApplyDiscount}
                    disabled={discountLoading || !discountPercentage}
                    className="flex-1 px-4 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red disabled:bg-gray-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {discountLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Applying...</> : 'Apply Discount'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
