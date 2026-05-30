import React, { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Order } from '../types';
import { CalendarDays, Crown, Download, FileText, MessageSquareText, Repeat, Search, Star, Store, UsersRound, WalletCards, X } from 'lucide-react';

interface CustomerDataViewProps {
  orders: Order[];
}

type FavoriteItem = {
  name: string;
  quantity: number;
  orderCount: number;
  spend: number;
};

type FavoriteSource = {
  name: string;
  orderCount: number;
  spend: number;
};

type CustomerSegment = {
  label: string;
  className: string;
};

type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  lastOrderAt: Date | null;
  lastOrderLabel: string;
  favoriteBranch?: FavoriteSource;
  favoriteChannel?: FavoriteSource;
  favoriteItem?: FavoriteItem;
  segment: CustomerSegment;
  orders: Order[];
};

const customerInsightStorageKey = 'cing-house-customer-insights';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function getCustomerKey(order: Order) {
  const phoneKey = normalizePhone(order.customerPhone);
  if (phoneKey) return `phone:${phoneKey}`;
  return `name:${order.customerName.trim().toLowerCase() || 'unknown'}`;
}

function parseOrderDate(order: Order) {
  const primary = order.placedTimeFull?.split('•')[0]?.trim() || order.placedTime;
  const parsed = new Date(primary);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date | null) {
  if (!date) return 'Chưa có dữ liệu';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getFavoriteSource(sourceMap: Map<string, FavoriteSource>) {
  return Array.from(sourceMap.values()).sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return b.spend - a.spend;
  })[0];
}

function getCustomerSegment(totalOrders: number, totalSpend: number, lastOrderAt: Date | null): CustomerSegment {
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((Date.now() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  if (daysSinceLastOrder !== null && daysSinceLastOrder > 45) {
    return { label: 'Ngủ đông', className: 'bg-slate-100 text-slate-600' };
  }

  if (totalSpend >= 2_000_000 || totalOrders >= 10) {
    return { label: 'VIP', className: 'bg-purple-50 text-purple-700' };
  }

  if (totalOrders >= 3) {
    return { label: 'Khách quay lại', className: 'bg-green-50 text-green-700' };
  }

  return { label: 'Khách mới', className: 'bg-blue-50 text-blue-700' };
}

function loadCustomerInsights() {
  try {
    const stored = localStorage.getItem(customerInsightStorageKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function sortOrdersByDateDesc(customerOrders: Order[]) {
  return [...customerOrders].sort((a, b) => {
    const aDate = parseOrderDate(a)?.getTime() ?? 0;
    const bDate = parseOrderDate(b)?.getTime() ?? 0;
    return bDate - aDate;
  });
}

export default function CustomerDataView({ orders }: CustomerDataViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);
  const [customerInsights, setCustomerInsights] = useState<Record<string, string>>(() => loadCustomerInsights());

  useEffect(() => {
    localStorage.setItem(customerInsightStorageKey, JSON.stringify(customerInsights));
  }, [customerInsights]);

  const customers = useMemo<CustomerSummary[]>(() => {
    const customerMap = new Map<string, Omit<CustomerSummary, 'averageOrderValue' | 'lastOrderLabel' | 'favoriteItem' | 'favoriteBranch' | 'favoriteChannel' | 'segment' | 'orders'> & {
      itemMap: Map<string, FavoriteItem>;
      branchMap: Map<string, FavoriteSource>;
      channelMap: Map<string, FavoriteSource>;
      orders: Order[];
    }>();

    orders.forEach((order) => {
      const key = getCustomerKey(order);
      const existing = customerMap.get(key);
      const customer = existing ?? {
        key,
        name: order.customerName || 'Khách chưa có tên',
        phone: order.customerPhone || 'Chưa có SĐT',
        totalOrders: 0,
        totalSpend: 0,
        lastOrderAt: null,
        itemMap: new Map<string, FavoriteItem>(),
        branchMap: new Map<string, FavoriteSource>(),
        channelMap: new Map<string, FavoriteSource>(),
        orders: []
      };

      if (!customer.name && order.customerName) customer.name = order.customerName;
      if (!customer.phone && order.customerPhone) customer.phone = order.customerPhone;

      customer.totalOrders += 1;
      customer.totalSpend += order.total;
      customer.orders.push(order);

      const placedAt = parseOrderDate(order);
      if (placedAt && (!customer.lastOrderAt || placedAt > customer.lastOrderAt)) {
        customer.lastOrderAt = placedAt;
      }

      const branchKey = order.branch.trim().toLowerCase() || 'unknown';
      const branch = customer.branchMap.get(branchKey) ?? {
        name: order.branch || 'Chưa có chi nhánh',
        orderCount: 0,
        spend: 0
      };
      branch.orderCount += 1;
      branch.spend += order.total;
      customer.branchMap.set(branchKey, branch);

      const channelKey = order.channel.trim().toLowerCase() || 'unknown';
      const channel = customer.channelMap.get(channelKey) ?? {
        name: order.channel || 'Chưa có kênh',
        orderCount: 0,
        spend: 0
      };
      channel.orderCount += 1;
      channel.spend += order.total;
      customer.channelMap.set(channelKey, channel);

      order.items.forEach((item) => {
        const itemKey = item.name.trim().toLowerCase() || item.sku || item.id;
        const currentItem = customer.itemMap.get(itemKey) ?? {
          name: item.name || item.sku || 'Sản phẩm chưa đặt tên',
          quantity: 0,
          orderCount: 0,
          spend: 0
        };

        currentItem.quantity += item.quantity;
        currentItem.orderCount += 1;
        currentItem.spend += item.subtotal;
        customer.itemMap.set(itemKey, currentItem);
      });

      customerMap.set(key, customer);
    });

    return Array.from(customerMap.values())
      .map((customer) => {
        const favoriteItem = Array.from(customer.itemMap.values()).sort((a, b) => {
          if (b.quantity !== a.quantity) return b.quantity - a.quantity;
          if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
          return b.spend - a.spend;
        })[0];

        return {
          key: customer.key,
          name: customer.name,
          phone: customer.phone,
          totalOrders: customer.totalOrders,
          totalSpend: customer.totalSpend,
          averageOrderValue: customer.totalOrders > 0 ? Math.round(customer.totalSpend / customer.totalOrders) : 0,
          lastOrderAt: customer.lastOrderAt,
          lastOrderLabel: formatDate(customer.lastOrderAt),
          favoriteBranch: getFavoriteSource(customer.branchMap),
          favoriteChannel: getFavoriteSource(customer.channelMap),
          favoriteItem,
          segment: getCustomerSegment(customer.totalOrders, customer.totalSpend, customer.lastOrderAt),
          orders: sortOrdersByDateDesc(customer.orders)
        };
      })
      .sort((a, b) => {
        if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
        return b.totalOrders - a.totalOrders;
      });
  }, [orders]);

  const filteredCustomers = customers.filter((customer) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return (
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.phone.toLowerCase().includes(normalizedQuery) ||
      customer.segment.label.toLowerCase().includes(normalizedQuery) ||
      (customerInsights[customer.key]?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (customer.favoriteItem?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
      (customer.favoriteBranch?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
      (customer.favoriteChannel?.name.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const handleExportCustomers = () => {
    const headers = [
      'Tên khách hàng',
      'Số điện thoại',
      'Tổng đơn',
      'Tổng chi tiêu',
      'Chi tiêu TB / đơn',
      'Lần mua gần nhất',
      'Món yêu thích',
      'Chi nhánh hay mua',
      'Kênh hay dùng',
      'Nhóm khách hàng',
      'Insight khách hàng'
    ];
    const csvRows = filteredCustomers.map((customer) => [
      customer.name,
      customer.phone,
      String(customer.totalOrders),
      String(customer.totalSpend),
      String(customer.averageOrderValue),
      customer.lastOrderLabel,
      customer.favoriteItem?.name ?? '',
      customer.favoriteBranch?.name ?? '',
      customer.favoriteChannel?.name ?? '',
      customer.segment.label,
      customerInsights[customer.key] ?? ''
    ]);
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cing-house-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const repeatCustomers = customers.filter(customer => customer.totalOrders >= 3).length;
  const vipCustomers = customers.filter(customer => customer.segment.label === 'VIP').length;
  const bestCustomer = customers[0];
  const selectedCustomer = selectedCustomerKey
    ? customers.find(customer => customer.key === selectedCustomerKey)
    : null;

  const updateCustomerInsight = (customerKey: string, insight: string) => {
    setCustomerInsights(current => ({
      ...current,
      [customerKey]: insight
    }));
  };

  const handleCustomerRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, customerKey: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedCustomerKey(customerKey);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý khách hàng</h2>
          <p className="text-slate-500 mt-1">Tổng hợp khách hàng từ dữ liệu đơn hàng đã lưu.</p>
        </div>
        <button
          onClick={handleExportCustomers}
          className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm self-start md:self-auto"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng khách hàng</span>
            <span className="bg-orange-50 text-[#f97316] p-2 rounded-lg">
              <UsersRound size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-4">{customers.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Khách quay lại</span>
            <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <Repeat size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-4">{repeatCustomers}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Từ 3 đơn trở lên</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng chi tiêu</span>
            <span className="bg-green-50 text-green-500 p-2 rounded-lg">
              <WalletCards size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-4">{formatMoney(totalSpend)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Khách VIP</span>
            <span className="bg-purple-50 text-purple-500 p-2 rounded-lg">
              <Crown size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-4">{vipCustomers}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">Chi tiêu cao hoặc từ 10 đơn</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Khách chi tiêu cao nhất</span>
            <span className="bg-purple-50 text-purple-500 p-2 rounded-lg">
              <Star size={18} />
            </span>
          </div>
          <p className="text-base font-black text-slate-800 mt-4 truncate">{bestCustomer?.name || 'Chưa có dữ liệu'}</p>
          <p className="text-xs font-bold text-slate-400 mt-1">{bestCustomer ? formatMoney(bestCustomer.totalSpend) : '0 đ'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f97316] transition-colors" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm tên, số điện thoại, insight, nhóm khách, món, chi nhánh hoặc kênh đặt hàng..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#f97316] focus:outline-none text-sm transition-all text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredCustomers.length > 0 ? (
            <table className="w-full min-w-[1500px] text-left">
              <thead className="bg-[#fffcfb] border-b border-slate-100">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Tên khách hàng</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Nhóm khách</th>
                  <th className="px-6 py-4 text-center">Tổng đơn hàng</th>
                  <th className="px-6 py-4 text-right">Tổng chi tiêu</th>
                  <th className="px-6 py-4 text-right">Chi tiêu TB / đơn</th>
                  <th className="px-6 py-4">Lần mua gần nhất</th>
                  <th className="px-6 py-4">Món ưa thích</th>
                  <th className="px-6 py-4">Chi nhánh hay mua</th>
                  <th className="px-6 py-4">Kênh hay dùng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.map((customer) => {
                  const initials = customer.name
                    .split(' ')
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'KH';

                  return (
                    <tr
                      key={customer.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCustomerKey(customer.key)}
                      onKeyDown={(event) => handleCustomerRowKeyDown(event, customer.key)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer outline-none focus:bg-orange-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 max-w-[260px]">
                          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-[#9d4300] font-black text-xs shrink-0">
                            {initials}
                          </div>
                          <span className="font-bold text-slate-800 text-xs truncate">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-600 text-xs">{customer.phone}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${customer.segment.className}`}>
                          {customer.segment.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-black text-slate-800 text-xs">{formatMoney(customer.totalSpend)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-slate-600 text-xs">{formatMoney(customer.averageOrderValue)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-600 text-xs">{customer.lastOrderLabel}</span>
                      </td>
                      <td className="px-6 py-4 min-w-[240px]">
                        {customer.favoriteItem ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{customer.favoriteItem.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {customer.favoriteItem.quantity} sản phẩm / {customer.favoriteItem.orderCount} đơn
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Chưa có dữ liệu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        {customer.favoriteBranch ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{customer.favoriteBranch.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {customer.favoriteBranch.orderCount} đơn
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Chưa có dữ liệu</span>
                        )}
                      </td>
                      <td className="px-6 py-4 min-w-[170px]">
                        {customer.favoriteChannel ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{customer.favoriteChannel.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {customer.favoriteChannel.orderCount} đơn
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Chưa có dữ liệu</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-[48px] text-slate-200 mb-2">group</span>
              <p className="font-bold text-sm">Không tìm thấy khách hàng phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">Dữ liệu khách hàng được tạo từ các đơn hàng đã lưu.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold">Hiển thị {filteredCustomers.length} trong {customers.length} khách hàng</span>
          <div className="flex gap-1.5">
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">‹</button>
            <button className="w-8 h-8 rounded bg-[#f97316] text-white font-black">1</button>
            <button disabled className="w-8 h-8 rounded border border-slate-200 bg-white text-slate-300 font-bold cursor-not-allowed">›</button>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedCustomerKey(null)}
        >
          <section
            className="w-full max-w-6xl h-full bg-[#F8FAFC] shadow-2xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 md:px-7 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#9d4300] flex items-center justify-center text-sm font-black shrink-0">
                  {selectedCustomer.name
                    .split(' ')
                    .filter(Boolean)
                    .map(part => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'KH'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-900 truncate">{selectedCustomer.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerKey(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Đóng chi tiết khách hàng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng đơn</span>
                    <FileText size={18} className="text-blue-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-4">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng chi tiêu</span>
                    <WalletCards size={18} className="text-green-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-4">{formatMoney(selectedCustomer.totalSpend)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">TB / đơn</span>
                    <Star size={18} className="text-[#f97316]" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-4">{formatMoney(selectedCustomer.averageOrderValue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nhóm khách</span>
                    <UsersRound size={18} className="text-purple-500" />
                  </div>
                  <p className={`inline-flex mt-4 px-3 py-1.5 rounded-full text-xs font-black ${selectedCustomer.segment.className}`}>
                    {selectedCustomer.segment.label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h4 className="font-black text-slate-900 flex items-center gap-2">
                      <MessageSquareText size={18} className="text-[#f97316]" />
                      Insight khách hàng
                    </h4>
                    <textarea
                      value={customerInsights[selectedCustomer.key] ?? ''}
                      onChange={(event) => updateCustomerInsight(selectedCustomer.key, event.target.value)}
                      className="w-full min-h-40 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 outline-none resize-y focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-orange-100 transition-all"
                      placeholder="Ghi chú khẩu vị, thói quen mua hàng, dịp chăm sóc, phản hồi hoặc insight riêng..."
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h4 className="font-black text-slate-900">Hồ sơ mua hàng</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400 font-bold">Lần mua gần nhất</span>
                        <span className="font-black text-slate-800 text-right">{selectedCustomer.lastOrderLabel}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400 font-bold">Món yêu thích</span>
                        <span className="font-black text-slate-800 text-right">{selectedCustomer.favoriteItem?.name ?? 'Chưa có dữ liệu'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400 font-bold">Chi nhánh hay mua</span>
                        <span className="font-black text-slate-800 text-right">{selectedCustomer.favoriteBranch?.name ?? 'Chưa có dữ liệu'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400 font-bold">Kênh hay dùng</span>
                        <span className="font-black text-slate-800 text-right">{selectedCustomer.favoriteChannel?.name ?? 'Chưa có dữ liệu'}</span>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-black text-slate-900 text-lg">Lịch sử mua hàng & hóa đơn</h4>
                    <span className="text-xs font-black text-slate-400">{selectedCustomer.orders.length} hóa đơn</span>
                  </div>

                  {selectedCustomer.orders.map((order) => (
                    <details key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group" open={selectedCustomer.orders.length === 1}>
                      <summary className="list-none cursor-pointer p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-900">{order.id}</span>
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                                order.status === 'COMPLETED'
                                  ? 'bg-green-50 text-green-700'
                                  : order.status === 'CANCELLED'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-blue-50 text-blue-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={14} />
                                {order.placedTimeFull}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Store size={14} />
                                {order.branch}
                              </span>
                              <span>{order.channel}</span>
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-lg font-black text-[#9d4300]">{formatMoney(order.total)}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{order.items.length} món</p>
                          </div>
                        </div>
                      </summary>

                      <div className="border-t border-slate-100 p-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
                        <div className="xl:col-span-8 overflow-hidden rounded-xl border border-slate-100">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Món</th>
                                <th className="px-4 py-3 text-center">SL</th>
                                <th className="px-4 py-3 text-right">Đơn giá</th>
                                <th className="px-4 py-3 text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {order.items.map((item, index) => (
                                <tr key={`${order.id}-${item.id}-${index}`}>
                                  <td className="px-4 py-3">
                                    <span className="font-black text-slate-800">{item.name}</span>
                                    <span className="block mt-0.5 text-[10px] text-slate-400 font-bold">{item.sku}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center font-black text-slate-700">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-500">{formatMoney(item.price)}</td>
                                  <td className="px-4 py-3 text-right font-black text-slate-900">{formatMoney(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50/70 text-xs">
                              <tr>
                                <td className="px-4 py-3 text-right font-bold text-slate-500" colSpan={3}>Tạm tính</td>
                                <td className="px-4 py-3 text-right font-black text-slate-800">{formatMoney(order.subtotal)}</td>
                              </tr>
                              {order.serviceFee && order.serviceFee > 0 ? (
                                <tr>
                                  <td className="px-4 py-3 text-right font-bold text-slate-500" colSpan={3}>Phí dịch vụ</td>
                                  <td className="px-4 py-3 text-right font-black text-slate-800">{formatMoney(order.serviceFee)}</td>
                                </tr>
                              ) : null}
                              {order.shippingFee > 0 ? (
                                <tr>
                                  <td className="px-4 py-3 text-right font-bold text-slate-500" colSpan={3}>Phí giao hàng</td>
                                  <td className="px-4 py-3 text-right font-black text-slate-800">{formatMoney(order.shippingFee)}</td>
                                </tr>
                              ) : null}
                              <tr>
                                <td className="px-4 py-4 text-right font-black text-[#9d4300]" colSpan={3}>Tổng tiền</td>
                                <td className="px-4 py-4 text-right font-black text-[#9d4300] text-base">{formatMoney(order.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div className="xl:col-span-4 space-y-4">
                          {order.notes && (
                            <div className="rounded-xl bg-[#fff1eb] border border-[#ffeae0] p-4">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#9d4300] mb-1">Ghi chú đơn</p>
                              <p className="text-xs font-bold text-[#9d4300] leading-relaxed">{order.notes}</p>
                            </div>
                          )}

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Ảnh bill</p>
                            {order.screenshot ? (
                              <img
                                className="w-full max-h-64 object-cover rounded-lg border border-slate-200 bg-white"
                                src={order.screenshot}
                                alt={`Ảnh bill ${order.id}`}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-32 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                                Không có ảnh bill
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
