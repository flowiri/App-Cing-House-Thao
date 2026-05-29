import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { Download, Search, Star, UserRound, UsersRound, WalletCards } from 'lucide-react';

interface CustomerDataViewProps {
  orders: Order[];
}

type FavoriteItem = {
  name: string;
  quantity: number;
  orderCount: number;
  spend: number;
};

type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  favoriteItem?: FavoriteItem;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function getCustomerKey(order: Order) {
  const phoneKey = normalizePhone(order.customerPhone);
  if (phoneKey) return `phone:${phoneKey}`;
  return `name:${order.customerName.trim().toLowerCase() || 'unknown'}`;
}

export default function CustomerDataView({ orders }: CustomerDataViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const customers = useMemo<CustomerSummary[]>(() => {
    const customerMap = new Map<string, CustomerSummary & { itemMap: Map<string, FavoriteItem> }>();

    orders.forEach((order) => {
      const key = getCustomerKey(order);
      const existing = customerMap.get(key);
      const customer = existing ?? {
        key,
        name: order.customerName || 'Khách chưa có tên',
        phone: order.customerPhone || 'Chưa có SĐT',
        totalOrders: 0,
        totalSpend: 0,
        itemMap: new Map<string, FavoriteItem>()
      };

      if (!customer.name && order.customerName) customer.name = order.customerName;
      if (!customer.phone && order.customerPhone) customer.phone = order.customerPhone;

      customer.totalOrders += 1;
      customer.totalSpend += order.total;

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
          favoriteItem
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
      (customer.favoriteItem?.name.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
  const bestCustomer = customers[0];

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý khách hàng</h2>
          <p className="text-slate-500 mt-1">Tổng hợp khách hàng từ dữ liệu đơn hàng đã lưu.</p>
        </div>
        <button
          onClick={() => alert(`Đã chuẩn bị xuất ${filteredCustomers.length} khách hàng sang bảng tính.`)}
          className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm self-start md:self-auto"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng đơn hàng</span>
            <span className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <UserRound size={18} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-4">{totalOrders}</p>
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
            placeholder="Tìm tên khách hàng, số điện thoại hoặc món ưa thích..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#f97316] focus:outline-none text-sm transition-all text-slate-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredCustomers.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-[#fffcfb] border-b border-slate-100">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Tên khách hàng</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4 text-center">Tổng đơn hàng</th>
                  <th className="px-6 py-4 text-right">Tổng chi tiêu</th>
                  <th className="px-6 py-4">Món ưa thích</th>
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
                    <tr key={customer.key} className="hover:bg-slate-50/50 transition-colors">
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-black text-slate-800 text-xs">{formatMoney(customer.totalSpend)}</span>
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
    </div>
  );
}
