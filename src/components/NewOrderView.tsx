import React, { useState } from 'react';
import { Product, Order, OrderItem, OrderStatus } from '../types';
import { ShoppingBasket, Search, Plus, Trash, Trash2, HelpCircle, Save, Info } from 'lucide-react';

interface NewOrderViewProps {
  products: Product[];
  onAddOrder: (newOrder: Order) => void;
  onNavigate: (view: string) => void;
}

export default function NewOrderView({ products, onAddOrder, onNavigate }: NewOrderViewProps) {
  // Core states
  const [selectedBranch, setSelectedBranch] = useState('Quận 1');
  const [selectedChannel, setSelectedChannel] = useState('Facebook');
  const [lineItems, setLineItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Searching products
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Totals
  const [shippingFee, setShippingFee] = useState(15000);
  const [customGrandTotal, setCustomGrandTotal] = useState<string>(''); // if empty, compute standard subtotal + ship fee
  
  // Mock image upload state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Computed subtotal
  const computedSubtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const computedGrandTotal = computedSubtotal + (computedSubtotal > 0 ? shippingFee : 0);

  // Handle adding product from type-ahead search
  const handleAddProduct = (product: Product) => {
    // Check if product is already in lineItems
    const exists = lineItems.find(item => item.id === product.id);
    if (exists) {
      const updated = lineItems.map(item => {
        if (item.id === product.id) {
          const newQty = item.quantity + 1;
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.price
          };
        }
        return item;
      });
      setLineItems(updated);
    } else {
      const newItem: OrderItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        price: product.price,
        subtotal: product.price
      };
      setLineItems([...lineItems, newItem]);
    }
    setProductSearchQuery('');
    setShowSearchResults(false);
  };

  // Adjust line item quantity
  const handleAdjustQuantity = (itemId: string, direction: 'up' | 'down') => {
    const updated = lineItems.map(item => {
      if (item.id === itemId) {
        let newQty = direction === 'up' ? item.quantity + 1 : item.quantity - 1;
        if (newQty < 1) newQty = 1;
        return {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.price
        };
      }
      return item;
    }).filter(Boolean);
    setLineItems(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    setLineItems(lineItems.filter(it => it.id !== itemId));
  };

  // Drag-and-drop handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Simulate screenshot uploaded
    setAttachedImage('https://lh3.googleusercontent.com/aida-public/AB6AXuAFROfYpY49XA371zE4lQ1OzjseIuujNWfC-bSlmoYP96TimhS8euGXbYhXZglU8Dl02qt4KTISHxWsufW5coAzLmfhnOYufR7vjc_SnYGqCEFp5Gntr5chEKxF0ZZ7wJKAEiWmobSg0O622fHpMIbuZWNFteC_Pn5Nyg3LpfKJ56BWUI7LVB1fPXjlX9GiAcfks88AZQm5bQyoutVS0BlFX2Vhr7fKAWallvS47sJQmdKEkH-SpHGX6qwVjdMxv4aXNzvyulb50Bk');
  };

  const handleTriggerFileSelect = () => {
    // Select primary simulation screenshot automatically
    setAttachedImage('https://lh3.googleusercontent.com/aida-public/AB6AXuAFROfYpY49XA371zE4lQ1OzjseIuujNWfC-bSlmoYP96TimhS8euGXbYhXZglU8Dl02qt4KTISHxWsufW5coAzLmfhnOYufR7vjc_SnYGqCEFp5Gntr5chEKxF0ZZ7wJKAEiWmobSg0O622fHpMIbuZWNFteC_Pn5Nyg3LpfKJ56BWUI7LVB1fPXjlX9GiAcfks88AZQm5bQyoutVS0BlFX2Vhr7fKAWallvS47sJQmdKEkH-SpHGX6qwVjdMxv4aXNzvyulb50Bk');
  };

  // Submissions handler
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm vào đơn hàng.');
      return;
    }

    // Capture explicit grand total or fallback to calculated fields
    const parsedCustom = customGrandTotal ? parseFloat(customGrandTotal.replace(/[^0-9]/g, '')) : NaN;
    const finalTotal = isNaN(parsedCustom) ? computedGrandTotal : parsedCustom;

    const prefix = 'OH-';
    const randId = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#${prefix}${randId}`;

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const minStr = String(now.getMinutes()).padStart(2, '0');
    const hrStr = String(now.getHours()).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const monStr = months[now.getMonth()];
    const yrStr = now.getFullYear();

    const newOrder: Order = {
      id: orderId,
      placedTime: `${monStr} ${dayStr}, ${yrStr}`,
      placedTimeFull: `${monStr} ${dayStr}, ${yrStr} • ${hrStr}:${minStr} ${hrStr >= '12' ? 'PM' : 'AM'}`,
      customerName: 'Khách hàng Ghi Tay',
      customerPhone: '+84 908 ' + Math.floor(100000 + Math.random() * 900000),
      customerEmail: 'manual_customer@orderhub.vn',
      branch: selectedBranch,
      channel: selectedChannel,
      items: lineItems,
      subtotal: computedSubtotal,
      shippingFee: computedSubtotal > 0 ? shippingFee : 0,
      total: finalTotal,
      status: 'NEW',
      notes: orderNotes,
      screenshot: attachedImage || undefined,
      createdBy: 'Admin_Manager_01',
      history: [
        { id: `log-cr-${Date.now()}`, actor: 'Admin_Manager_01', action: `Order created manually via sales entry terminal`, timestamp: `${hrStr}:${minStr} ${dayStr}/${now.getMonth() + 1}` }
      ]
    };

    onAddOrder(newOrder);
    alert('Lưu đơn hàng thành công! Trở về danh sách đơn hàng để kiểm tra.');
    onNavigate('Orders');
  };

  const handleDiscard = () => {
    if (confirm('Bạn có chắc muốn hủy bỏ toàn bộ nội dung của đơn hàng này?')) {
      setLineItems([]);
      setOrderNotes('');
      setCustomGrandTotal('');
      setAttachedImage(null);
    }
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const activeSearchSuggestions = products.filter(p => {
    if (!productSearchQuery) return false;
    return p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
           p.sku.toLowerCase().includes(productSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-[#9d4300] font-bold text-xs uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>Sales Operations</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Order Entry</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the details below to log a new customer order manually.</p>
      </div>

      <form onSubmit={handleSaveOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Row Column 1: Core Logistics & Selection lists */}
        <div className="lg:col-span-8 space-y-6">
          {/* Branch & Channel Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Selector */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Branch Selector</label>
                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 rounded-lg border-2 border-slate-200 focus:border-[#f97316] focus:outline-none appearance-none bg-white font-bold text-sm text-slate-800"
                  >
                    <option value="Quận 1">Quận 1</option>
                    <option value="Quận 3">Quận 3</option>
                    <option value="Bình Thạnh">Bình Thạnh</option>
                    <option value="Downtown Central">Downtown Central</option>
                    <option value="Uptown Hub">Uptown Hub</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Sales Channels */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sales Channel</label>
                <div className="flex gap-2">
                  {['Facebook', 'Instagram', 'Zalo'].map(channel => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setSelectedChannel(channel)}
                      className={`flex-1 h-12 rounded-lg border-2 font-bold text-xs transition-all ${
                        selectedChannel === channel
                          ? 'border-[#f97316] bg-[#fff1eb] text-[#9d4300]'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product selection card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBasket className="text-[#9d4300]" size={20} />
              Product Selection
            </h2>
            <div className="space-y-4">
              {/* Search typing suggestions bar */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Gõ tên món ăn hoặc mã vạch SKU để thêm... (ví dụ: Matcha, Cà phê)"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-200 focus:border-[#f97316] focus:outline-none text-sm text-slate-800"
                />

                {/* Suggestions popover panel */}
                {showSearchResults && productSearchQuery && (
                  <div className="absolute top-13 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {activeSearchSuggestions.length > 0 ? (
                      activeSearchSuggestions.map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-lg object-cover" src={product.image} alt={product.name} />
                            <div>
                              <div className="text-xs font-bold text-slate-800">{product.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{product.sku}</div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-800">{formatMoney(product.price)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-xs text-slate-400 text-center font-bold">Không tìm thấy sản phẩm trùng khớp</p>
                    )}
                  </div>
                )}
              </div>

              {/* Items currently ordered list table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#fffcfb] text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Product Item</th>
                      <th className="px-4 py-3 text-center">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {lineItems.length > 0 ? (
                      lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/20">
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustQuantity(item.id, 'down')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-black text-sm"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleAdjustQuantity(item.id, 'up')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-black text-sm"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-slate-500">{formatMoney(item.price)}</td>
                          <td className="px-4 py-4 text-right font-black text-[#9d4300]">{formatMoney(item.subtotal)}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                          Chưa có sản phẩm nào được chọn. Hãy gõ tìm kiếm phía trên để thêm món.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
              <span>Order Notes</span>
            </label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Ghi chú đóng gói, thời gian giao hàng, dị ứng hoặc yêu cầu đặc biệt của khách..."
              className="w-full text-sm rounded-xl p-4 border-2 border-slate-200 focus:border-[#f97316] focus:outline-none h-28 resize-none text-slate-800"
            ></textarea>
          </div>
        </div>

        {/* Row Column 2: Total details & metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Subtotal calculations list */}
          <div className="bg-[#f97316] text-white rounded-2xl p-6 shadow-lg shadow-orange-100 space-y-6">
            <div className="space-y-3 text-xs font-medium">
              <div className="flex justify-between items-center opacity-90">
                <span>Subtotal</span>
                <span className="font-bold">{formatMoney(computedSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center opacity-90">
                <span>Shipping Fee</span>
                <span className="font-bold">{formatMoney(computedSubtotal > 0 ? shippingFee : 0)}</span>
              </div>
              <div className="pt-4 border-t border-white/20">
                <label className="block text-[9px] uppercase font-black tracking-widest mb-1 opacity-80">
                  Total Amount (Custom Editable)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customGrandTotal}
                    onChange={(e) => setCustomGrandTotal(e.target.value)}
                    placeholder={formatMoney(computedGrandTotal)}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-3xl font-black p-0 w-full placeholder-white/80"
                  />
                </div>
                <p className="text-[10px] text-white/75 mt-1 font-medium italic">
                  * Trực quan hóa giá trị nhập tay hoặc để trống hệ thống tự tính
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                className="w-full bg-white text-[#9d4300] font-black pointer-events-auto cursor-pointer hover:bg-orange-50 py-3.5 rounded-xl shadow-md transition-all active:scale-97 text-sm flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Order
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="w-full bg-orange-600/30 text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-orange-600/50 transition-colors text-xs"
              >
                Cancel & Discard
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/20 text-[10px]">
              <span className="uppercase font-black tracking-widest opacity-85">Order Status</span>
              <span className="px-3 py-1 bg-white/20 rounded-full font-black text-xs">NEW</span>
            </div>
          </div>

          {/* Screenshot simulated upload section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Screenshot Upload
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleTriggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group ${
                isDragOver ? 'border-[#f97316] bg-orange-50' : 'border-slate-200 hover:border-[#f97316] hover:bg-orange-50/20'
              }`}
            >
              {attachedImage ? (
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 shadow-sm mx-auto w-32">
                    <img className="w-full h-full object-cover" src={attachedImage} alt="Attachment Check" />
                  </div>
                  <p className="text-xs font-bold text-green-600">✓ Screenshot uploaded successfully</p>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedImage(null);
                    }}
                    className="text-[10px] text-red-500 font-bold underline hover:text-red-700"
                  >
                    Remove attachment
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[40px] text-slate-300 group-hover:text-[#9d4300] transition-colors mb-2">cloud_upload</span>
                  <p className="text-xs font-bold text-slate-600">Click to upload or drag JPG/PNG</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Max file size: 5MB</p>
                </>
              )}
            </div>
          </div>

          {/* Creation Metadata summary */}
          <div className="bg-slate-100/60 rounded-xl p-5 border border-slate-200/50 space-y-4 text-xs font-medium text-slate-600">
            <div>
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Created By</span>
              <div className="flex items-center gap-2">
                <img 
                  className="w-5.5 h-5.5 rounded-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpPGC1UAkRxACPRs4DTH6o8z3Bzi89HKvxmvnX4mOOjNKYhJeQTQVj9mBKgDpn4rWaSSDO3Rqqmx1qeyW0oweEu48NSp9Zo_u1JG7SC7vDr6-sl_zl4kHQqQOhRsVV30YNLCDr-xzvY3eMvaq2UxAX4aXPGk7g5hlOI_36AlGmf2tosuv3bB2g6rMvcWI85k9wDuSWRTNbffr5hKh_7yg29xlk6gkHcPoLdY9TJnKkD_rkpIUI8kJVS4qv--CuP-45z_qjo3RJC4I" 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold text-slate-700">Admin_Manager_01</span>
              </div>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1">Local Time</span>
              <span className="font-bold text-slate-700">24 Oct 2023 • 14:45</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
