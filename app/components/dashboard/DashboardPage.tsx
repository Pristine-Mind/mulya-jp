'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  ShoppingBag,
  BarChart3,
  Users,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Home,
  Package,
  TrendingUp,
  Settings,
  ChevronLeft,
  Factory,
  Boxes,
  ClipboardList,
  Clock,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../../services/dashboard';
import { DashboardData, UserProfile } from '../../types/dashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const emptyDashboard: DashboardData = {
  totalProducts: 0,
  totalOrders: 0,
  totalSales: 0,
  totalCustomers: 0,
  salesTrends: [],
  pendingOrders: 0,
  totalRevenue: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated, isInitialized, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  const profileIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const businessType = (userProfile?.business_category || user?.businessType || '')
    .trim()
    .toLowerCase();
  const role = (user?.role || '').trim().toLowerCase();

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }

    const loadAll = async () => {
      try {
        const [dash, profile] = await Promise.all([
          dashboardAPI.getDashboardData(token),
          dashboardAPI.getUserProfile(token),
        ]);
        setData(dash);
        setUserProfile(profile);
      } catch {
        // silently ignore — board shows zeros, still usable
      } finally {
        setDataLoading(false);
        setProfileLoading(false);
      }
    };

    loadAll();

    profileIntervalRef.current = setInterval(async () => {
      try {
        const profile = await dashboardAPI.getUserProfile(token);
        setUserProfile(profile);
      } catch {}
    }, 300000);

    return () => {
      if (profileIntervalRef.current) clearInterval(profileIntervalRef.current);
    };
  }, [isAuthenticated, isInitialized, token, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const chartData = {
    labels: data.salesTrends.map(s => s.month),
    datasets: [
      {
        label: 'Monthly Sales',
        data: data.salesTrends.map(s => s.value),
        borderColor: '#C0392B',
        backgroundColor: 'rgba(192, 57, 43, 0.08)',
        pointBackgroundColor: '#C0392B',
        pointBorderColor: '#fff',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', href: '/home', active: true },
    { icon: <Package className="w-5 h-5" />, label: 'Products', href: '/products' },
    { icon: <ShoppingCart className="w-5 h-5" />, label: 'Orders', href: '/orders' },
    { icon: <Users className="w-5 h-5" />, label: 'Customers', href: '/customers' },
    { icon: <Factory className="w-5 h-5" />, label: 'Producers', href: '/producers' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Sales', href: '/sales' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', href: '/stats' },
    { icon: <Boxes className="w-5 h-5" />, label: 'Stocks', href: '/stocks' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Purchase Orders', href: '/purchase-orders' },
  ];

  const statCards = [
    { icon: <ShoppingBag className="h-6 w-6" />, label: 'Products', display: data.totalProducts.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: <ShoppingCart className="h-6 w-6" />, label: 'Orders', display: data.totalOrders.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: <BarChart3 className="h-6 w-6" />, label: 'Sales', display: data.totalSales.toLocaleString(), color: 'text-vermilion', bg: 'bg-red-50' },
    { icon: <Users className="h-6 w-6" />, label: 'Customers', display: data.totalCustomers.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: <Clock className="h-6 w-6" />, label: 'Pending Orders', display: data.pendingOrders.toLocaleString(), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: <Banknote className="h-6 w-6" />, label: 'Total Revenue', display: `¥${Math.round(data.totalRevenue).toLocaleString()}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-ink text-white flex flex-col transition-all duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <div className="font-serif text-lg font-extrabold tracking-wide">Mulya</div>
              <div className="font-mono text-xs text-vermilion tracking-widest uppercase">Japan Marketplace</div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition ml-auto"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors
                ${item.active ? 'bg-vermilion text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}
                ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-2 py-2 text-sm text-white/70 hover:text-red-400 hover:bg-white/10 rounded transition
              ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-ink font-serif">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-vermilion rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {(userProfile?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {profileLoading ? '...' : (userProfile?.first_name || user?.name?.split(' ')[0] || 'User')}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100">
                    <p className="font-semibold text-ink text-sm">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{userProfile?.email || user?.email}</p>
                    {businessType && (
                      <span className="inline-block mt-2 text-xs bg-vermilion/10 text-vermilion px-2 py-0.5 rounded font-medium capitalize">
                        {businessType}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <a
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-sm text-gray-700"
                    >
                      <User className="h-4 w-4" />
                      <span>View Profile</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 transition text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Welcome back, {profileLoading ? '...' : (userProfile?.first_name || user?.name || 'User')} 👋
            </h2>
            {businessType && (
              <p className="text-gray-500 mt-1 text-sm capitalize">
                {businessType} Dashboard
              </p>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
            {statCards.map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
              >
                <div className={`${card.bg} ${card.color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-ink mt-0.5 truncate">
                    {dataLoading ? '—' : card.display}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="font-serif text-lg font-bold text-ink mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[
                { label: 'Products', href: '/products', icon: <ShoppingBag className="h-8 w-8" />, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
                { label: 'Orders', href: '/orders', icon: <ShoppingCart className="h-8 w-8" />, color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100' },
                { label: 'Customers', href: '/customers', icon: <Users className="h-8 w-8" />, color: 'text-purple-600', bg: 'bg-purple-50 hover:bg-purple-100' },
                { label: 'Sales', href: '/sales', icon: <TrendingUp className="h-8 w-8" />, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
                { label: 'Analytics', href: '/stats', icon: <BarChart3 className="h-8 w-8" />, color: 'text-vermilion', bg: 'bg-red-50 hover:bg-red-100' },
                { label: 'Stocks', href: '/stocks', icon: <Boxes className="h-8 w-8" />, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100' },
                { label: 'Purchase Orders', href: '/purchase-orders', icon: <ClipboardList className="h-8 w-8" />, color: 'text-indigo-600', bg: 'bg-indigo-50 hover:bg-indigo-100' },
              ].map(action => (
                <a
                  key={action.href}
                  href={action.href}
                  className="group text-center"
                >
                  <div className={`${action.bg} ${action.color} rounded-xl p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md flex flex-col items-center gap-3`}>
                    {action.icon}
                    <p className="text-xs font-semibold text-gray-800">{action.label}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Sales Trends Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="font-serif text-lg font-bold text-ink mb-4">Monthly Sales Trends</h3>
            <div className="h-64">
              {data.salesTrends.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  {dataLoading ? 'Loading chart...' : 'No sales data yet'}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
