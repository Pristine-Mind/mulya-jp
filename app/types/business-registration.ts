// API Types for Business Registration

export interface BusinessRegistrationRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  registered_business_name: string;
  corporate_number?: string;
  prefecture: string;
  business_category: string;
  invoice_registration_number?: string;
  business_overview?: string;
}

export interface BusinessRegistrationResponse {
  message: string;
  user_id?: number;
  business_id?: number;
  success: boolean;
}

export interface ApiError {
  message?: string;
  error?: string;
  detail?: string;
  [key: string]: any;
}

export interface Prefecture {
  value: string;
  label: string;
}

export interface BusinessCategory {
  value: string;
  label: string;
}