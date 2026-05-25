import React, { useState } from 'react';
import { Branch, Order } from '../types';
import { CHANNELS } from '../data';
import OrderDetailView from './OrderDetailView';
import { Search, Plus, Filter, Download, Eye, Trash2 } from 'lucide-react';

interface OrdersViewProps {
  branches: Branch[];
  orders: Order[];
  onNavigate: (view: string) => void;
  onDeleteOrder: (orderId: string) => Promise<boolean>;
}

export default function OrdersView({ branches, orders, onNavigate, onDeleteOrder }: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [branchFilter, setBranchFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Bạn có chắc muốn xóa đơn ${order.id} của ${order.customerName}?`)) return;

    setDeletingOrderId(order.id);
    try {
      const wasDeleted = await onDeleteOrder(order.id);
      if (wasDeleted && selectedOrder?.id === order.id) setSelectedOrder(null);
    } finally {
      setDeletingOrderId(null);
    }
  };

  if (selectedOrder) {
    const freshOrderState = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    return (
      <OrderDetailView
        order={freshOrderState}
        onBack={() => setSelectedOrder(null)}
        onDeleteOrder={async (orderId) => {
          const wasDeleted = await onDeleteOrder(orderId);
          if (wasDeleted) setSelectedOrder(null);
          return wasDeleted;
        }}
      />
    );
  }

  const filteredOrders = orders.filter(order => {
    const normalizedQuery = searchQuery.toLowerCase();
    const itemSentence = order.items.map(item => `${item.sku} ${item.name}`).join(' ').toLowerCase();
    const matchesQuery =
      order.id.toLowerCase().includes(normalizedQuery) ||
      order.customerName.toLowerCase().includes(normalizedQuery) ||
      order.customerPhone.includes(searchQuery) ||
      itemSentence.includes(normalizedQuery);

    const matchesBranch = !branchFilter || order.branch === branchFilter;
    const matchesChannel = !channelFilter || order.channel === channelFilter;

    return matchesQuery && matchesBranch && matchesChannel;
  });

  const getChannelBadge = () => 'bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider';

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý đơn hàng</h2>
          <p className="text-slate-500 mt-1">Lưu tên khách, số điện thoại, món đã order và ảnh bill. Không dùng trạng thái đơn.</p>
        </div>
        <button
          onClick={() => onNavigate('New Order')}
          className="bg-[#f97316] hover:bg-[#9d4300] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm self-start md:self-auto active:scale-95 duration-100"
        >
          <Plus size={18} />
          Thêm đơn hàng
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f97316] transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, số điện thoại hoặc món..."
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
              Bộ lọc{(branchFilter || channelFilter) ? ' đang bật' : ''}
            </button>
            <button
              onClick={() => alert(`Đã chuẩn bị xuất ${filteredOrders.length} đơn hàng sang bảng tính.`)}
              className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-slide-down">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Chi nhánh</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.name}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Kênh bán</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
              >
                <option value="">Tất cả kênh</option>
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
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
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrders.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-[#fffcfb] border-b border-slate-100">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Ngày giờ</th>
                  <th className="px-6 py-4">Khách hàng / món</th>
                  <th className="px-6 py-4">Chi nhánh</th>
                  <th className="px-6 py-4">Kênh</th>
                  <th className="px-6 py-4">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Bill</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const listSentence = order.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
                  const initials = order.customerName
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'KH';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#f97316] group-hover:underline">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{order.placedTime}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{order.placedTimeFull.split('•')[1] || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 max-w-[280px]">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#9d4300] font-black text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">{order.customerName}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{order.customerPhone}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{listSentence}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-600 font-semibold text-xs">{order.branch}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold ${getChannelBadge()}`}>{order.channel}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-black text-slate-800 text-xs">{formatMoney(order.total)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${order.screenshot ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                          {order.screenshot ? 'Có ảnh' : 'Không'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#f97316] transition-colors hover:bg-orange-50 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order);
                            }}
                            disabled={deletingOrderId !== null}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title={deletingOrderId === order.id ? 'Đang xóa...' : 'Xóa đơn'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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

        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold">Hiển thị 1-{filteredOrders.length} trong {filteredOrders.length} đơn hàng</span>
          <div className="flex gap-1.5">
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">‹</button>
            <button className="w-8 h-8 rounded bg-[#f97316] text-white font-black">1</button>
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
