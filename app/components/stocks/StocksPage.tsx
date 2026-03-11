'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductDetails {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: string;
  cost_price: string;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  producer: number;
}

interface StockListItem {
  product: number;
  moved_date: string;
  product_details: ProductDetails;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StocksPage() {
  const router = useRouter();

  const [stockItems, setStockItems]     = useState<StockListItem[]>([]);
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(0);
  const [pushedProducts, setPushedProducts] = useState<number[]>([]);
  const [loading, setLoading]           = useState(false);
  const [pushError, setPushError]       = useState('');
  const itemsPerPage = 20;

  const fetchStockItems = async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/v1/stocklist/`, {
        params: { limit: itemsPerPage, offset: (page - 1) * itemsPerPage },
        headers: authHeaders(),
      });
      setStockItems(res.data.results);
      setTotalPages(Math.ceil(res.data.count / itemsPerPage));
    } catch (err) {
      console.error('Error fetching stock items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStockItems(currentPage); }, [currentPage]);

  const handlePushToMarketplace = async (productId: number) => {
    setPushError('');
    try {
      const res = await axios.post(
        `${apiBase}/api/v1/stocklist/${productId}/push-to-marketplace/`,
        {},
        { headers: authHeaders() }
      );
      if (res.status === 200 || res.status === 201) {
        setPushedProducts(prev => [...prev, productId]);
        fetchStockItems(currentPage);
      }
    } catch (err) {
      console.error(`Error pushing product ${productId} to marketplace`, err);
      setPushError(`Failed to push product #${productId} to marketplace.`);
      setTimeout(() => setPushError(''), 4000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Stock Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and push stock items to marketplace</p>
        </div>
      </div>

      {pushError && (
        <p className="text-red-600 text-sm text-center mb-4">{pushError}</p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-vermilion" /> Loading stocks…
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-ink text-white text-xs uppercase">
                {['Product Name', 'Moved Date', 'Stock Quantity', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-6 font-semibold tracking-wide whitespace-nowrap ${h === 'Actions' ? 'text-center' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockItems.length > 0 ? stockItems.map(item => (
                <tr key={item.product} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {item.product_details.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900 font-medium">{item.product_details.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(item.moved_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${
                      item.product_details.stock <= item.product_details.reorder_level
                        ? 'text-red-600'
                        : 'text-gray-800'
                    }`}>
                      {item.product_details.stock}
                    </span>
                    {item.product_details.stock <= item.product_details.reorder_level && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Low</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handlePushToMarketplace(item.product)}
                      disabled={pushedProducts.includes(item.product)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pushedProducts.includes(item.product)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {pushedProducts.includes(item.product) ? 'Pushed' : 'Push to Marketplace'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-gray-400">No stock items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
