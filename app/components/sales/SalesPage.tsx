'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import {
  Plus, Download, Printer, Truck, MapPin, X, ArrowLeft, Loader2,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Customer { id: number; name: string }
interface Product  { id: number; name: string; price: number }
interface Order    { id: number; order_number: string }

interface OrderDetails {
  id: number;
  order_number: string;
  customer_details: Customer;
  product_details: Product;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
}

interface Sale {
  id: number;
  quantity: number | null;
  sale_price: number | null;
  payment_status: string | null;
  payment_status_display: string | null;
  payment_due_date: string | null;
  order: number | null;
  order_details?: OrderDetails;
}

interface DeliveryInfoRequest {
  customer_name: string;
  customer_email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  delivery_instructions: string;
}

interface DeliveryTrackingResponse {
  id: number;
  tracking_number?: string;
  delivery_status: string;
  customer_name: string;
  phone_number: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  additional_instructions?: string;
  delivery_source?: string;
  total_items?: number;
  total_value: number;
  product_details?: { name: string; quantity: number }[];
  delivery_person_name?: string;
  delivery_person_phone?: string;
  delivery_service?: string;
  created_at: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
}

// ── Inline API helpers ────────────────────────────────────────────────────────
async function checkSaleDelivery(saleId: number): Promise<DeliveryTrackingResponse | null> {
  try {
    const res = await axios.get(`${apiBase}/api/v1/sales/${saleId}/delivery/`, { headers: authHeaders() });
    return res.data;
  } catch {
    return null;
  }
}

async function createDeliveryFromSale(data: {
  sale_id: number;
  customer_name: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  additional_instructions: string;
}): Promise<void> {
  await axios.post(`${apiBase}/api/v1/deliveries/from-sale/`, data, { headers: authHeaders() });
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pending' },
  { value: 'approved',  label: 'Approved' },
  { value: 'shipped',   label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const emptyForm = {
  quantity: '',
  sale_price: '',
  payment_status: 'pending',
  payment_method: 'cash',
  payment_due_date: '',
  order: '',
};

const emptyDelivery: DeliveryInfoRequest = {
  customer_name: '',
  customer_email: '',
  phone_number: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  latitude: 27.7172,
  longitude: 85.3240,
  delivery_instructions: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delivery form
  const [deliveryFormVisible, setDeliveryFormVisible] = useState(false);
  const [selectedSaleForDelivery, setSelectedSaleForDelivery] = useState<Sale | null>(null);
  const [deliveryFormData, setDeliveryFormData] = useState<DeliveryInfoRequest>(emptyDelivery);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  // Tracking
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingData, setTrackingData] = useState<DeliveryTrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [salesWithDelivery, setSalesWithDelivery] = useState<Set<number>>(new Set());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSales = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/sales/`, {
        params: { limit, offset },
        headers: authHeaders(),
      });
      setSales(res.data.results);
      setTotalCount(res.data.count);
      checkDeliveryStatusForSales(res.data.results);
    } catch {
      // silently ignore
    }
  };

  const checkDeliveryStatusForSales = async (salesList: Sale[]) => {
    const results = await Promise.all(
      salesList.map(async sale => {
        const info = await checkSaleDelivery(sale.id);
        return info ? sale.id : null;
      })
    );
    setSalesWithDelivery(new Set(results.filter((id): id is number => id !== null)));
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/orders/`, { headers: authHeaders() });
      setOrders(res.data.results);
    } catch {}
  };

  useEffect(() => {
    fetchSales();
    fetchOrders();
  }, [offset]);

  // ── Handlers: sale form ───────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${apiBase}/api/v1/sales/`, formData, { headers: authHeaders() });
      setSuccess('Sale added successfully.');
      setError('');
      setFormData(emptyForm);
      setFormVisible(false);
      fetchSales();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to add sale.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // ── Handlers: export / print ──────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/export/sales/`, {
        responseType: 'blob',
        headers: authHeaders(),
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (isAxiosError(err)) console.error('Export error:', err.response?.data);
      setError('Error exporting sales.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePrintSale = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qty = sale.quantity ?? 0;
    const price = sale.sale_price ?? 0;
    const total = (qty * price).toFixed(2);

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Sale Invoice #${sale.id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { text-align: center; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #000; padding: 8px; }
    th { background-color: #f2f2f2; }
    .text-right { text-align: right; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header"><h1>Sale Invoice</h1><p>${new Date().toLocaleDateString()}</p></div>
  <div>
    <p><strong>Sale ID:</strong> ${sale.id}</p>
    ${sale.order_details
      ? `<p><strong>Order Number:</strong> ${sale.order_details.order_number}</p>
         <p><strong>Customer:</strong> ${sale.order_details.customer_details.name}</p>
         <p><strong>Product:</strong> ${sale.order_details.product_details.name}</p>
         <p><strong>Order Date:</strong> ${new Date(sale.order_details.order_date).toLocaleDateString()}</p>`
      : `<p><strong>Order:</strong> ${sale.order}</p>`}
    <p><strong>Payment Status:</strong> ${sale.payment_status_display}</p>
    ${sale.payment_due_date ? `<p><strong>Payment Due:</strong> ${new Date(sale.payment_due_date).toLocaleDateString()}</p>` : ''}
  </div>
  <table>
    <thead><tr><th>Description</th><th>Quantity</th><th class="text-right">Unit Price</th><th class="text-right">Total</th></tr></thead>
    <tbody>
      <tr>
        <td>${sale.order_details ? sale.order_details.product_details.name : 'Sale Item'}</td>
        <td>${qty}</td>
        <td class="text-right">¥${price.toFixed(2)}</td>
        <td class="text-right">¥${total}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td colspan="3" class="text-right"><strong>Grand Total:</strong></td><td class="text-right"><strong>¥${total}</strong></td></tr>
    </tfoot>
  </table>
  <p>Thank you for your business!</p>
  <div style="margin-top:20px;text-align:center;">
    <button onclick="window.print()" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Print Invoice</button>
    <button onclick="window.close()" style="margin-left:10px;padding:8px 16px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},500);};</script>
</body>
</html>`);
    printWindow.document.close();
  };

  // ── Handlers: delivery ────────────────────────────────────────────────────
  const handlePlaceForDelivery = (sale: Sale) => {
    setSelectedSaleForDelivery(sale);
    setDeliveryFormData(emptyDelivery);
    setDeliveryError('');
    setDeliverySuccess('');
    setDeliveryFormVisible(true);
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDeliveryFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForDelivery) return;
    setDeliveryLoading(true);
    setDeliveryError('');
    try {
      await createDeliveryFromSale({
        sale_id: selectedSaleForDelivery.id,
        customer_name: deliveryFormData.customer_name,
        phone_number: deliveryFormData.phone_number,
        email: deliveryFormData.customer_email,
        address: deliveryFormData.address,
        city: deliveryFormData.city,
        state: deliveryFormData.state,
        zip_code: deliveryFormData.zip_code,
        latitude: deliveryFormData.latitude,
        longitude: deliveryFormData.longitude,
        additional_instructions: deliveryFormData.delivery_instructions,
      });
      setDeliverySuccess('Delivery order created successfully.');
      setDeliveryFormVisible(false);
      setSalesWithDelivery(prev => new Set([...prev, selectedSaleForDelivery.id]));
      setSelectedSaleForDelivery(null);
      fetchSales();
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : 'Failed to create delivery order.');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const closeDeliveryForm = () => {
    setDeliveryFormVisible(false);
    setSelectedSaleForDelivery(null);
    setDeliveryError('');
    setDeliverySuccess('');
  };

  // ── Handlers: tracking ────────────────────────────────────────────────────
  const handleTrackDelivery = async (sale: Sale) => {
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const info = await checkSaleDelivery(sale.id);
      if (info) {
        setTrackingData(info);
        setTrackingModalVisible(true);
      } else {
        setTrackingError('No delivery found for this sale.');
      }
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : 'Failed to track delivery.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setTrackingModalVisible(false);
    setTrackingData(null);
    setTrackingError('');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusBadge = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'approved':  return 'bg-blue-100 text-blue-700';
      case 'shipped':   return 'bg-indigo-100 text-indigo-700';
      default:          return 'bg-gray-100 text-gray-600';
    }
  };

  const deliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':  return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'picked_up':  return 'bg-yellow-100 text-yellow-700';
      case 'pending':    return 'bg-orange-100 text-orange-700';
      default:           return 'bg-gray-100 text-gray-600';
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Sales</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage sales and delivery orders</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setFormData(emptyForm); setError(''); setFormVisible(true); }}
            className="flex items-center gap-2 bg-vermilion text-white px-4 py-2.5 rounded-lg hover:bg-deep-red transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Sale
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {error   && <p className="text-red-600 mb-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mb-4 text-sm text-center">{success}</p>}
      {deliverySuccess && <p className="text-green-600 mb-4 text-sm text-center">{deliverySuccess}</p>}
      {trackingError && !trackingModalVisible && <p className="text-red-600 mb-4 text-sm text-center">{trackingError}</p>}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-ink text-white text-xs uppercase">
              {['Order', 'Quantity', 'Sale Price', 'Payment Status', 'Payment Due Date', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4 text-left font-semibold tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length > 0 ? sales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-700">{sale.order}</td>
                <td className="py-3 px-4">{sale.quantity}</td>
                <td className="py-3 px-4 whitespace-nowrap">¥{sale.sale_price?.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(sale.payment_status)}`}>
                    {sale.payment_status_display}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {sale.payment_due_date
                    ? new Date(sale.payment_due_date).toLocaleDateString()
                    : '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handlePrintSale(sale)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      <Printer className="h-3 w-3" /> Print
                    </button>
                    {salesWithDelivery.has(sale.id) ? (
                      <button
                        onClick={() => handleTrackDelivery(sale)}
                        disabled={trackingLoading}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {trackingLoading
                          ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading…</>
                          : <><MapPin className="h-3 w-3" /> Track Delivery</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlaceForDelivery(sale)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        <Truck className="h-3 w-3" /> Place for Delivery
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-400">No sales found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setOffset(o => Math.max(o - limit, 0))}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            offset === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Showing {Math.min(offset + 1, totalCount)}–{Math.min(offset + limit, totalCount)} of {totalCount} sales
        </span>
        <button
          onClick={() => setOffset(o => o + limit)}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            offset + limit >= totalCount ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
          }`}
        >
          Next
        </button>
      </div>

      {/* ── Add Sale Modal ── */}
      {formVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">Add New Sale</h3>
              <button onClick={() => setFormVisible(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error   && <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
              {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded text-sm">{success}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order <span className="text-vermilion">*</span></label>
                <select name="order" value={formData.order} onChange={handleChange} required className={inputCls}>
                  <option value="">Select an order</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-vermilion">*</span></label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price <span className="text-vermilion">*</span></label>
                <input type="number" name="sale_price" value={formData.sale_price} onChange={handleChange} required min="0" step="0.01" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status <span className="text-vermilion">*</span></label>
                <select name="payment_status" value={formData.payment_status} onChange={handleChange} required className={inputCls}>
                  {PAYMENT_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date <span className="text-vermilion">*</span></label>
                <input type="date" name="payment_due_date" value={formData.payment_due_date} onChange={handleChange} required className={inputCls} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setFormVisible(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red text-sm font-medium transition-colors">
                  Add Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delivery Form Modal ── */}
      {deliveryFormVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">
                Create Delivery Order
                {selectedSaleForDelivery && (
                  <span className="text-sm font-normal text-gray-500 ml-2">(Sale #{selectedSaleForDelivery.id})</span>
                )}
              </h3>
              <button onClick={closeDeliveryForm} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-6">
              {deliveryError   && <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm">{deliveryError}</div>}
              {deliverySuccess && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded text-sm">{deliverySuccess}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-vermilion">*</span></label>
                    <input type="text" name="customer_name" value={deliveryFormData.customer_name} onChange={handleDeliveryChange} required placeholder="Customer full name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-vermilion">*</span></label>
                    <input type="tel" name="phone_number" value={deliveryFormData.phone_number} onChange={handleDeliveryChange} required placeholder="Customer phone" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="customer_email" value={deliveryFormData.customer_email} onChange={handleDeliveryChange} placeholder="customer@example.com" className={inputCls} />
                  </div>
                </div>

                {/* Address info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-vermilion">*</span></label>
                    <textarea name="address" value={deliveryFormData.address} onChange={handleDeliveryChange} required rows={2} placeholder="Enter delivery address" className={`${inputCls} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-vermilion">*</span></label>
                      <input type="text" name="city" value={deliveryFormData.city} onChange={handleDeliveryChange} required placeholder="City" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-vermilion">*</span></label>
                      <input type="text" name="state" value={deliveryFormData.state} onChange={handleDeliveryChange} required placeholder="State" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code <span className="text-vermilion">*</span></label>
                    <input type="text" name="zip_code" value={deliveryFormData.zip_code} onChange={handleDeliveryChange} required placeholder="ZIP code" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Delivery Coordinates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input type="number" name="latitude" step="any" value={deliveryFormData.latitude}
                      onChange={e => setDeliveryFormData(p => ({ ...p, latitude: parseFloat(e.target.value) }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input type="number" name="longitude" step="any" value={deliveryFormData.longitude}
                      onChange={e => setDeliveryFormData(p => ({ ...p, longitude: parseFloat(e.target.value) }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Instructions</label>
                <textarea name="delivery_instructions" value={deliveryFormData.delivery_instructions} onChange={handleDeliveryChange}
                  rows={3} placeholder="Special delivery instructions (optional)" className={`${inputCls} resize-none`} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeDeliveryForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={deliveryLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {deliveryLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create Delivery Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tracking Modal ── */}
      {trackingModalVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">
                Delivery Tracking
                {trackingData && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (#{trackingData.tracking_number ?? trackingData.id})
                  </span>
                )}
              </h3>
              <button onClick={closeTrackingModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {trackingError && (
              <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm mb-4">{trackingError}</div>
            )}
            {trackingLoading && (
              <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-vermilion" /> Loading…
              </div>
            )}

            {trackingData && (
              <div className="space-y-5">
                {/* Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-800">Delivery Status</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${deliveryStatusBadge(trackingData.delivery_status)}`}>
                    {trackingData.delivery_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Customer & Delivery info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p className="font-semibold text-gray-700 flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Customer Information</p>
                    <p><span className="text-gray-500">Name:</span> <span className="text-gray-900 ml-1">{trackingData.customer_name}</span></p>
                    <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900 ml-1">{trackingData.phone_number}</span></p>
                    {trackingData.email?.trim() && (
                      <p><span className="text-gray-500">Email:</span> <span className="text-gray-900 ml-1">{trackingData.email}</span></p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p className="font-semibold text-gray-700">Delivery Address</p>
                    <p className="text-gray-900">{trackingData.address}</p>
                    <p className="text-gray-900">{trackingData.city}, {trackingData.state} {trackingData.zip_code}</p>
                    {trackingData.additional_instructions?.trim() && (
                      <p><span className="text-gray-500">Notes:</span> <span className="text-gray-900 ml-1">{trackingData.additional_instructions}</span></p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-gray-700 mb-3">Timeline</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-500">Order Created</p>
                      <p className="text-gray-900">{new Date(trackingData.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(trackingData.created_at).toLocaleTimeString()}</p>
                    </div>
                    {trackingData.estimated_delivery_date && (
                      <div>
                        <p className="text-gray-500">Estimated Delivery</p>
                        <p className="text-gray-900">{new Date(trackingData.estimated_delivery_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {trackingData.actual_delivery_date && (
                      <div>
                        <p className="text-gray-500">Delivered On</p>
                        <p className="text-green-700 font-medium">{new Date(trackingData.actual_delivery_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(trackingData.actual_delivery_date).toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order details */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-2">
                  <p className="font-semibold text-gray-700 mb-1">Order Details</p>
                  {trackingData.delivery_source && (
                    <p><span className="text-gray-500">Source:</span> <span className="text-gray-900 ml-1">{trackingData.delivery_source}</span></p>
                  )}
                  {trackingData.total_items != null && (
                    <p><span className="text-gray-500">Total Items:</span> <span className="text-gray-900 ml-1">{trackingData.total_items}</span></p>
                  )}
                  <p><span className="text-gray-500">Total Value:</span> <span className="font-semibold text-gray-900 ml-1">¥{trackingData.total_value.toFixed(2)}</span></p>
                  {trackingData.product_details && trackingData.product_details.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Products:</p>
                      <div className="bg-white rounded-lg p-2 space-y-1">
                        {trackingData.product_details.map((p, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span>{p.name}</span>
                            <span className="text-gray-500">Qty: {p.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trackingData.tracking_number && (
                    <p><span className="text-gray-500">Tracking #:</span> <code className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{trackingData.tracking_number}</code></p>
                  )}
                </div>

                {/* Delivery person */}
                {(trackingData.delivery_person_name || trackingData.delivery_person_phone) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-semibold text-gray-700 mb-1">Delivery Person</p>
                    {trackingData.delivery_person_name && (
                      <p><span className="text-gray-500">Name:</span> <span className="text-gray-900 ml-1">{trackingData.delivery_person_name}</span></p>
                    )}
                    {trackingData.delivery_person_phone && (
                      <p><span className="text-gray-500">Contact:</span> <span className="text-gray-900 ml-1">{trackingData.delivery_person_phone}</span></p>
                    )}
                    {trackingData.delivery_service && (
                      <p><span className="text-gray-500">Service:</span> <span className="text-gray-900 ml-1">{trackingData.delivery_service}</span></p>
                    )}
                  </div>
                )}

                {/* Location */}
                {trackingData.latitude != null && trackingData.longitude != null && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-semibold text-green-800 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> Exact Delivery Location
                    </p>
                    <p className="text-green-700">{trackingData.address}, {trackingData.city}, {trackingData.state}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Latitude</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">{trackingData.latitude.toFixed(8)}</code>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Longitude</p>
                        <code className="text-xs bg-white px-2 py-1 rounded border block">{trackingData.longitude.toFixed(8)}</code>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${trackingData.latitude},${trackingData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-blue-600 hover:underline text-xs font-medium"
                    >
                      <MapPin className="h-3 w-3" /> View on Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-5 mt-2 border-t border-gray-100">
              <button onClick={closeTrackingModal}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
