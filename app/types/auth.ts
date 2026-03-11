export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface UserInfo {
  email: string;
  username: string;
  has_access_to_marketplace: boolean;
  business_type: string | null;
  role: string;
  shop_id: number | null;
  b2b_verified: boolean;
}

export interface AuthUser {
  email: string;
  name: string;
  hasAccessToMarketplace: boolean;
  businessType: string | null;
  role: string;
  shopId: number | null;
  b2b_verified: boolean;
}
