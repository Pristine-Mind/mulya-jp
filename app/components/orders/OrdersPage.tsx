'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import { Plus, Download, Printer, X, Loader2, ArrowLeft, Search } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Customer { id: number; name: string }
interface Product  { id: number; name: string; price: number }

interface Order {
  id: number;
  order_number: string;
  customer_details: Customer;
  product_details: Product;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
  delivery_date?: string;
  payment_due_date?: string;
  notes?: string;
}

const STATUS_TABS = [
  { id: 'all',       label: 'All Orders',  status: null },
  { id: 'pending',   label: 'Pending',     status: 'pending' },
  { id: 'shipped',   label: 'Shipped',     status: 'shipped' },
  { id: 'delivered', label: 'Delivered',   status: 'delivered' },
  { id: 'cancelled', label: 'Cancelled',   status: 'cancelled' },
] as const;

const emptyForm = {
  customer: '',
  product: '',
  quantity: 1,
  status: 'pending',
  notes: '',
};

// ── Component ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<number | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizeStatus = (status: string) => status?.toLowerCase().trim();

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (searchQuery)            params.search   = searchQuery;
      if (filterCustomer !== 'all') params.customer = filterCustomer;
      if (filterProduct  !== 'all') params.product  = filterProduct;
      if (filterStatus   !== 'all') params.status   = filterStatus;

      const res = await axios.get(`${apiBase}/api/v1/orders/`, {
        headers: authHeaders(),
        params,
      });
      setOrders(res.data.results.map((o: Order) => ({ ...o, status: normalizeStatus(o.status) })));
      setTotalCount(res.data.count);
    } catch {
      setError('Error fetching orders.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/customers/`, { headers: authHeaders() });
      setCustomers(res.data.results);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/products/`, { headers: authHeaders() });
      setProducts(res.data.results);
    } catch {}
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [offset, searchQuery, filterCustomer, filterProduct, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      setError('Customer and product are required.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await axios.post(`${apiBase}/api/v1/orders/`, {
        ...formData,
        customer: parseInt(formData.customer),
        product:  parseInt(formData.product),
        status:   normalizeStatus(formData.status),
      }, { headers: authHeaders() });
      setSuccess('Order added successfully.');
      setError('');
      setFormData(emptyForm);
      setFormVisible(false);
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to add order.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await axios.post(
        `${apiBase}/api/v1/orders/${orderId}/update_status/`,
        { status: normalizeStatus(newStatus) },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() } }
      );
      setSuccess('Status updated successfully.');
      await fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/export/orders/`, {
        responseType: 'blob',
        headers: authHeaders(),
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (isAxiosError(err)) {
        console.error('Export error:', err.response?.data);
      }
      setError('Error exporting orders.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (normalizeStatus(currentStatus)) {
      case 'pending':  return [{ value: 'approved',  label: 'Approve' }, { value: 'cancelled', label: 'Cancel' }];
      case 'approved': return [{ value: 'shipped',   label: 'Mark as Shipped' }, { value: 'cancelled', label: 'Cancel' }];
      case 'shipped':  return [{ value: 'delivered', label: 'Mark as Delivered' }, { value: 'cancelled', label: 'Cancel' }];
      default:         return [];
    }
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const unitPrice = (order.total_price / order.quantity).toFixed(2);
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Order #${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .order-info { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .text-right { text-align: right; }
    .mt-20 { margin-top: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Receipt</h1>
    <p>${new Date().toLocaleDateString()}</p>
  </div>
  <div class="order-info">
    <p><strong>Order Number:</strong> ${order.order_number}</p>
    <p><strong>Customer:</strong> ${order.customer_details.name}</p>
    <p><strong>Order Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
  </div>
  <table>
    <thead>
      <tr><th>Product</th><th>Quantity</th><th class="text-right">Price</th><th class="text-right">Total</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${order.product_details.name}</td>
        <td>${order.quantity}</td>
        <td class="text-right">¥${unitPrice}</td>
        <td class="text-right">¥${order.total_price.toFixed(2)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="text-right"><strong>Grand Total:</strong></td>
        <td class="text-right"><strong>¥${order.total_price.toFixed(2)}</strong></td>
      </tr>
    </tfoot>
  </table>
  <div class="mt-20"><p>Thank you for your order!</p></div>
  <div class="no-print" style="margin-top:20px;text-align:center;">
    <button onclick="window.print()" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Print Receipt</button>
    <button onclick="window.close()" style="margin-left:10px;padding:8px 16px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>`);
    printWindow.document.close();
  };

  // ── Colour helpers ────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'pending':   return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'approved':  return 'bg-blue-100 text-blue-700';
      case 'shipped':   return 'bg-indigo-100 text-indigo-700';
      default:          return 'bg-gray-100 text-gray-600';
    }
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track all customer orders</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setFormData(emptyForm); setError(''); setFormVisible(true); }}
            className="flex items-center gap-2 bg-vermilion text-white px-4 py-2.5 rounded-lg hover:bg-deep-red transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Order
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1 sm:gap-6 overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const count = tab.status
              ? orders.filter(o => normalizeStatus(o.status) === tab.status).length
              : orders.length;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveStatusTab(tab.id);
                  setFilterStatus(tab.status ?? 'all');
                  setOffset(0);
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeStatusTab === tab.id
                    ? 'border-vermilion text-vermilion'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeStatusTab === tab.id
                    ? tab.id === 'pending'   ? 'bg-yellow-100 text-yellow-600' :
                      tab.id === 'shipped'   ? 'bg-blue-100 text-blue-600' :
                      tab.id === 'delivered' ? 'bg-green-100 text-green-600' :
                      tab.id === 'cancelled' ? 'bg-red-100 text-red-600' :
                                              'bg-red-50 text-vermilion'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {error   && <p className="text-red-600 mb-4 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 mb-4 text-sm text-center">{success}</p>}

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters &amp; Search</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setOffset(0); }}
              placeholder="Search by order number..."
              className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <select
            value={filterCustomer}
            onChange={e => { setFilterCustomer(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setOffset(0); }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
          >
            <option value="all">All Customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterProduct}
            onChange={e => { setFilterProduct(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setOffset(0); }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
          >
            <option value="all">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setOffset(0); }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-14 gap-3 text-gray-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-vermilion" /> Loading orders...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-ink text-white text-xs uppercase">
                {['Order #', 'Customer', 'Product', 'Quantity', 'Total Price', 'Status', 'Order Date', 'Delivery Date', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-left font-semibold tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length > 0 ? orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{order.order_number}</td>
                  <td className="py-3 px-4 text-gray-700">{order.customer_details.name}</td>
                  <td className="py-3 px-4 text-gray-700">{order.product_details.name}</td>
                  <td className="py-3 px-4">{order.quantity}</td>
                  <td className="py-3 px-4 whitespace-nowrap">¥{order.total_price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </button>
                      {getNextStatusOptions(order.status).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {getNextStatusOptions(order.status).map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusUpdate(order.id, option.value)}
                              disabled={updatingStatus === order.id}
                              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                option.value === 'cancelled'
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingStatus === order.id
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Updating…</>
                                : option.label
                              }
                            </button>
                          ))}
                        </div>
                      )}
                      {getNextStatusOptions(order.status).length === 0 && (
                        <span className="text-xs text-gray-400">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-gray-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOffset(o => Math.max(o - limit, 0))}
          disabled={offset === 0 || isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            offset === 0 || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-500">
          Showing {Math.min(offset + 1, totalCount)}–{Math.min(offset + limit, totalCount)} of {totalCount} orders
        </span>
        <button
          onClick={() => setOffset(o => o + limit)}
          disabled={offset + limit >= totalCount || isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            offset + limit >= totalCount || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-vermilion text-white hover:bg-deep-red'
          }`}
        >
          Next
        </button>
      </div>

      {/* ── Add Order Modal ── */}
      {formVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">Add New Order</h3>
              <button onClick={() => setFormVisible(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error   && <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
              {success && <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded text-sm">{success}</div>}

              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer <span className="text-vermilion">*</span></label>
                <select name="customer" value={formData.customer} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition">
                  <option value="">Select a customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product <span className="text-vermilion">*</span></label>
                <select name="product" value={formData.product} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition">
                  <option value="">Select a product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-vermilion">*</span></label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-vermilion">*</span></label>
                <select name="status" value={formData.status} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setFormVisible(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red text-sm font-medium transition-colors">
                  Add Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
