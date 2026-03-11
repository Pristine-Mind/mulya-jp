export interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  salesTrends: { month: string; value: number }[];
  pendingOrders: number;
  totalRevenue: number;
}

export interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  registered_business_name: string;
  corporate_number: string | null;
  prefecture: string;
  business_category: string;
  invoice_registration_number: string | null;
  business_overview: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  severity: string;
}
