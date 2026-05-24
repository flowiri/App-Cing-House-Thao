import React, { useMemo, useState } from 'react';
import { Branch, Order, Product } from '../types';
import { TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react';

interface DashboardViewProps {
  branches: Branch[];
  orders: Order[];
  products: Product[];
  onNavigate: (view: string) => void;
}

type RangeKey = 'today' | 'week' | 'month';

type DateBounds = {
  start: Date;
  end: Date;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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

export default function DashboardView({ branches, orders, products, onNavigate }: DashboardViewProps) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>('week');

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
    const bounds = getBounds(selectedRange);
    const previousBounds = getPreviousBounds(selectedRange, bounds);

    const isInBounds = (order: Order, targetBounds: DateBounds) => {
      const placedAt = parseOrderDate(order);
      if (!placedAt) return false;
      return placedAt >= targetBounds.start && placedAt < targetBounds.end;
    };

    const currentOrders = orders.filter(order => isInBounds(order, bounds));
    const previousOrders = orders.filter(order => isInBounds(order, previousBounds));
    const revenueOrders = currentOrders.filter(order => order.status !== 'CANCELLED');
    const previousRevenueOrders = previousOrders.filter(order => order.status !== 'CANCELLED');

    const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousRevenueOrders.reduce((sum, order) => sum + order.total, 0);
    const completedOrders = currentOrders.filter(order => order.status === 'COMPLETED').length;
    const completionRate = currentOrders.length > 0 ? (completedOrders / currentOrders.length) * 100 : 0;
    const growthPct = previousRevenue === 0
      ? (totalRevenue > 0 ? 100 : 0)
      : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

    return {
      bounds,
      orders: currentOrders,
      revenueOrders,
      totalRevenue,
      completionRate,
      growthPct
    };
  }, [orders, selectedRange]);

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
    const values = days.map((day) => {
      const end = addDays(day, 1);
      return orders
        .filter(order => {
          const placedAt = parseOrderDate(order);
          return placedAt && placedAt >= day && placedAt < end && order.status !== 'CANCELLED';
        })
        .reduce((sum, order) => sum + order.total, 0);
    });
    const maxRevenue = Math.max(...values, 1);

    return days.map((day, index) => ({
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      value: values[index],
      height: values[index] === 0 ? 4 : Math.max(8, Math.round((values[index] / maxRevenue) * 100))
    }));
  }, [orders]);

  const branchStats = branches.map((branch, index) => {
    const branchOrders = rangeData.orders.filter(order => order.branch === branch.name);
    const revenue = branchOrders
      .filter(order => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = branchOrders.length > 0 ? Math.round(revenue / branchOrders.length) : 0;
    const maxBranchRevenue = Math.max(
      ...branches.map(candidate => rangeData.orders
        .filter(order => order.branch === candidate.name && order.status !== 'CANCELLED')
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
      : 'vs previous month';

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
              { id: 'month', label: 'This Month' }
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
        </div>
      </div>

      {rangeData.totalRevenue > 0 && (
        <div className="bg-amber-50 border border-[#ffeae0] p-4 rounded-xl flex items-center justify-between text-sm text-[#9d4300] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]"></span>
            </span>
            <span>Doanh thu trong kỳ đã chọn: <strong>{formatCurrency(rangeData.totalRevenue)}</strong> từ dữ liệu đơn hàng thật.</span>
          </div>
          <button 
            onClick={() => onNavigate('Orders')} 
            className="text-xs font-bold underline hover:text-[#f97316]"
          >
            Xem đơn hàng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div id="stat-completion" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completion Rate (%)</span>
            <span className="bg-purple-50 text-purple-500 p-2 rounded-lg">
              <CheckCircle size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{rangeData.completionRate.toFixed(1)}%</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">Completed / total orders</p>
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
              <h4 className="text-lg font-bold text-slate-900">Revenue Trends (Last 7 Days)</h4>
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
            <p className="font-bold">💡 Operational Tip:</p>
            <p className="leading-relaxed">Các chỉ số trên được tính trực tiếp từ đơn hàng Supabase trong kỳ đang chọn.</p>
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
                <th className="px-6 py-4 text-right">Status</th>
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
