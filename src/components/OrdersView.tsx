import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import OrderDetailView from './OrderDetailView';
import { Search, Plus, Filter, Download, ArrowRight, Eye } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onNavigate: (view: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export default function OrdersView({ orders, onNavigate, onUpdateOrderStatus }: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tabFilter, setTabFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced secondary filters
  const [branchFilter, setBranchFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  // Handle drill down/up
  if (selectedOrder) {
    // Keep internal reference synced with any parents modification
    const freshOrderState = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    return (
      <OrderDetailView 
        order={freshOrderState} 
        onBack={() => setSelectedOrder(null)}
        onUpdateStatus={onUpdateOrderStatus}
      />
    );
  }

  // Filtering logic
  const filteredOrders = orders.filter(order => {
    // Text search (ID, Customer Name or Phone)
    const matchesQuery = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    // Tab category filter
    const matchesTab = tabFilter === 'ALL' || order.status === tabFilter;

    // Advanced Logistics filters
    const matchesBranch = !branchFilter || order.branch === branchFilter;
    const matchesChannel = !channelFilter || order.channel === channelFilter;

    return matchesQuery && matchesTab && matchesBranch && matchesChannel;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-700';
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getChannelBadge = (channel: string) => {
    return 'bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider';
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h2>
          <p className="text-slate-500 mt-1">Real-time order tracking and manual fulfillment system.</p>
        </div>
        <button
          onClick={() => onNavigate('New Order')}
          className="bg-[#f97316] hover:bg-[#9d4300] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm self-start md:self-auto active:scale-95 duration-100"
        >
          <Plus size={18} />
          Add New Order
        </button>
      </div>

      {/* Search & Filter bar container */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
        {/* Row 1: Search & CTA triggers */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f97316] transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Customer Name, Phone..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#f97316] focus:outline-none text-sm transition-all text-slate-800"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all ${
                showAdvancedFilters || branchFilter || channelFilter 
                  ? 'border-[#f97316] bg-orange-50 text-[#9d4300]' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={16} />
              More Filters{(branchFilter || channelFilter) ? ' (Active)' : ''}
            </button>
            <button 
              onClick={() => alert(`Exported complete document dataset (${filteredOrders.length} orders) to CVS/Spreadsheets format!`)} 
              className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Expansible Advanced Filters segment */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-slide-down">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Branch Selector</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="">All Branches</option>
                <option value="Quận 1">Quận 1</option>
                <option value="Quận 3">Quận 3</option>
                <option value="Bình Thạnh">Bình Thạnh</option>
                <option value="Downtown Central">Downtown Central</option>
                <option value="Uptown Hub">Uptown Hub</option>
                <option value="Westside Outlet">Westside Outlet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Sales Channel</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="">All Channels</option>
                <option value="GrabFood">GrabFood</option>
                <option value="Dine-In">Dine-In</option>
                <option value="Takeaway">Takeaway</option>
                <option value="UberEats">UberEats</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Zalo">Zalo</option>
                <option value="Direct Message (IG)">Direct Message (IG)</option>
              </select>
            </div>
            {(branchFilter || channelFilter) && (
              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={() => {
                    setBranchFilter('');
                    setChannelFilter('');
                  }}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Clear filter overrides
                </button>
              </div>
            )}
          </div>
        )}

        {/* Categories togglers row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'NEW', label: 'New' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id as OrderStatus | 'ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 relative ${
                tabFilter === tab.id
                  ? 'bg-[#f97316] text-white shadow shadow-orange-100'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {orders.filter(o => tab.id === 'ALL' || o.status === tab.id).length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                  tabFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {orders.filter(o => tab.id === 'ALL' || o.status === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table segment */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrders.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-[#fffcfb] border-b border-slate-100">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Customer/Products</th>
                  <th className="px-6 py-4">Logistics</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  // Compile customer summary of items
                  const listSentence = order.items
                    .map(it => `${it.quantity}x ${it.name}`)
                    .join(', ');

                  // Avatar generic initials
                  const initials = order.customerName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      {/* Order identifier */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#f97316] group-hover:underline">
                          {order.id}
                        </span>
                      </td>

                      {/* Created date values */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{order.placedTime}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{order.placedTimeFull.split('•')[1] || ''}</div>
                      </td>

                      {/* Customer widget */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 max-w-[240px]">
                          {order.createdByAvatar ? (
                            <img 
                              className="w-8 h-8 rounded-lg object-cover" 
                              src={order.createdByAvatar} 
                              alt="Mini profile" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#9d4300] font-black text-xs">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">{order.customerName}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{listSentence}</div>
                          </div>
                        </div>
                      </td>

                      {/* Location Branch layout */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-600 font-semibold text-xs">
                          {order.branch}
                        </span>
                        {order.tableRef && (
                          <span className="block text-[10px] text-[#9d4300] font-bold mt-0.5 font-sans">
                            {order.tableRef.split('/')[0]}
                          </span>
                        )}
                      </td>

                      {/* Channel */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold ${getChannelBadge(order.channel)}`}>
                          {order.channel}
                        </span>
                      </td>

                      {/* Money */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-black text-slate-800 text-xs">
                          {formatMoney(order.total)}
                        </span>
                      </td>

                      {/* Status label */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Action trigger */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="p-1 text-slate-400 hover:text-[#f97316] transition-colors hover:bg-orange-50 rounded-lg"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-[48px] text-slate-200 mb-2">inbox</span>
              <p className="font-bold text-sm">Không tìm thấy đơn hàng trùng khớp nào</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng thử thay đổi điều kiện tìm kiếm hoặc thêm mới đơn hàng.</p>
            </div>
          )}
        </div>

        {/* Simplified table summary paginator footer */}
        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold">Showing 1-{filteredOrders.length} of {filteredOrders.length} records</span>
          <div className="flex gap-1.5">
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">
              ‹
            </button>
            <button className="w-8 h-8 rounded bg-[#f97316] text-white font-black">
              1
            </button>
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
