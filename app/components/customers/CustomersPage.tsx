'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Plus, Download, Eye, Pencil, X, ArrowLeft, Loader2, Search } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Customer {
  id: number;
  name: string;
  email: string;
  contact: string;
  billing_address: string;
  shipping_address: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
}

interface CustomerSales { name: string; total_sales: number }
interface CustomerOrders { name: string; total_orders: number }

interface ErrorMessages {
  name?: string[];
  email?: string[];
  contact?: string[];
  billing_address?: string[];
  shipping_address?: string[];
  customer_type?: string[];
  credit_limit?: string[];
  current_balance?: string[];
  general?: string[];
}

const emptyForm = {
  name: '', email: '', contact: '',
  billing_address: '', shipping_address: '',
  customer_type: 'Retailer',
  credit_limit: 0, current_balance: 0,
};

// ── Component ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [topSalesCustomers, setTopSalesCustomers] = useState<CustomerSales[]>([]);
  const [topOrdersCustomers, setTopOrdersCustomers] = useState<CustomerOrders[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'top'>('all');
  const [formData, setFormData] = useState(emptyForm);
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/v1/customers/`, {
        params: { limit, offset, search: searchQuery },
        headers: authHeaders(),
      });
      setCustomers(res.data.results);
      setTotalCount(res.data.count);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchTopSales = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/customer/top-sales/`, { headers: authHeaders() });
      setTopSalesCustomers(res.data);
    } catch {}
  };

  const fetchTopOrders = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/v1/customer/top-orders/`, { headers: authHeaders() });
      setTopOrdersCustomers(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchCustomers();
    fetchTopSales();
    fetchTopOrders();
  }, [offset, searchQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessages({ ...errorMessages, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomerId) {
        await axios.patch(`${apiBase}/api/v1/customers/${editingCustomerId}/`, formData, { headers: authHeaders() });
        setSuccess('Customer updated successfully.');
      } else {
        await axios.post(`${apiBase}/api/v1/customers/`, formData, { headers: authHeaders() });
        setSuccess('Customer added successfully.');
      }
      setErrorMessages({});
      setFormData(emptyForm);
      setEditingCustomerId(null);
      setFormVisible(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: ['Failed to save customer.'] });
      } else {
        setErrorMessages({ general: ['Failed to save customer.'] });
      }
    }
  };

  const handleEditClick = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      contact: customer.contact,
      billing_address: customer.billing_address,
      shipping_address: customer.shipping_address,
      customer_type: customer.customer_type,
      credit_limit: customer.credit_limit,
      current_balance: customer.current_balance,
    });
    setEditingCustomerId(customer.id);
    setErrorMessages({});
    setFormVisible(true);
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/export/customers/`, {
        responseType: 'blob',
        headers: authHeaders(),
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      setErrorMessages({ general: ['Error exporting data.'] });
    }
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const pieColors = ['#C0392B', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const pieHover  = ['#922B21', '#2563EB', '#059669', '#D97706', '#7C3AED'];

  const salesChartData = {
    labels: topSalesCustomers.map(c => c.name),
    datasets: [{
      data: topSalesCustomers.map(c => c.total_sales),
      backgroundColor: pieColors,
      hoverBackgroundColor: pieHover,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  const ordersChartData = {
    labels: topOrdersCustomers.map(c => c.name),
    datasets: [{
      data: topOrdersCustomers.map(c => c.total_orders),
      backgroundColor: pieColors,
      hoverBackgroundColor: pieHover,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' as const },
      },
    },
    onClick: (_: unknown, elements: { index: number }[]) => {
      if (!elements.length) return;
      const idx = elements[0].index;
      const name = activeTab === 'top'
        ? topSalesCustomers[idx]?.name
        : topOrdersCustomers[idx]?.name;
      if (name) {
        const found = customers.find(c => c.name === name);
        if (found) setSelectedCustomer(found);
      }
    },
  };

  // ── Filtered table ────────────────────────────────────────────────────────
  const filteredCustomers = customers.filter(c => {
    if (activeTab === 'active') return c.current_balance >= 0;
    if (activeTab === 'inactive') return c.current_balance < 0;
    if (activeTab === 'top') return (
      topSalesCustomers.some(t => t.name === c.name) ||
      topOrdersCustomers.some(t => t.name === c.name)
    );
    return true;
  });

  const tabs = [
    { id: 'all',      label: 'All Customers',  count: customers.length },
    { id: 'active',   label: 'Active',          count: customers.filter(c => c.current_balance >= 0).length },
    { id: 'inactive', label: 'Inactive',        count: customers.filter(c => c.current_balance < 0).length },
    { id: 'top',      label: 'Top Performers',  count: topSalesCustomers.length },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Customer Management</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-1 sm:gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-vermilion text-vermilion'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-red-50 text-vermilion' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Pie charts (all / top tabs) ── */}
      {(activeTab === 'all' || activeTab === 'top') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold mb-4 text-ink">Top Customers by Sales</h3>
            <div className="h-72">
              {topSalesCustomers.length > 0
                ? <Pie data={salesChartData} options={chartOptions} />
                : <div className="h-full flex items-center justify-center text-sm text-gray-400">No sales data</div>
              }
            </div>
            <p className="mt-3 text-xs text-gray-400 text-center">Click chart segments to view details</p>
          </div>
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold mb-4 text-ink">Top Customers by Orders</h3>
            <div className="h-72">
              {topOrdersCustomers.length > 0
                ? <Pie data={ordersChartData} options={chartOptions} />
                : <div className="h-full flex items-center justify-center text-sm text-gray-400">No orders data</div>
              }
            </div>
            <p className="mt-3 text-xs text-gray-400 text-center">Click chart segments to view details</p>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setOffset(0); }}
            placeholder="Search by name..."
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setFormData(emptyForm); setEditingCustomerId(null); setErrorMessages({}); setFormVisible(true); }}
            className="flex items-center gap-2 bg-vermilion text-white px-4 py-2.5 rounded-lg hover:bg-deep-red transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-ink text-white text-xs uppercase">
              {['Customer Name', 'Email', 'Contact', 'Billing Address', 'Shipping Address', 'Type', 'Credit Limit', 'Balance', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4 text-left font-semibold tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-vermilion" /> Loading customers...
                  </div>
                </td>
              </tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{customer.name}</td>
                  <td className="py-3 px-4 text-gray-500">{customer.email}</td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{customer.contact}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{customer.billing_address}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{customer.shipping_address}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      customer.customer_type === 'Retailer'   ? 'bg-blue-100 text-blue-700' :
                      customer.customer_type === 'Wholesaler' ? 'bg-green-100 text-green-700' :
                                                                'bg-purple-100 text-purple-700'
                    }`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">¥{customer.credit_limit.toLocaleString()}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`font-medium ${customer.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ¥{customer.current_balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(customer)}
                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-gray-400">
                  {activeTab === 'all' ? 'No customers found.' : `No ${activeTab} customers found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between">
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
          Showing {Math.min(offset + 1, totalCount)}–{Math.min(offset + limit, totalCount)} of {totalCount} customers
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

      {/* ── View Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">{selectedCustomer.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 text-sm">
              {[
                ['Email', selectedCustomer.email],
                ['Contact', selectedCustomer.contact],
                ['Billing Address', selectedCustomer.billing_address],
                ['Shipping Address', selectedCustomer.shipping_address],
                ['Customer Type', selectedCustomer.customer_type],
                ['Credit Limit', `¥${selectedCustomer.credit_limit.toLocaleString()}`],
                ['Current Balance', `¥${selectedCustomer.current_balance.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex py-3 gap-4">
                  <span className="font-medium text-gray-500 w-36 flex-shrink-0">{label}</span>
                  <span className="text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => setSelectedCustomer(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {formVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">
                {editingCustomerId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setFormVisible(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessages.general && (
                <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded text-sm">
                  {errorMessages.general[0]}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded text-sm">
                  {success}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-vermilion">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.name ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.name && <p className="text-red-600 text-xs mt-1">{errorMessages.name[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-vermilion">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.email ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.email && <p className="text-red-600 text-xs mt-1">{errorMessages.email[0]}</p>}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact <span className="text-vermilion">*</span></label>
                <input type="text" name="contact" value={formData.contact} onChange={handleChange} required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.contact ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.contact && <p className="text-red-600 text-xs mt-1">{errorMessages.contact[0]}</p>}
              </div>

              {/* Billing Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address <span className="text-vermilion">*</span></label>
                <textarea name="billing_address" value={formData.billing_address} onChange={handleChange} required rows={2}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none ${errorMessages.billing_address ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.billing_address && <p className="text-red-600 text-xs mt-1">{errorMessages.billing_address[0]}</p>}
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address <span className="text-vermilion">*</span></label>
                <textarea name="shipping_address" value={formData.shipping_address} onChange={handleChange} required rows={2}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none ${errorMessages.shipping_address ? 'border-red-400' : 'border-gray-300'}`} />
                {errorMessages.shipping_address && <p className="text-red-600 text-xs mt-1">{errorMessages.shipping_address[0]}</p>}
              </div>

              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type <span className="text-vermilion">*</span></label>
                <select name="customer_type" value={formData.customer_type} onChange={handleChange} required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.customer_type ? 'border-red-400' : 'border-gray-300'}`}>
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Distributor">Distributor</option>
                </select>
                {errorMessages.customer_type && <p className="text-red-600 text-xs mt-1">{errorMessages.customer_type[0]}</p>}
              </div>

              {/* Credit Limit / Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit <span className="text-vermilion">*</span></label>
                  <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleChange} required min="0" step="0.01"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.credit_limit ? 'border-red-400' : 'border-gray-300'}`} />
                  {errorMessages.credit_limit && <p className="text-red-600 text-xs mt-1">{errorMessages.credit_limit[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance <span className="text-vermilion">*</span></label>
                  <input type="number" name="current_balance" value={formData.current_balance} onChange={handleChange} required step="0.01"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${errorMessages.current_balance ? 'border-red-400' : 'border-gray-300'}`} />
                  {errorMessages.current_balance && <p className="text-red-600 text-xs mt-1">{errorMessages.current_balance[0]}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setFormVisible(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red text-sm font-medium transition-colors">
                  {editingCustomerId ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
