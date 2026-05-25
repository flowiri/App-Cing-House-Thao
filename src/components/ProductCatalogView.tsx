import React, { useState } from 'react';
import { Product } from '../types';
import { imageFileToDataUrl } from '../utils/images';
import { Search, Plus, Edit3, Trash2, X, CheckCircle2, UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ProductCatalogViewProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<boolean>;
  onEditProduct: (updatedProduct: Product) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
}

export default function ProductCatalogView({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: ProductCatalogViewProps) {
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isReadingProductImage, setIsReadingProductImage] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formSKU, setFormSKU] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formImage, setFormImage] = useState('');

  const categoryOptions = Array.from(
    new Map(
      (
        products
          .map(product => [product.category, product.categoryName || product.category] as const)
          .filter(([category]) => Boolean(category)).length > 0
          ? products.map(product => [product.category, product.categoryName || product.category] as const).filter(([category]) => Boolean(category))
          : [['other', 'Khác'] as const]
      )
    ).entries()
  ).map(([category, categoryName]) => ({ category, categoryName }));

  const getCategoryName = (category: string) => {
    return categoryOptions.find(option => option.category === category)?.categoryName || category;
  };

  // Computed statistics over catalog
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const inactiveProducts = products.filter(p => p.status === 'inactive').length;
  const productsWithImages = products.filter(product => Boolean(product.image)).length;

  // Filtered lists
  const filteredProducts = products.filter(p => {
    const matchesQuery = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && p.status === 'active') || 
      (statusFilter === 'inactive' && p.status === 'inactive');

    return matchesQuery && matchesCategory && matchesStatus;
  });

  // Actions trigger: Create Add product
  const handleOpenAdd = () => {
    setFormName('');
    setFormSKU('');
    setFormCategory(categoryOptions[0]?.category || 'other');
    setFormPrice(0);
    setFormStatus('active');
    setFormImage('');
    setShowAddModal(true);
  };

  const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setIsReadingProductImage(true);
    try {
      const dataUrl = await imageFileToDataUrl(file, {
        maxInputBytes: 5 * 1024 * 1024,
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.82
      });
      setFormImage(dataUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      input.value = '';
      setIsReadingProductImage(false);
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSku = formSKU.trim();
    const trimmedName = formName.trim();

    if (!trimmedSku || !trimmedName) {
      alert('Vui lòng điền đầy đủ mã món và tên sản phẩm.');
      return;
    }

    if (products.some(product => product.sku.toLowerCase() === trimmedSku.toLowerCase() || product.id.toLowerCase() === trimmedSku.toLowerCase())) {
      alert(`Mã món ${trimmedSku} đã tồn tại trong danh mục. Vui lòng chỉnh sửa sản phẩm hiện có hoặc chọn mã khác.`);
      return;
    }

    const newProd: Product = {
      id: trimmedSku,
      sku: trimmedSku,
      name: trimmedName,
      category: formCategory || categoryOptions[0]?.category || 'other',
      categoryName: getCategoryName(formCategory || categoryOptions[0]?.category || 'other'),
      price: formPrice,
      currency: 'VND',
      status: formStatus,
      image: formImage
    };

    setIsSavingProduct(true);
    try {
      const wasSaved = await onAddProduct(newProd);
      if (wasSaved) setShowAddModal(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Actions trigger: Edit product
  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSKU(product.sku);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormStatus(product.status);
    setFormImage(product.image);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const trimmedName = formName.trim();
    if (!trimmedName) {
      alert('Vui lòng điền tên sản phẩm.');
      return;
    }

    const updated: Product = {
      ...selectedProduct,
      name: trimmedName,
      sku: formSKU,
      category: formCategory,
      categoryName: getCategoryName(formCategory),
      price: formPrice,
      status: formStatus,
      image: formImage
    };

    setIsSavingProduct(true);
    try {
      const wasSaved = await onEditProduct(updated);
      if (wasSaved) setShowEditModal(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Action trigger: Delete product
  const handleDeleteTrigger = async (product: Product) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm ${product.name} (SKU: ${product.sku}) khỏi danh mục hệ thống?`)) {
      setDeletingProductId(product.id);
      try {
        await onDeleteProduct(product.id);
      } finally {
        setDeletingProductId(null);
      }
    }
  };

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  const renderImageUploadField = () => (
    <div>
      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Ảnh sản phẩm</label>
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
        {formImage ? (
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <img src={formImage} alt="Ảnh sản phẩm" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-green-700">Đã chọn ảnh</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Ảnh sẽ được lưu cùng bản ghi sản phẩm trong Supabase.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <UploadCloud className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-600">Chưa có ảnh sản phẩm</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ JPG/PNG/WEBP, tối đa 5MB.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-black text-[#9d4300] cursor-pointer hover:bg-orange-50 transition-colors">
            <UploadCloud size={14} />
            {isReadingProductImage ? 'Đang đọc ảnh...' : formImage ? 'Đổi ảnh' : 'Upload ảnh'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isSavingProduct || isReadingProductImage}
              onChange={handleProductImageChange}
            />
          </label>
          {formImage && (
            <button
              type="button"
              onClick={() => setFormImage('')}
              disabled={isSavingProduct || isReadingProductImage}
              className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Xóa ảnh
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in pb-16">
      {/* Header section matches mockup */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Sản phẩm</h1>
          <p className="text-slate-500 mt-1 max-w-2xl text-sm leading-relaxed">
            Quản lý danh sách món ăn, đơn giá và trạng thái phục vụ của toàn bộ hệ thống OrderHub F&B.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#f97316] hover:bg-[#9d4300] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 transition-all text-sm self-start md:self-auto active:scale-95 duration-100"
        >
          <Plus size={18} />
          Thêm Sản phẩm Mới
        </button>
      </div>

      {/* Stats row representing mockup bento boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tổng sản phẩm</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-800">{totalProducts}</span>
            <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-1 rounded-md border border-green-100">
              {totalProducts > 0 ? '+12%' : '0%'}
            </span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Đang hoạt động</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-[#9d4300]">{activeProducts}</span>
            <CheckCircle2 size={20} className="text-[#f97316]" />
          </div>
        </div>

        {/* Inactive products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sản phẩm tạm ngưng</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-700">{inactiveProducts}</span>
            <span className="text-slate-400">
              <span className="material-symbols-outlined text-[20px] text-slate-400">pause_circle</span>
            </span>
          </div>
        </div>

        {/* Product image coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Có ảnh sản phẩm</div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-green-600">
              {productsWithImages}
            </span>
            <ImageIcon size={20} className="text-green-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filters card matching exactly Screen 3 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Text search */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món ăn hoặc mã món..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#f97316] focus:outline-none text-xs text-slate-800"
            />
          </div>

          {/* Category dropdown selection */}
          <div className="w-full sm:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">Tất cả Danh mục</option>
              {categoryOptions.map(option => (
                <option key={option.category} value={option.category}>{option.categoryName}</option>
              ))}
            </select>
          </div>

          {/* Status dropdown selection */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">Trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>

          {/* Quick clears if applied query */}
          {(searchQuery || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="text-xs font-bold text-[#faf0eb] bg-[#9d4300]/95 hover:bg-[#9d4300] px-3.5 py-2.5 rounded-lg active:scale-95 shadow transition-all whitespace-nowrap"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main product entries table matching Mockup exactly */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto animate-fade-in">
          {filteredProducts.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fffcfb] border-b border-slate-100">
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Mã món</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Hình ảnh</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Tên Sản phẩm</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Danh mục</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Giá niêm yết</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-sans font-medium">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* SKU label code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    </td>

                    {/* Miniature thumbnail */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center">
                        {product.image ? (
                          <img 
                            className="w-full h-full object-cover" 
                            src={product.image} 
                            alt={product.name} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300 text-[22px]">restaurant_menu</span>
                        )}
                      </div>
                    </td>

                    {/* Product Name Title */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                      {product.name}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        {product.categoryName || getCategoryName(product.category)}
                      </span>
                    </td>

                    {/* Standard Price */}
                    <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900">
                      {formatMoney(product.price)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${product.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                          product.status === 'active' 
                            ? 'text-green-700 bg-green-50' 
                            : 'text-slate-500 bg-slate-100'
                        }`}>
                          {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </div>
                    </td>

                    {/* Actions tools hoverable block */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          disabled={deletingProductId !== null}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#9d4300] hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sửa"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(product)}
                          disabled={deletingProductId !== null}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={deletingProductId === product.id ? 'Đang xóa khỏi Supabase...' : 'Xóa'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-[48px] text-slate-200 mb-2 font-be-vietnam">inventory_2</span>
              <p className="font-bold text-sm">Chưa có hoặc không tìm thấy sản phẩm nào</p>
              <p className="text-xs text-slate-400 mt-1">Sử dụng nút "Thêm Sản phẩm Mới" để mở rộng danh sách.</p>
            </div>
          )}
        </div>

        {/* Pagination summary info block */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-[#fffcfb] text-xs font-bold text-slate-400">
          <span>Hiển thị 1-{filteredProducts.length} trong {filteredProducts.length} sản phẩm</span>
          <div className="flex items-center gap-1.5">
            <button disabled className="p-2 bg-white text-slate-300 border border-slate-100 rounded-lg cursor-not-allowed">
              ‹
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#f97316] text-white flex items-center justify-center font-black">1</button>
            <button disabled className="p-2 bg-white text-slate-300 border border-slate-100 rounded-lg cursor-not-allowed">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* --- CRUD Modal: ADD --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 relative border border-slate-100 shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              disabled={isSavingProduct}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-black text-slate-900">Thêm Sản phẩm Mới</h3>
              <p className="text-xs text-slate-400 mt-0.5">Đặt tên món, định giá niêm yết và phân bổ danh mục.</p>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Tên Sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ví dụ: TRÂN CHÂU TRẮNG TRÒN(9K)"
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-[#f97316] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Mã món *</label>
                  <input
                    type="text"
                    required
                    value={formSKU}
                    onChange={(e) => setFormSKU(e.target.value)}
                    placeholder="ví dụ: CTTT"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.category} value={option.category}>{option.categoryName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Giá niêm yết (VND) *</label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                  placeholder="ví dụ: 45000"
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-[#f97316] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Trạng thái bán hàng</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-[#f97316] focus:ring-0 focus:outline-none"
                    />
                    Cho phép bán ngay (Đang bán)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={formStatus === 'inactive'}
                      onChange={() => setFormStatus('inactive')}
                      className="text-[#f97316] focus:ring-0 focus:outline-none"
                    />
                    Bảo trì / Ngừng bán
                  </label>
                </div>
              </div>

              {renderImageUploadField()}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSavingProduct}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2.5 bg-[#f97316] text-[#faf0eb] hover:bg-[#9d4300] font-black text-xs rounded-xl shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProduct ? 'Đang lưu vào Supabase...' : '✓ Thêm Sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CRUD Modal: EDIT --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 relative border border-slate-100 shadow-2xl">
            <button 
              onClick={() => setShowEditModal(false)}
              disabled={isSavingProduct}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-lg font-black text-slate-900">Chỉnh sửa Sản phẩm</h3>
              <p className="text-xs text-slate-400 mt-0.5">Mã món chuẩn: {selectedProduct?.sku}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Tên Sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-[#f97316] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Mã món</label>
                  <input
                    type="text"
                    disabled
                    value={formSKU}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.category} value={option.category}>{option.categoryName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Giá niêm yết (VND) *</label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-[#f97316] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Trạng thái bán hàng</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-[#f97316] focus:ring-0 focus:outline-none"
                    />
                    Cho phép bán ngay (Đang bán)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={formStatus === 'inactive'}
                      onChange={() => setFormStatus('inactive')}
                      className="text-[#f97316] focus:ring-0 focus:outline-none"
                    />
                    Bảo trì / Ngừng bán
                  </label>
                </div>
              </div>

              {renderImageUploadField()}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingProduct}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2.5 bg-[#f97316] text-[#faf0eb] hover:bg-[#9d4300] font-black text-xs rounded-xl shadow transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProduct ? 'Đang lưu vào Supabase...' : '✓ Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
