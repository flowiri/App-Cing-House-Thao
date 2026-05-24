import { AuditLog, Order, OrderItem, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';

type OrderRow = {
  id: string;
  placed_time: string;
  placed_time_full: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  branch: string;
  channel: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  service_fee: number | null;
  total: number;
  status: OrderStatus;
  notes: string;
  table_ref: string | null;
  screenshot: string | null;
  created_by: string;
  created_by_avatar: string | null;
  history: AuditLog[];
};

const orderColumns = [
  'id',
  'placed_time',
  'placed_time_full',
  'customer_name',
  'customer_phone',
  'customer_email',
  'branch',
  'channel',
  'items',
  'subtotal',
  'shipping_fee',
  'service_fee',
  'total',
  'status',
  'notes',
  'table_ref',
  'screenshot',
  'created_by',
  'created_by_avatar',
  'history'
].join(', ');

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    placedTime: row.placed_time,
    placedTimeFull: row.placed_time_full,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? undefined,
    branch: row.branch,
    channel: row.channel,
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    serviceFee: row.service_fee === null ? undefined : Number(row.service_fee),
    total: Number(row.total),
    status: row.status,
    notes: row.notes,
    tableRef: row.table_ref ?? undefined,
    screenshot: row.screenshot ?? undefined,
    createdBy: row.created_by,
    createdByAvatar: row.created_by_avatar ?? undefined,
    history: row.history ?? []
  };
}

function toOrderRow(order: Order): OrderRow {
  return {
    id: order.id,
    placed_time: order.placedTime,
    placed_time_full: order.placedTimeFull,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail ?? null,
    branch: order.branch,
    channel: order.channel,
    items: order.items,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    service_fee: order.serviceFee ?? null,
    total: order.total,
    status: order.status,
    notes: order.notes,
    table_ref: order.tableRef ?? null,
    screenshot: order.screenshot ?? null,
    created_by: order.createdBy,
    created_by_avatar: order.createdByAvatar ?? null,
    history: order.history
  };
}

export async function loadOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(orderColumns)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as OrderRow[]).map(toOrder);
}

export async function createOrder(order: Order): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(toOrderRow(order))
    .select(orderColumns)
    .single();

  if (error) throw error;

  return toOrder(data as unknown as OrderRow);
}

export async function updateOrder(order: Order): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(toOrderRow(order))
    .eq('id', order.id)
    .select(orderColumns)
    .single();

  if (error) throw error;

  return toOrder(data as unknown as OrderRow);
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}
