import React, { useMemo, useState } from 'react';
import { Branch, Order, Product } from '../types';
import { CalendarDays, CheckCircle, ReceiptText, ShoppingBag, Star, TrendingUp, UsersRound } from 'lucide-react';

interface DashboardViewProps {
  branches: Branch[];
  orders: Order[];
  products: Product[];
  onNavigate: (view: string) => void;
}

type RangeKey = 'today' | 'week' | 'month' | 'custom';

type DateBounds = {
  start: Date;
  end: Date;
};

const dayMs = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOrderDate(order: Order) {
  const primary = order.placedTimeFull?.split('•')[0]?.trim() || order.placedTime;
  const parsed = new Date(primary);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBounds(range: RangeKey, now = new Date()): DateBounds {
  const today = startOfDay(now);

  if (range === 'today') {
    return { start: today, end: addDays(today, 1) };
  }

  if (range === 'month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    };
  }

  return { start: addDays(today, -6), end: addDays(today, 1) };
}

function getCustomBounds(startValue: string, endValue: string, fallback: DateBounds): DateBounds {
  const startDate = parseInputDate(startValue);
  const endDate = parseInputDate(endValue);

  if (startDate && endDate) {
    const start = startDate <= endDate ? startDate : endDate;
    const end = startDate <= endDate ? endDate : startDate;
    return { start, end: addDays(end, 1) };
  }

  if (startDate) return { start: startDate, end: addDays(startDate, 1) };
  if (endDate) return { start: endDate, end: addDays(endDate, 1) };
  return fallback;
}

function getPreviousBounds(range: RangeKey, bounds: DateBounds): DateBounds {
  const periodMs = bounds.end.getTime() - bounds.start.getTime();

  if (range === 'month') {
    return {
      start: new Date(bounds.start.getFullYear(), bounds.start.getMonth() - 1, 1),
      end: bounds.start
    };
  }

  return {
    start: new Date(bounds.start.getTime() - periodMs),
    end: bounds.start
  };
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function getCustomerKey(order: Order) {
  const phoneKey = normalizePhone(order.customerPhone);
  if (phoneKey) return `phone:${phoneKey}`;
  return `name:${order.customerName.trim().toLowerCase() || 'unknown'}`;
}

export default function DashboardView({ branches, orders, products, onNavigate }: DashboardViewProps) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>('week');
  const [customStartDate, setCustomStartDate] = useState(() => formatDateInput(addDays(startOfDay(new Date()), -6)));
  const [customEndDate, setCustomEndDate] = useState(() => formatDateInput(startOfDay(new Date())));

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const formatCompactCurrency = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${Math.round(num / 1_000_000)}M`;
    if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
    return String(num);
  };

  const getBranchCode = (branch: Branch, index: number) => {
    if (branch.code) return branch.code;
    const initials = branch.name
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    return initials || `B${index + 1}`;
  };

  const rangeData = useMemo(() => {
    const presetBounds = getBounds(selectedRange === 'custom' ? 'week' : selectedRange);
    const bounds = selectedRange === 'custom'
      ? getCustomBounds(customStartDate, customEndDate, presetBounds)
      : presetBounds;
    const previousBounds = getPreviousBounds(selectedRange, bounds);

    const isInBounds = (order: Order, targetBounds: DateBounds) => {
      const placedAt = parseOrderDate(order);
      if (!placedAt) return false;
      return placedAt >= targetBounds.start && placedAt < targetBounds.end;
    };

    const currentOrders = orders.filter(order => isInBounds(order, bounds));
    const previousOrders = orders.filter(order => isInBounds(order, previousBounds));
    const revenueOrders = currentOrders;
    const previousRevenueOrders = previousOrders;

    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousRevenueOrders.reduce((sum, order) => sum + order.total, 0);
    const billCaptureRate = currentOrders.length > 0
      ? (currentOrders.filter(order => Boolean(order.screenshot)).length / currentOrders.length) * 100
      : 0;
    const growthPct = previousRevenue === 0
      ? (totalRevenue > 0 ? 100 : 0)
      : ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    const averageOrderValue = currentOrders.length > 0 ? Math.round(totalRevenue / currentOrders.length) : 0;

    return {
      bounds,
      orders: currentOrders,
      revenueOrders,
      totalRevenue,
      averageOrderValue,
      billCaptureRate,
      growthPct
    };
  }, [orders, selectedRange, customStartDate, customEndDate]);

  const chartData = useMemo(() => {
    const totalDays = Math.max(1, Math.ceil((rangeData.bounds.end.getTime() - rangeData.bounds.start.getTime()) / dayMs));
    const bucketSize = Math.max(1, Math.ceil(totalDays / 7));
    const buckets: Array<{ start: Date; end: Date; label: string; value: number }> = [];

    for (let cursor = new Date(rangeData.bounds.start); cursor < rangeData.bounds.end; cursor = addDays(cursor, bucketSize)) {
      const bucketEnd = addDays(cursor, bucketSize) < rangeData.bounds.end
        ? addDays(cursor, bucketSize)
        : rangeData.bounds.end;
      const label = bucketSize === 1
        ? cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
        : `${cursor.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}-${addDays(bucketEnd, -1).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

      buckets.push({
        start: cursor,
        end: bucketEnd,
        label,
        value: rangeData.orders
          .filter(order => {
            const placedAt = parseOrderDate(order);
            return placedAt && placedAt >= cursor && placedAt < bucketEnd;
          })
          .reduce((sum, order) => sum + order.total, 0)
      });
    }

    const values = buckets.map(bucket => bucket.value);
    const maxRevenue = Math.max(...values, 1);

    return buckets.map((bucket) => ({
      label: bucket.label,
      value: bucket.value,
      height: bucket.value === 0 ? 4 : Math.max(8, Math.round((bucket.value / maxRevenue) * 100))
    }));
  }, [rangeData.bounds, rangeData.orders]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { key: string; name: string; sku: string; quantity: number; orderCount: number; revenue: number }>();

    rangeData.orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.id || item.sku || item.name.trim().toLowerCase();
        const current = productMap.get(key) ?? {
          key,
          name: item.name || item.sku || 'Sản phẩm chưa đặt tên',
          sku: item.sku,
          quantity: 0,
          orderCount: 0,
          revenue: 0
        };

        current.quantity += item.quantity;
        current.orderCount += 1;
        current.revenue += item.subtotal;
        productMap.set(key, current);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity;
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
        return b.revenue - a.revenue;
      })
      .slice(0, 5);
  }, [rangeData.orders]);

  const topCustomers = useMemo(() => {
    const customerMap = new Map<string, { key: string; name: string; phone: string; totalSpend: number; totalOrders: number; averageOrderValue: number }>();

    rangeData.orders.forEach((order) => {
      const key = getCustomerKey(order);
      const current = customerMap.get(key) ?? {
        key,
        name: order.customerName || 'Khách chưa có tên',
        phone: order.customerPhone || 'Chưa có SĐT',
        totalSpend: 0,
        totalOrders: 0,
        averageOrderValue: 0
      };

      current.totalSpend += order.total;
      current.totalOrders += 1;
      current.averageOrderValue = Math.round(current.totalSpend / current.totalOrders);
      customerMap.set(key, current);
    });

    return Array.from(customerMap.values())
      .sort((a, b) => {
        if (b.totalSpend !== a.totalSpend) return b.totalSpend - a.totalSpend;
        return b.totalOrders - a.totalOrders;
      })
      .slice(0, 5);
  }, [rangeData.orders]);

  const branchStats = branches.map((branch, index) => {
    const branchOrders = rangeData.orders.filter(order => order.branch === branch.name);
    const revenue = branchOrders
      .reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = branchOrders.length > 0 ? Math.round(revenue / branchOrders.length) : 0;
    const maxBranchRevenue = Math.max(
      ...branches.map(candidate => rangeData.orders
        .filter(order => order.branch === candidate.name)
        .reduce((sum, order) => sum + order.total, 0)),
      0
    );

    return {
      name: branch.name,
      code: getBranchCode(branch, index),
      orders: branchOrders.length,
      revenue,
      averageOrderValue,
      status: revenue > 0 && revenue === maxBranchRevenue ? 'TOP PERFORMER' : revenue > 0 ? 'STABLE' : 'NO DATA'
    };
  });

  const channelStats = (Object.values(
    rangeData.revenueOrders.reduce<Record<string, { channel: string; revenue: number }>>((acc, order) => {
      acc[order.channel] ??= { channel: order.channel, revenue: 0 };
      acc[order.channel].revenue += order.total;
      return acc;
    }, {})
  ) as Array<{ channel: string; revenue: number }>).sort((a, b) => b.revenue - a.revenue);

  const growthText = selectedRange === 'today'
    ? 'vs yesterday'
    : selectedRange === 'week'
      ? 'vs previous 7 days'
      : selectedRange === 'month'
        ? 'vs previous month'
        : 'vs previous period';
  const periodLabel = `${rangeData.bounds.start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${addDays(rangeData.bounds.end, -1).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  const maxProductQuantity = Math.max(...topProducts.map(product => product.quantity), 1);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time performance from Supabase orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex flex-1 md:flex-none">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Tùy chọn' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range.id as RangeKey)}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedRange === range.id ? 'bg-[#ffeae0] text-[#9d4300]' : 'text-slate-500 hover:text-[#9d4300]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          {selectedRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <CalendarDays size={15} className="text-[#f97316] shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Từ</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="min-w-0 bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <CalendarDays size={15} className="text-[#f97316] shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="min-w-0 bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {rangeData.totalRevenue > 0 && (
        <div className="bg-amber-50 border border-[#ffeae0] p-4 rounded-xl flex items-center justify-between text-sm text-[#9d4300] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]"></span>
            </span>
            <span>Doanh thu trong kỳ {periodLabel}: <strong>{formatCurrency(rangeData.totalRevenue)}</strong> từ dữ liệu đơn hàng thật.</span>
          </div>
          <button 
            onClick={() => onNavigate('Orders')} 
            className="text-xs font-bold underline hover:text-[#f97316]"
          >
            Xem đơn hàng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        <div id="stat-revenue" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden h-36">
          <div className="absolute top-0 left-0 h-full w-1.5 bg-[#f97316]"></div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue (VND)</span>
            <span className="bg-orange-50 text-[#f97316] p-2 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(rangeData.totalRevenue)}</h3>
            <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold ${rangeData.growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} />
              <span>{rangeData.growthPct >= 0 ? '+' : ''}{rangeData.growthPct.toFixed(1)}% {growthText}</span>
            </div>
          </div>
        </div>

        <div id="stat-orders" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <ShoppingBag size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{rangeData.orders.length}</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">From Supabase orders</p>
          </div>
        </div>

        <div id="stat-average-order" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Chi tiêu TB / đơn</span>
            <span className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
              <ReceiptText size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(rangeData.averageOrderValue)}</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">Tổng chi tiêu / số đơn</p>
          </div>
        </div>

        <div id="stat-completion" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Bill Capture Rate (%)</span>
            <span className="bg-purple-50 text-purple-500 p-2 rounded-lg">
              <CheckCircle size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{rangeData.billCaptureRate.toFixed(1)}%</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">Đơn có ảnh bill / tổng đơn</p>
          </div>
        </div>

        <div id="stat-products" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Products in Catalog</span>
            <span className="bg-green-50 text-green-500 p-2 rounded-lg">
              <span className="material-symbols-outlined">restaurant_menu</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{products.length}</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">From Supabase products</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-slate-900">Revenue Trends ({periodLabel})</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#9d4300]"></div>
                <span className="text-xs text-slate-500 font-medium">Revenue</span>
              </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 px-2 mt-8 border-b border-slate-100 pb-2">
              {chartData.map((day) => (
                <div key={day.label} className="w-full flex flex-col items-center group relative cursor-pointer">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-opacity shadow-md pointer-events-none z-10 whitespace-nowrap">
                    {formatCurrency(day.value)}
                  </div>
                  <div className="w-full bg-[#fff1eb] rounded-t-lg relative h-48 flex items-end overflow-hidden hover:bg-[#ffeae0]">
                    <div 
                      style={{ height: `${day.height}%` }} 
                      className="absolute bottom-0 w-full bg-[#9d4300] group-hover:bg-[#f97316] rounded-t-lg transition-colors"
                    ></div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold mt-2">{day.label}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{formatCompactCurrency(day.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-900 mb-6 font-be-vietnam">Revenue by Channel</h4>
          <div className="space-y-6">
            {channelStats.length > 0 ? channelStats.map((channel, index) => {
              const percent = rangeData.totalRevenue > 0 ? (channel.revenue / rangeData.totalRevenue) * 100 : 0;
              const colors = ['bg-blue-600', 'bg-pink-500', 'bg-blue-400', 'bg-[#f97316]', 'bg-green-500'];
              return (
                <div key={channel.channel} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md ${colors[index % colors.length]} flex items-center justify-center text-[9px] text-white font-black`}>
                        {channel.channel[0]?.toUpperCase() || '?'}
                      </span>
                      {channel.channel}
                    </span>
                    <span>{percent.toFixed(0)}% ({formatCompactCurrency(channel.revenue)} đ)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${colors[index % colors.length]} h-full rounded-full`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-400 font-bold">No channel revenue in this range.</p>
            )}
          </div>

          <div className="mt-8 bg-[#fff1eb] rounded-xl p-4 border border-[#ffeae0] text-xs text-[#9d4300] space-y-1">
            <p className="font-bold">Operational Tip:</p>
            <p className="leading-relaxed">Các chỉ số trên được tính trực tiếp từ đơn hàng Supabase trong kỳ đang chọn.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Top 5 mặt hàng được yêu thích nhất</h4>
              <p className="text-xs font-bold text-slate-400 mt-1">Xếp hạng theo số lượng bán trong kỳ {periodLabel}</p>
            </div>
            <span className="bg-orange-50 text-[#f97316] p-2 rounded-lg shrink-0">
              <Star size={20} />
            </span>
          </div>

          <div className="space-y-4">
            {topProducts.length > 0 ? topProducts.map((product, index) => {
              const percent = (product.quantity / maxProductQuantity) * 100;

              return (
                <div key={product.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#ffeae0] text-[#9d4300] flex items-center justify-center text-xs font-black shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{product.orderCount} đơn · {formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#9d4300] whitespace-nowrap">{product.quantity} phần</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${Math.max(percent, 6)}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm font-black text-slate-500">Chưa có dữ liệu mặt hàng trong kỳ này</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Hãy chọn khoảng thời gian khác hoặc tạo đơn hàng mới.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Top khách hàng chi tiêu nhiều nhất</h4>
              <p className="text-xs font-bold text-slate-400 mt-1">Tổng chi tiêu và giá trị trung bình mỗi đơn</p>
            </div>
            <button
              onClick={() => onNavigate('Customers')}
              className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
              aria-label="Xem danh sách khách hàng"
            >
              <UsersRound size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {topCustomers.length > 0 ? topCustomers.map((customer, index) => {
              const initials = customer.name
                .split(' ')
                .filter(Boolean)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'KH';

              return (
                <div key={customer.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#9d4300] flex items-center justify-center text-xs font-black">
                        {initials}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">
                        {customer.phone} · {customer.totalOrders} đơn · TB {formatCurrency(customer.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(customer.totalSpend)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Tổng chi tiêu</p>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm font-black text-slate-500">Chưa có khách hàng trong kỳ này</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Dữ liệu được tổng hợp từ đơn hàng đã lưu.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-900">Revenue by Branch</h4>
          <span className="text-xs font-bold text-[#faf0eb] bg-[#9d4300] px-3 py-1 rounded-full flex items-center gap-1">
            Active Nodes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Branch Name</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Revenue (VND)</th>
                <th className="px-6 py-4">Avg Order Value</th>
                <th className="px-6 py-4 text-right">Hiệu suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-be-vietnam">
              {branchStats.map((branch, index) => {
                let badgeClass = '';
                if (branch.status === 'TOP PERFORMER') badgeClass = 'bg-green-100 text-green-700';
                else if (branch.status === 'STABLE') badgeClass = 'bg-blue-100 text-blue-700';
                else badgeClass = 'bg-slate-100 text-slate-500';

                let avBg = '';
                if (index % 3 === 0) avBg = 'bg-orange-100 text-orange-600';
                else if (index % 3 === 1) avBg = 'bg-blue-100 text-blue-600';
                else avBg = 'bg-purple-100 text-purple-600';

                return (
                  <tr key={branch.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${avBg}`}>
                          {branch.code}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{branch.orders}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(branch.revenue)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatCurrency(branch.averageOrderValue)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase ${badgeClass}`}>
                        {branch.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
