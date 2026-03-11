'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { ArrowLeft, Loader2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

// ── Types ────────────────────────────────────────────────────────────────────
interface TopCustomer { order__customer__name: string; order__customer__city: string; total_spent: number }
interface TopProduct  { order__product__name: string; total_sold: number }
interface TopCategory { order__product__category: string; total_sold: number }
interface MonthlySale { month: string; total_sold: number }

interface StatsResponse {
  total_products_sold: number | null;
  total_revenue: number | null;
  top_customers: TopCustomer[];
  top_products: TopProduct[];
  top_categories: TopCategory[];
  monthly_sales: MonthlySale[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: 'FA', label: 'Fashion & Apparel' },
  { value: 'EG', label: 'Electronics & Gadgets' },
  { value: 'GE', label: 'Groceries & Essentials' },
  { value: 'HB', label: 'Health & Beauty' },
  { value: 'HL', label: 'Home & Living' },
  { value: 'TT', label: 'Travel & Tourism' },
  { value: 'IS', label: 'Industrial Supplies' },
  { value: 'OT', label: 'Other' },
];

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
];

const pieOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, padding: 15, font: { size: 12 } },
    },
  },
};

const lineOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { display: true } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false } },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const router = useRouter();

  const [stats, setStats]     = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData]   = useState(false);

  const [location,  setLocation]  = useState('');
  const [category,  setCategory]  = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setNoData(false);

    const params: Record<string, string> = {};
    if (location)  params.location   = location;
    if (category)  params.category   = category;
    if (startDate) params.start_date = startDate;
    if (endDate)   params.end_date   = endDate;

    try {
      const res = await axios.get(`${apiBase}/api/v1/stats/`, {
        params,
        headers: authHeaders(),
      });
      const d: StatsResponse = res.data;
      const isEmpty =
        (d.total_products_sold === null || d.total_products_sold === 0) &&
        (d.total_revenue === null || d.total_revenue === 0) &&
        d.top_customers.length === 0 &&
        d.top_products.length === 0 &&
        d.top_categories.length === 0 &&
        d.monthly_sales.length === 0;

      if (isEmpty) { setNoData(true); setStats(null); }
      else          { setStats(d); }
    } catch (err) {
      console.error('Error fetching stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const monthlySalesData = stats ? {
    labels: stats.monthly_sales.map(s =>
      new Date(s.month).toLocaleString('default', { month: 'short', year: 'numeric' })
    ),
    datasets: [{
      label: 'Products Sold',
      data: stats.monthly_sales.map(s => s.total_sold),
      backgroundColor: 'rgba(255, 214, 0, 0.15)',
      borderColor: '#FFD600',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#FFD600',
      pointBorderColor: '#fff',
      pointHoverRadius: 6,
    }],
  } : null;

  const topProductsPieData = stats ? {
    labels: stats.top_products.map(p => p.order__product__name),
    datasets: [{ data: stats.top_products.map(p => p.total_sold), backgroundColor: CHART_COLORS.slice(0, stats.top_products.length) }],
  } : null;

  const topCustomersPieData = stats ? {
    labels: stats.top_customers.map(c => c.order__customer__name),
    datasets: [{ data: stats.top_customers.map(c => c.total_spent), backgroundColor: CHART_COLORS.slice(0, stats.top_customers.length) }],
  } : null;

  const topCategoriesPieData = stats ? {
    labels: stats.top_categories.map(c => c.order__product__category),
    datasets: [{ data: stats.top_categories.map(c => c.total_sold), backgroundColor: CHART_COLORS.slice(0, stats.top_categories.length) }],
  } : null;

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition';

  // ── Render ─────────────────────────────────────────────────────────────────
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
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">Sales Statistics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analytics &amp; performance overview</p>
        </div>
      </div>

      {/* ── Full-screen loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-vermilion" />
          <span className="text-base">Loading analytics…</span>
        </div>
      )}

      {/* ── No data state ── */}
      {!loading && noData && (
        <div className="flex items-center justify-center py-32 text-gray-500">
          No data available. Try adjusting your filters.
        </div>
      )}

      {/* ── Content ── */}
      {!loading && stats && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Enter location" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  <option value="">All Categories</option>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={fetchStats}
                className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red transition-colors text-sm font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-vermilion to-deep-red rounded-xl p-8 text-white shadow-sm">
              <h3 className="text-sm font-medium mb-2 opacity-80">Total Products Sold</h3>
              <p className="text-4xl font-bold">
                {stats.total_products_sold != null ? stats.total_products_sold.toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white shadow-sm">
              <h3 className="text-sm font-medium mb-2 opacity-80">Total Revenue</h3>
              <p className="text-4xl font-bold">
                {stats.total_revenue != null ? `¥${stats.total_revenue.toFixed(2)}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Top products + top customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 text-center">Top Products</h2>
              {topProductsPieData && stats.top_products.length > 0 ? (
                <div className="h-80">
                  <Pie data={topProductsPieData} options={pieOptions} />
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-20">No data available for top products.</p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4 text-center">Top Customers</h2>
              {topCustomersPieData && stats.top_customers.length > 0 ? (
                <div className="h-80">
                  <Pie data={topCustomersPieData} options={pieOptions} />
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-20">No data available for top customers.</p>
              )}
            </div>
          </div>

          {/* Top categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-base font-semibold text-gray-800 mb-4 text-center">Top Categories</h2>
            {topCategoriesPieData && stats.top_categories.length > 0 ? (
              <div className="h-80">
                <Pie data={topCategoriesPieData} options={pieOptions} />
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-20">No data available for top categories.</p>
            )}
          </div>

          {/* Monthly sales line chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Sales</h2>
            {monthlySalesData && stats.monthly_sales.length > 0 ? (
              <div className="h-80">
                <Line data={monthlySalesData} options={lineOptions} />
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-20">No data available for monthly sales.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
