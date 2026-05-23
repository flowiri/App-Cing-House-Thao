import React, { useState } from 'react';
import { Order, Product } from '../types';
import { TrendingUp, ShoppingBag, CheckCircle, BarChart3, Store } from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
  onNavigate: (view: string) => void;
}

export default function DashboardView({ orders, products, onNavigate }: DashboardViewProps) {
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month'>('week');

  // Realistic fallback analytics matching Mock screenshots
  const getAnalytics = () => {
    switch (selectedRange) {
      case 'today':
        return {
          revenue: '185.400.000 đ',
          ordersCount: '624',
          completionRate: '99.1%',
          growth: '+1.8%',
          growthText: 'Since yesterday',
          barHeights: [20, 45, 60, 40, 55, 90, 75],
          amounts: ['120M', '220M', '280M', '200M', '260M', '400M', '350M'],
          branches: [
            { name: 'Quận 1', code: 'Q1', orders: 254, revenue: '78,200,000 đ', avg: '308,000 đ', status: 'TOP PERFORMER', color: 'orange' },
            { name: 'Quận 3', code: 'Q3', orders: 198, revenue: '59,800,000 đ', avg: '302,000 đ', status: 'STABLE', color: 'blue' },
            { name: 'Bình Thạnh', code: 'BT', orders: 172, revenue: '47,400,000 đ', avg: '275,000 đ', status: 'GROWING', color: 'purple' },
          ]
        };
      case 'month':
        return {
          revenue: '5.294.800.000 đ',
          ordersCount: '19,342',
          completionRate: '98.1%',
          growth: '+18.5%',
          growthText: 'Steady Increase',
          barHeights: [70, 75, 80, 85, 65, 95, 90],
          amounts: ['750M', '800M', '850M', '900M', '700M', '1.1B', '1.0B'],
          branches: [
            { name: 'Quận 1', code: 'Q1', orders: 7852, revenue: '2,242,000,000 đ', avg: '285,000 đ', status: 'TOP PERFORMER', color: 'orange' },
            { name: 'Quận 3', code: 'Q3', orders: 6124, revenue: '1,684,000,000 đ', avg: '275,000 đ', status: 'STABLE', color: 'blue' },
            { name: 'Bình Thạnh', code: 'BT', orders: 5366, revenue: '1,368,800,000 đ', avg: '255,000 đ', status: 'GROWING', color: 'purple' },
          ]
        };
      case 'week':
      default:
        return {
          revenue: '1.284.500.000 đ',
          ordersCount: '4,821',
          completionRate: '98.4%',
          growth: '+14.2%',
          growthText: 'Steady Increase',
          barHeights: [45, 55, 65, 80, 50, 95, 75],
          amounts: ['150M', '180M', '240M', '380M', '210M', '450M', '330M'],
          branches: [
            { name: 'Quận 1', code: 'Q1', orders: 1942, revenue: '542,000,000 đ', avg: '279,000 đ', status: 'TOP PERFORMER', color: 'orange' },
            { name: 'Quận 3', code: 'Q3', orders: 1520, revenue: '412,000,000 đ', avg: '271,000 đ', status: 'STABLE', color: 'blue' },
            { name: 'Bình Thạnh', code: 'BT', orders: 1359, revenue: '330,500,000 đ', avg: '243,000 đ', status: 'GROWING', color: 'purple' },
          ]
        };
    }
  };

  const currentStats = getAnalytics();

  // Compute live additions to make the app interactive
  const totalLiveRevenue = orders
    .filter(o => o.status === 'COMPLETED' || o.status === 'PROCESSING')
    .reduce((sum, o) => sum + o.total, 0);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time financial performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex flex-1 md:flex-none">
            <button
              onClick={() => setSelectedRange('today')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRange === 'today' ? 'bg-[#ffeae0] text-[#9d4300]' : 'text-slate-500 hover:text-[#9d4300]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedRange('week')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRange === 'week' ? 'bg-[#ffeae0] text-[#9d4300]' : 'text-slate-500 hover:text-[#9d4300]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedRange('month')}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedRange === 'month' ? 'bg-[#ffeae0] text-[#9d4300]' : 'text-slate-500 hover:text-[#9d4300]'
              }`}
            >
              This Month
            </button>
          </div>
          <button 
            disabled
            className="bg-[#f97316] hover:bg-[#9d4300] cursor-not-allowed opacity-90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Live Order Notice (if any) */}
      {totalLiveRevenue > 0 && (
        <div className="bg-amber-50 border border-[#ffeae0] p-4 rounded-xl flex items-center justify-between text-sm text-[#9d4300] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]"></span>
            </span>
            <span>Bạn vừa ghi nhận thêm <strong>{formatCurrency(totalLiveRevenue)}</strong> doanh thu từ các đơn hàng mới trong phiên làm việc!</span>
          </div>
          <button 
            onClick={() => onNavigate('Orders')} 
            className="text-xs font-bold underline hover:text-[#f97316]"
          >
            Xem đơn hàng
          </button>
        </div>
      )}

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div id="stat-revenue" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden h-36">
          <div className="absolute top-0 left-0 h-full w-1.5 bg-[#f97316]"></div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue (VND)</span>
            <span className="bg-orange-50 text-[#f97316] p-2 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(parseFloat(currentStats.revenue.replace(/[^0-9]/g, '')) + totalLiveRevenue)}
            </h3>
            <div className="flex items-center gap-1 text-green-600 mt-1 text-[11px] font-bold">
              <TrendingUp size={14} />
              <span>+12.5% vs last week</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div id="stat-orders" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <ShoppingBag size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(parseFloat(currentStats.ordersCount.replace(/[^0-9]/g, '')) + orders.length)}
            </h3>
            <div className="flex items-center gap-1 text-green-600 mt-1 text-[11px] font-bold">
              <TrendingUp size={14} />
              <span>+8.2% vs last week</span>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div id="stat-[#fce3d9]" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completion Rate (%)</span>
            <span className="bg-purple-50 text-purple-500 p-2 rounded-lg">
              <CheckCircle size={20} />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{currentStats.completionRate}</h3>
            <div className="flex items-center gap-1 text-green-600 mt-1 text-[11px] font-bold">
              <TrendingUp size={14} />
              <span>+0.4% vs last week</span>
            </div>
          </div>
        </div>

        {/* Growth vs Last Period */}
        <div id="stat-growth" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Growth vs Last Period</span>
            <span className="bg-green-50 text-green-500 p-2 rounded-lg">
              <span className="material-symbols-outlined">show_chart</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">{currentStats.growth}</h3>
            <div className="flex items-center gap-1 text-green-600 mt-1 text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span className="font-bold">{currentStats.growthText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Chart Area */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-slate-900">Revenue Trends (Daily)</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#9d4300]"></div>
                  <span className="text-xs text-slate-500 font-medium">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-xs text-slate-500 font-medium">Previous Period</span>
                </div>
              </div>
            </div>

            {/* Simulated interactive bar chart with live hover values */}
            <div className="h-64 flex items-end justify-between gap-4 px-2 mt-8 border-b border-slate-100 pb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heightPercent = currentStats.barHeights[idx];
                const prevHeight = Math.max(15, heightPercent - 15);
                const val = currentStats.amounts[idx];
                return (
                  <div key={day} className="w-full flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition-opacity shadow-md pointer-events-none z-10 whitespace-nowrap">
                      {val}
                    </div>

                    <div className="w-full bg-[#fff1eb] rounded-t-lg relative h-48 flex items-end overflow-hidden hover:bg-[#ffeae0]">
                      {/* Previous Period marker bar */}
                      <div 
                        style={{ height: `${prevHeight}%` }} 
                        className="absolute bottom-0 left-0 w-1/4 bg-slate-200 rounded-t-sm"
                      ></div>
                      {/* Match screenshot: current revenue bar */}
                      <div 
                        style={{ height: `${heightPercent}%` }} 
                        className="absolute bottom-0 w-full bg-[#9d4300] group-hover:bg-[#f97316] rounded-t-lg transition-colors"
                      ></div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold mt-2">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Channel Share */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-900 mb-6 font-be-vietnam">Revenue by Channel</h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <img 
                    className="w-5 h-5 rounded object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5evo2aCu7YMXBOfVEHMnGxJbFtfzuaEVBmzcTouOTFOcyOpEpLXF1sn6Zsr872oGQmYa31Tzf5esvNryOKTeM3aZcqwfp3UOi8WnVAf2LGOFWPP93LRleF7JVmLil8jRIqSOqNEGyvO0xPg1oL0w09ULUALOt_bGjQrRIenyWs9LQPjzmLl74s-iGdt6Omv8BXfYKj4vx6KCFpfRQcRW4G863aDqdKJIV_qPdfGaQxS-7mAFB0Dvgwfb0cv7ZCy9qXFkDNBkkX8Y" 
                    alt="Facebook"
                  />
                  Facebook
                </span>
                <span>42% (539M đ)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <img 
                    className="w-5 h-5 rounded object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOlDQhrXqIfiz2H-yisY12d8XXQ7Qpy_t6_Q41F79b1dGdQe8SSLp-38lJ5BhETBjxccmhoRZzxyVBgFah5H8Bji3k55mv_8CtqCwaCAkaiCiLPAsq_uvLQB_SGXX2Ti-l9UwojmClDzq-M1Mmd-aU7j_OtQ3Cnl0eyHVtPW9Dkuo8wlEzZVmiYVJQaagVwo8mZorVGSDrwJ1-c3p7ODtEl0v0i_7ZZgB5QqW7QXw8BW1pIMwtVax-YPY6fdK-o0dEtsfqi1To5eg" 
                    alt="Instagram"
                  />
                  Instagram
                </span>
                <span>35% (449M đ)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 font-sans">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-400 flex items-center justify-center text-[9px] text-white font-black">Z</span>
                  Zalo
                </span>
                <span>23% (295M đ)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#fff1eb] rounded-xl p-4 border border-[#ffeae0] text-xs text-[#9d4300] space-y-1">
            <p className="font-bold">💡 Operational Tip:</p>
            <p className="leading-relaxed">Doanh thu qua MXH Facebook tăng 15% trong tuần này. Cân nhắc chạy thêm ưu đãi tích điểm cho khách Zalo để cân đối các kênh.</p>
          </div>
        </div>
      </div>

      {/* Revenue by Branch Table */}
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
              {currentStats.branches.map((branch) => {
                let badgeClass = '';
                if (branch.status === 'TOP PERFORMER') badgeClass = 'bg-green-100 text-green-700';
                else if (branch.status === 'STABLE') badgeClass = 'bg-blue-100 text-blue-700';
                else badgeClass = 'bg-orange-100 text-orange-700';

                let avBg = '';
                if (branch.code === 'Q1') avBg = 'bg-orange-100 text-orange-600';
                else if (branch.code === 'Q3') avBg = 'bg-blue-100 text-blue-600';
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
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{branch.revenue}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{branch.avg}</td>
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
