'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, ClipboardList, CheckCircle, XCircle, Truck, Loader2,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders(token: string) {
  return { Authorization: `Token ${token}` };
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductDetails {
  id: number;
  name: string;
  sku: string;
  price: string;
  category_details: string;
}

interface PurchaseOrder {
  id: number;
  quantity: number;
  approved: boolean;
  sent_to_vendor: boolean;
  created_at: string;
  product_details: ProductDetails;
}

// ── Component ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

export default function PurchaseOrdersPage() {
  const router = useRouter();

  const [orders, setOrders]   = useState<PurchaseOrder[]>([]);
  const [count, setCount]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) { setError('No authentication token found.'); setLoading(false); return; }
      try {
        const res = await axios.get(`${apiBase}/api/v1/purchase-orders/`, {
          params: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
          headers: authHeaders(token),
        });
        setOrders(res.data.results);
        setCount(res.data.count);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to fetch purchase orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and track incoming purchase orders</p>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm mb-6">
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400 text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-vermilion" /> Loading purchase orders…
        </div>
      )}

      {/* ── Cards grid ── */}
      {!loading && !error && (
        <>
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              No purchase orders found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {orders.map(order => {
                const statusLabel = order.approved ? 'Approved' : order.sent_to_vendor ? 'Pending' : 'Rejected';
                const statusCls   = order.approved
                  ? 'bg-green-100 text-green-700'
                  : order.sent_to_vendor
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-blue-500" />
                        <span className="font-bold text-gray-900">Order #{order.id}</span>
                      </div>
                      {order.approved ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-800">Product:</span> {order.product_details.name}</p>
                      <p><span className="font-medium text-gray-800">Category:</span> {order.product_details.category_details}</p>
                      <p><span className="font-medium text-gray-800">Quantity:</span> {order.quantity}</p>
                      <p><span className="font-medium text-gray-800">Price:</span> ¥{order.product_details.price}</p>
                      <p><span className="font-medium text-gray-800">Created:</span> {new Date(order.created_at).toLocaleString()}</p>
                    </div>

                    {/* Vendor row */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <span>{order.sent_to_vendor ? 'Sent to Vendor' : 'Not Sent'}</span>
                    </div>

                    {/* SKU */}
                    <p className="text-xs text-gray-400">SKU: {order.product_details.sku}</p>

                    {/* Status badge */}
                    <span className={`self-start px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
