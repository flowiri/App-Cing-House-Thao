import React, { useState } from 'react';
import { Order } from '../types';
import { ArrowLeft, Printer, Trash2 } from 'lucide-react';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onDeleteOrder: (orderId: string) => Promise<boolean>;
}

export default function OrderDetailView({ order, onBack, onDeleteOrder }: OrderDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa đơn ${order.id} của ${order.customerName}?`)) return;

    setIsDeleting(true);
    try {
      await onDeleteOrder(order.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#9d4300] hover:text-[#f97316] font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách đơn
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đơn hàng {order.id}</h2>
          <p className="text-slate-400 text-xs font-medium">Ghi lúc {order.placedTimeFull}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => window.print()}
            disabled={isDeleting}
            className="flex-1 md:flex-none px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-60"
          >
            <Printer size={16} /> In bill
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 md:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> {isDeleting ? 'Đang xóa...' : 'Xóa đơn'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-[#9d4300]">
                <span className="material-symbols-outlined text-[20px]">person</span>
                <h3 className="font-bold text-sm">Khách hàng</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-medium">Tên</span>
                  <span className="font-bold text-slate-800 text-right">{order.customerName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-medium">SĐT</span>
                  <span className="font-bold text-slate-800 text-right">{order.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-[#9d4300]">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                <h3 className="font-bold text-sm">Thông tin đơn</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-medium">Chi nhánh</span>
                  <span className="font-bold text-slate-800 text-right">{order.branch}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-medium">Kênh</span>
                  <span className="font-bold text-slate-800 text-right">{order.channel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="font-bold text-base text-slate-900">Món khách order</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tên món</th>
                    <th className="px-6 py-4 text-center">SL</th>
                    <th className="px-6 py-4 text-right">Đơn giá</th>
                    <th className="px-6 py-4 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/20">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5 font-mono">Mã món: {item.sku}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-medium">{formatMoney(item.price)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 text-sm border-t border-slate-100">
                  <tr>
                    <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Tạm tính</td>
                    <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.subtotal)}</td>
                  </tr>
                  {order.shippingFee > 0 && (
                    <tr>
                      <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Phí giao hàng</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.shippingFee)}</td>
                    </tr>
                  )}
                  {order.serviceFee && order.serviceFee > 0 ? (
                    <tr>
                      <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Phí dịch vụ</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.serviceFee)}</td>
                    </tr>
                  ) : null}
                  <tr className="bg-orange-50/40">
                    <td className="px-6 py-4 text-right font-black text-[#9d4300]" colSpan={3}>Tổng tiền</td>
                    <td className="px-6 py-4 text-right font-black text-[#9d4300] text-lg">{formatMoney(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="bg-[#fff1eb] border border-[#ffeae0] text-[#9d4300] p-5 rounded-xl space-y-1">
              <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">sticky_note_2</span> Ghi chú
              </span>
              <p className="text-sm font-medium">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">image</span>
              Ảnh bill
            </h3>
            {order.screenshot ? (
              <div className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <img
                  className="w-full h-full object-cover"
                  src={order.screenshot}
                  alt="Ảnh bill"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                <span className="material-symbols-outlined text-[32px] mb-2 text-slate-300">hide_image</span>
                <span className="text-xs font-bold font-be-vietnam">Không có ảnh bill đi kèm</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">history</span>
              Nhật ký ghi đơn
            </h3>
            <div className="space-y-4">
              {(order.history || []).length > 0 ? (order.history || []).map((log, idx) => (
                <div key={log.id || idx} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-700 leading-tight">
                    <span className="font-black text-slate-900">{log.actor}: </span>
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">{log.timestamp}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-400 font-bold">Chưa có nhật ký.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
