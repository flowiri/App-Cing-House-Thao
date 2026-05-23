export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'drinks' | 'food' | 'dessert' | string;
  categoryName: string;
  price: number; // in VND or original
  currency: 'VND' | 'USD' | string;
  status: 'active' | 'inactive';
  image: string;
}

export type OrderStatus = 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string; // matches product id or SKU
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  timestamp: string; // e.g. "14:20 10/10"
  statusBadgeColor?: string;
}

export interface Order {
  id: string; // e.g. "#OH-8291"
  placedTime: string; // e.g. "Oct 24, 2023"
  placedTimeFull: string; // e.g. "Oct 24, 2023 • 14:32 PM"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  branch: string; // e.g. "Quận 1", "Quận 3", "Bình Thạnh"
  channel: string; // e.g. "Facebook", "Instagram", "Zalo", "GrabFood", "Dine-In", "Takeaway", "UberEats", "Direct Message (IG)"
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee?: number;
  total: number;
  status: OrderStatus;
  notes: string;
  tableRef?: string;
  screenshot?: string;
  createdBy: string;
  createdByAvatar?: string;
  history: AuditLog[];
}
