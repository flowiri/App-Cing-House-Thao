import React, { useEffect, useRef, useState } from 'react';
import { Branch, Product, Order, OrderItem } from '../types';
import { imageFileToDataUrl } from '../utils/images';
import { parseOrderImage, ParsedOrderImage, ParsedOrderImageItem } from '../services/orderImageParser';
import { LoaderCircle, Phone, Save, ShoppingBasket, Sparkles, Trash2, UploadCloud, UserRound } from 'lucide-react';

interface NewOrderViewProps {
  branches: Branch[];
  products: Product[];
  onAddOrder: (newOrder: Order) => Promise<boolean>;
  onNavigate: (view: string) => void;
}

export default function NewOrderView({ branches, products, onAddOrder, onNavigate }: NewOrderViewProps) {
  // Core states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Facebook');
  const [lineItems, setLineItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  // Searching products
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Totals
  const [customGrandTotal, setCustomGrandTotal] = useState<string>(''); // if empty, use product subtotal
  
  // Bill image upload state
  const billFileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReadingBillImage, setIsReadingBillImage] = useState(false);
  const autoImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsingOrderImage, setIsParsingOrderImage] = useState(false);
  const [autoImportSummary, setAutoImportSummary] = useState<string | null>(null);

  // Computed subtotal
  const computedSubtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const computedGrandTotal = computedSubtotal;

  useEffect(() => {
    if (branches.length === 0) {
      setSelectedBranch('');
      return;
    }

    if (!selectedBranch || !branches.some(branch => branch.name === selectedBranch)) {
      setSelectedBranch(branches[0].name);
    }
  }, [branches, selectedBranch]);

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

  const normalizeText = (value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const findBestProductMatch = (rawName: string) => {
    const normalizedRaw = normalizeText(rawName);
    if (!normalizedRaw) return null;

    let bestProduct: Product | null = null;
    let bestScore = 0;
    const rawTokens = new Set(normalizedRaw.split(' ').filter(token => token.length > 1));

    products.forEach((product) => {
      const normalizedName = normalizeText(product.name);
      const normalizedSku = normalizeText(product.sku);
      let score = 0;

      if (normalizedRaw === normalizedName || normalizedRaw === normalizedSku) score = 1;
      else if (normalizedName.includes(normalizedRaw) || normalizedRaw.includes(normalizedName)) score = 0.88;
      else {
        const productTokens = normalizedName.split(' ').filter(token => token.length > 1);
        const overlap = productTokens.filter(token => rawTokens.has(token)).length;
        score = productTokens.length > 0 ? overlap / Math.max(productTokens.length, rawTokens.size) : 0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    });

    return bestScore >= 0.45 ? bestProduct : null;
  };

  const toLineItem = (parsedItem: ParsedOrderImageItem, index: number): OrderItem => {
    const matchedProduct = findBestProductMatch(parsedItem.name);
    const quantity = Math.max(1, Math.round(Number(parsedItem.quantity) || 1));

    if (matchedProduct) {
      return {
        id: matchedProduct.id,
        sku: matchedProduct.sku,
        name: matchedProduct.name,
        quantity,
        price: matchedProduct.price,
        subtotal: matchedProduct.price * quantity
      };
    }

    const fallbackName = parsedItem.size ? `${parsedItem.name} (${parsedItem.size})` : parsedItem.name;
    return {
      id: `ai-custom-${index}-${normalizeText(parsedItem.name).replace(/\s/g, '-') || Date.now()}`,
      sku: 'AI-CUSTOM',
      name: fallbackName,
      quantity,
      price: 0,
      subtotal: 0
    };
  };

  const mergeLineItems = (items: OrderItem[]) => {
    const itemMap = new Map<string, OrderItem>();

    items.forEach((item) => {
      const key = item.id.startsWith('ai-custom') ? normalizeText(item.name) : item.id;
      const existing = itemMap.get(key);
      if (!existing) {
        itemMap.set(key, item);
        return;
      }

      const quantity = existing.quantity + item.quantity;
      itemMap.set(key, {
        ...existing,
        quantity,
        subtotal: quantity * existing.price
      });
    });

    return Array.from(itemMap.values());
  };

  const applyParsedOrder = (parsedOrder: ParsedOrderImage) => {
    if (lineItems.length > 0 && !confirm('Form đang có món. Bạn muốn thay bằng dữ liệu đọc từ ảnh?')) {
      return;
    }

    if (parsedOrder.customerName) setCustomerName(parsedOrder.customerName);
    if (parsedOrder.customerPhone) setCustomerPhone(parsedOrder.customerPhone);

    const parsedChannel = normalizeText(parsedOrder.channel || '');
    if (parsedChannel.includes('zalo')) setSelectedChannel('Zalo');
    else if (parsedChannel.includes('instagram')) setSelectedChannel('Instagram');
    else if (parsedChannel.includes('facebook')) setSelectedChannel('Facebook');

    const importedItems = mergeLineItems(parsedOrder.items.map(toLineItem));
    if (importedItems.length > 0) setLineItems(importedItems);

    const unmatchedItems = importedItems.filter(item => item.price === 0);
    const itemNotes = parsedOrder.items
      .filter(item => item.size || item.note)
      .map(item => `- ${item.name}${item.size ? ` size ${item.size}` : ''}${item.note ? `: ${item.note}` : ''}`);
    const importedNotes = [
      'Tự nhập từ ảnh screenshot.',
      parsedOrder.deliveryAddress ? `Địa chỉ giao hàng: ${parsedOrder.deliveryAddress}` : '',
      parsedOrder.requestedTime ? `Thời gian giao/nhận: ${parsedOrder.requestedTime}` : '',
      parsedOrder.notes ? `Ghi chú từ ảnh: ${parsedOrder.notes}` : '',
      itemNotes.length > 0 ? `Chi tiết món:\n${itemNotes.join('\n')}` : '',
      unmatchedItems.length > 0 ? `Cần kiểm tra giá/catalog cho: ${unmatchedItems.map(item => item.name).join(', ')}` : ''
    ].filter(Boolean).join('\n');

    setOrderNotes(current => [importedNotes, current].filter(Boolean).join('\n\n'));
    setCustomGrandTotal('');
    setAutoImportSummary(`Đã đọc ${importedItems.length} món${unmatchedItems.length > 0 ? `, ${unmatchedItems.length} món chưa khớp catalog` : ''}. Vui lòng kiểm tra lại trước khi lưu.`);
  };

  const handleAutoImportFile = async (file: File) => {
    setIsParsingOrderImage(true);
    setAutoImportSummary(null);

    try {
      const dataUrl = await imageFileToDataUrl(file, {
        maxInputBytes: 8 * 1024 * 1024,
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.88
      });
      setAttachedImage(dataUrl);
      const parsedOrder = await parseOrderImage(dataUrl, products);
      applyParsedOrder(parsedOrder);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsParsingOrderImage(false);
    }
  };

  const handleAutoImportInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (file) await handleAutoImportFile(file);
    input.value = '';
  };

  const handleTriggerAutoImport = () => {
    autoImportFileInputRef.current?.click();
  };

  // Drag-and-drop handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleBillImageFile = async (file: File) => {
    setIsReadingBillImage(true);
    try {
      const dataUrl = await imageFileToDataUrl(file, {
        maxInputBytes: 5 * 1024 * 1024,
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.84
      });
      setAttachedImage(dataUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setIsReadingBillImage(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await handleBillImageFile(file);
  };

  const handleTriggerFileSelect = () => {
    billFileInputRef.current?.click();
  };

  const handleBillInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (file) await handleBillImageFile(file);
    input.value = '';
  };

  // Submissions handler
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCustomerName = customerName.trim();
    const trimmedCustomerPhone = customerPhone.trim();

    if (!trimmedCustomerName || !trimmedCustomerPhone) {
      alert('Vui lòng nhập tên khách hàng và số điện thoại.');
      return;
    }

    if (lineItems.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm vào đơn hàng.');
      return;
    }

    if (!selectedBranch) {
      alert('Vui lòng cấu hình ít nhất một chi nhánh trong Supabase trước khi tạo đơn hàng.');
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
      customerName: trimmedCustomerName,
      customerPhone: trimmedCustomerPhone,
      branch: selectedBranch,
      channel: selectedChannel,
      items: lineItems,
      subtotal: computedSubtotal,
      shippingFee: 0,
      total: finalTotal,
      // Giá trị mặc định để tương thích schema Supabase; giao diện order không dùng trạng thái.
      status: 'COMPLETED',
      notes: orderNotes,
      screenshot: attachedImage || undefined,
      createdBy: 'Admin_Manager_01',
      history: [
        { id: `log-cr-${Date.now()}`, actor: 'Admin_Manager_01', action: `Ghi đơn thủ công cho ${trimmedCustomerName}`, timestamp: `${hrStr}:${minStr} ${dayStr}/${now.getMonth() + 1}` }
      ]
    };

    setIsSavingOrder(true);
    try {
      const wasSaved = await onAddOrder(newOrder);
      if (wasSaved) {
        alert('Lưu đơn hàng vào Supabase thành công! Trở về danh sách đơn hàng để kiểm tra.');
        onNavigate('Orders');
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('Bạn có chắc muốn hủy bỏ toàn bộ nội dung của đơn hàng này?')) {
      setCustomerName('');
      setCustomerPhone('');
      setLineItems([]);
      setOrderNotes('');
      setCustomGrandTotal('');
      setAttachedImage(null);
      setAutoImportSummary(null);
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tạo đơn hàng mới</h1>
        <p className="text-slate-500 text-sm mt-1">Nhập tên, số điện thoại, món khách đặt và upload ảnh bill nếu có.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#ffeae0] text-[#9d4300] flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Tự nhập đơn từ ảnh screenshot</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">
              Upload ảnh chat Zalo/Facebook/Instagram hoặc ảnh bảng món, hệ thống sẽ tự điền khách hàng, SĐT, món và ghi chú.
            </p>
            {autoImportSummary && (
              <p className="text-xs font-black text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-3">
                {autoImportSummary}
              </p>
            )}
          </div>
        </div>
        <input
          ref={autoImportFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAutoImportInputChange}
        />
        <button
          type="button"
          onClick={handleTriggerAutoImport}
          disabled={isParsingOrderImage || isSavingOrder}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {isParsingOrderImage ? <LoaderCircle size={17} className="animate-spin" /> : <UploadCloud size={17} />}
          {isParsingOrderImage ? 'Đang đọc ảnh...' : 'Upload & tự nhập'}
        </button>
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
                    disabled={branches.length === 0}
                    className="w-full h-12 pl-4 pr-10 rounded-lg border-2 border-slate-200 focus:border-[#f97316] focus:outline-none appearance-none bg-white font-bold text-sm text-slate-800"
                  >
                    {branches.length === 0 && (
                      <option value="">No branches configured</option>
                    )}
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.name}>{branch.name}</option>
                    ))}
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

          {/* Customer information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
              <UserRound className="text-[#9d4300]" size={20} />
              Thông tin khách hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ví dụ: Nguyễn Văn A"
                  className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-[#f97316] focus:outline-none font-bold text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Phone size={13} />
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="ví dụ: 0901234567"
                  className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-[#f97316] focus:outline-none font-bold text-sm text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Product selection card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBasket className="text-[#9d4300]" size={20} />
              Món khách order
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
                  placeholder="Gõ tên món ăn hoặc mã món để thêm... (ví dụ: CTTT, Dâu tây)"
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
                            {product.image ? (
                              <img className="w-8 h-8 rounded-lg object-cover" src={product.image} alt={product.name} />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#9d4300]">
                                <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                              </div>
                            )}
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
                      <th className="px-4 py-3">Món</th>
                      <th className="px-4 py-3 text-center">Số lượng</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
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
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">Mã món: {item.sku}</div>
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
              <span>Ghi chú đơn hàng</span>
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
                <span>Tạm tính</span>
                <span className="font-bold">{formatMoney(computedSubtotal)}</span>
              </div>
              <div className="pt-4 border-t border-white/20">
                <label className="block text-[9px] uppercase font-black tracking-widest mb-1 opacity-80">
                  Tổng tiền (có thể nhập tay)
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
                  * Để trống để hệ thống tự tính theo tổng món, không cộng phí ship
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={isSavingOrder || isReadingBillImage || isParsingOrderImage}
                className="w-full bg-white text-[#9d4300] font-black pointer-events-auto cursor-pointer hover:bg-orange-50 py-3.5 rounded-xl shadow-md transition-all active:scale-97 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSavingOrder ? 'Đang lưu Supabase...' : 'Lưu đơn hàng'}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSavingOrder || isReadingBillImage || isParsingOrderImage}
                className="w-full bg-orange-600/30 text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-orange-600/50 transition-colors text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Hủy và xóa nội dung
              </button>
            </div>
          </div>

          {/* Bill upload section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Upload ảnh bill
            </label>
            <input
              ref={billFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBillInputChange}
            />
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
                  <p className="text-xs font-bold text-green-600">✓ Đã upload ảnh bill</p>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedImage(null);
                    }}
                    className="text-[10px] text-red-500 font-bold underline hover:text-red-700"
                  >
                    Xóa ảnh bill
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto text-slate-300 group-hover:text-[#9d4300] transition-colors mb-2" size={40} />
                  <p className="text-xs font-bold text-slate-600">
                    {isReadingBillImage ? 'Đang đọc ảnh bill...' : 'Bấm để upload hoặc kéo thả JPG/PNG'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Tối đa 5MB</p>
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
              <span className="font-bold text-slate-700">{new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
