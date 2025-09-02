/**
 * Type Definitions
 * Centralized type definitions for the application
 */

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  product_sku?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_description?: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  notes?: string;
  status: OrderStatus;
  total_amount: number;
  tracking_number?: string;
  items: OrderItem[];
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderItem {
  product_name: string;
  product_sku?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  product_description?: string;
}

export interface CreateOrder {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  notes?: string;
  items: CreateOrderItem[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
