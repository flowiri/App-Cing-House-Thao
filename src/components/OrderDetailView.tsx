import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { ArrowLeft, Printer, CheckCircle, PersonStanding, Info, Image as ImageIcon, History, ClipboardCheck } from 'lucide-react';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export default function OrderDetailView({ order, onBack, onUpdateStatus }: OrderDetailViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [historyTrail, setHistoryTrail] = useState(order.history || []);

  const handleStatusChangeSubmit = () => {
    // Perform update
    onUpdateStatus(order.id, selectedStatus);

    // Update internal log visualization
    const now = new Date();
    const minStr = String(now.getMinutes()).padStart(2, '0');
    const hrStr = String(now.getHours()).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const monStr = String(now.getMonth() + 1).padStart(2, '0');

    const newLog = {
      id: `log-live-${Date.now()}`,
      actor: 'Admin Manager',
      action: `changed status to ${selectedStatus}`,
      timestamp: `${hrStr}:${minStr} ${dayStr}/${monStr}`
    };

    setHistoryTrail([newLog, ...historyTrail]);
  };

  const handleMarkReady = () => {
    onUpdateStatus(order.id, 'COMPLETED');
    setSelectedStatus('COMPLETED');
    
    const now = new Date();
    const minStr = String(now.getMinutes()).padStart(2, '0');
    const hrStr = String(now.getHours()).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const monStr = String(now.getMonth() + 1).padStart(2, '0');

    const newLog = {
      id: `log-live-ready-${Date.now()}`,
      actor: 'Admin Manager',
      action: `marked order as READY / COMPLETED`,
      timestamp: `${hrStr}:${minStr} ${dayStr}/${monStr}`
    };

    setHistoryTrail([newLog, ...historyTrail]);
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      {/* Back & Breadcrumb bar */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#9d4300] hover:text-[#f97316] font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Order List
      </button>

      {/* Main summary bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order {order.id}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              order.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
              order.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' :
              order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <ClipboardCheck size={12} />
              {order.status}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium">Placed on {order.placedTimeFull}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-xs"
          >
            <Printer size={16} /> Print Receipt
          </button>
          {order.status !== 'COMPLETED' && (
            <button 
              onClick={handleMarkReady}
              className="flex-1 md:flex-none px-5 py-2.5 bg-[#9d4300] hover:bg-[#f97316] text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs shadow-md shadow-orange-100"
            >
              <CheckCircle size={16} /> Mark Ready
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metadata side-by-side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-[#9d4300]">
                <span className="material-symbols-outlined text-[20px]">person</span>
                <h3 className="font-bold text-sm">Customer Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Name</span>
                  <span className="font-bold text-slate-800">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Phone</span>
                  <span className="font-bold text-slate-800">{order.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email</span>
                  <span className="font-bold text-slate-800 break-all">{order.customerEmail || 'No Email'}</span>
                </div>
              </div>
            </div>

            {/* Order channel info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-[#9d4300]">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <h3 className="font-bold text-sm">Order Logistics</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Branch</span>
                  <span className="font-bold text-slate-800">{order.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Channel</span>
                  <span className="font-bold text-slate-800">{order.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium font-sans">Table / Ref</span>
                  <span className="font-bold text-slate-800">{order.tableRef || 'Manual Delivery'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Receipt */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="font-bold text-base text-slate-900">Itemized Receipt</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5 font-mono">{item.sku}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-medium">{formatMoney(item.price)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 text-sm border-t border-slate-100">
                  <tr>
                    <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Subtotal</td>
                    <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.subtotal)}</td>
                  </tr>
                  {order.shippingFee > 0 && (
                    <tr>
                      <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Shipping Fee</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.shippingFee)}</td>
                    </tr>
                  )}
                  {order.serviceFee && order.serviceFee > 0 ? (
                    <tr>
                      <td className="px-6 py-3 text-right font-bold text-slate-500" colSpan={3}>Service Fee (10%)</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800">{formatMoney(order.serviceFee)}</td>
                    </tr>
                  ) : null}
                  <tr className="bg-orange-50/40">
                    <td className="px-6 py-4 text-right font-black text-[#9d4300]" colSpan={3}>Grand Total</td>
                    <td className="px-6 py-4 text-right font-black text-[#9d4300] text-lg">{formatMoney(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes display */}
          {order.notes && (
            <div className="bg-[#fff1eb] border border-[#ffeae0] text-[#9d4300] p-5 rounded-xl space-y-1">
              <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">sticky_note_2</span> Order Notes
              </span>
              <p className="text-sm font-medium">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Side Actions (Updating status and Screenshot check) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Update Form */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-[#f97316] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">edit_note</span>
              Update Order Status
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9d4300]"
                >
                  <option value="NEW">New</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <button 
                onClick={handleStatusChangeSubmit}
                className="w-full py-2.5 bg-[#f97316] hover:bg-[#9d4300] text-white text-xs font-black rounded-lg shadow transition-colors"
              >
                Confirm Update
              </button>
            </div>
          </div>

          {/* DM Screenshot Preview */}
          {order.screenshot ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined">image</span>
                Channel Screenshot
              </h3>
              <div className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                <img 
                  className="w-full h-full object-cover" 
                  src={order.screenshot} 
                  alt="Conversational Verification"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined">image</span>
                Channel Screenshot
              </h3>
              <div className="aspect-[4/5] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                <span className="material-symbols-outlined text-[32px] mb-2 text-slate-300">hide_image</span>
                <span className="text-xs font-bold font-be-vietnam">Không có screenshot đi kèm</span>
                <span className="text-[10px] text-slate-400 mt-1">Đơn hàng được ghi tay nội bộ</span>
              </div>
            </div>
          )}

          {/* Timeline audit log */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">history</span>
              Order History/Logs
            </h3>
            <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {historyTrail.map((log: any, idx: number) => {
                const markCompleted = log.action.includes('Completed') || log.action.includes('READY');
                const markProcessing = log.action.includes('Processing');
                return (
                  <div key={log.id || idx} className="relative pl-8 animate-fade-in">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                      markCompleted ? 'bg-green-100' :
                      markProcessing ? 'bg-orange-100' : 'bg-slate-100'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        markCompleted ? 'bg-green-600' :
                        markProcessing ? 'bg-[#f97316]' : 'bg-slate-400'
                      }`}></span>
                    </div>
                    <div className="text-xs text-slate-700 leading-tight">
                      <span className="font-black text-slate-900">{log.actor} </span>
                      {log.action.includes('changed status to') ? (
                        <span>
                          changed status to{' '}
                          <strong className={
                            log.action.includes('Completed') ? 'text-green-600' :
                            log.action.includes('Processing') ? 'text-[#f97316]' :
                            log.action.includes('CANCELLED') ? 'text-red-500' : 'text-blue-500'
                          }>
                            {log.action.split('changed status to')[1]}
                          </strong>
                        </span>
                      ) : (
                        <span>{log.action}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold">{log.timestamp}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
