import React, { useState, useEffect } from 'react';
import { Product, Order, OrderStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from './data';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import NewOrderView from './components/NewOrderView';
import ProductCatalogView from './components/ProductCatalogView';
import {
  createProduct,
  deleteProduct,
  seedProductsIfEmpty,
  updateProduct
} from './services/products';
import { LayoutDashboard, Receipt, PlusCircle, Settings, Store, Bell, HelpCircle, LogOut, Menu, X } from 'lucide-react';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [mobileSidebarExpanded, setMobileSidebarExpanded] = useState(false);

  // Product catalog now comes from Supabase. If the table is empty, seed it with demo products once.
  useEffect(() => {
    let isMounted = true;

    const loadSupabaseProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const supabaseProducts = await seedProductsIfEmpty(INITIAL_PRODUCTS);
        if (isMounted) setProducts(supabaseProducts);
      } catch (error) {
        console.error('Failed to load products from Supabase:', error);
        if (isMounted) {
          setProducts(INITIAL_PRODUCTS);
          setProductsError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    };

    loadSupabaseProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Orders are still local-only for Option A.
  useEffect(() => {
    const cachedOrders = localStorage.getItem('orderhub_orders');

    if (cachedOrders) {
      setOrders(JSON.parse(cachedOrders));
    } else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('orderhub_orders', JSON.stringify(INITIAL_ORDERS));
    }
  }, []);

  const saveOrdersToStorage = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('orderhub_orders', JSON.stringify(updatedOrders));
  };

  // --- CRUD Order Actions handlers ---
  const handleAddOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    saveOrdersToStorage(updated);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const now = new Date();
    const minStr = String(now.getMinutes()).padStart(2, '0');
    const hrStr = String(now.getHours()).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const monStr = String(now.getMonth() + 1).padStart(2, '0');
    const stamp = `${hrStr}:${minStr} ${dayStr}/${monStr}`;

    const updated = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus,
          history: [
            {
              id: `log-live-${Date.now()}`,
              actor: 'Admin Manager',
              action: `changed status to ${newStatus}`,
              timestamp: stamp
            },
            ...(order.history || [])
          ]
        };
      }
      return order;
    });
    saveOrdersToStorage(updated);
  };

  // --- CRUD Product Actions handlers ---
  const handleAddProduct = async (newProduct: Product) => {
    try {
      const savedProduct = await createProduct(newProduct);
      setProducts(currentProducts => [savedProduct, ...currentProducts.filter(p => p.id !== savedProduct.id)]);
      alert(`Đã thêm sản phẩm "${savedProduct.name}" vào Supabase thành công.`);
    } catch (error) {
      console.error('Failed to add product in Supabase:', error);
      alert(`Không thể thêm sản phẩm vào Supabase: ${getErrorMessage(error)}`);
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      const savedProduct = await updateProduct(updatedProduct);
      setProducts(currentProducts => currentProducts.map(p => p.id === savedProduct.id ? savedProduct : p));
      alert(`Đã cập nhật thông tin sản phẩm "${savedProduct.name}" trong Supabase.`);
    } catch (error) {
      console.error('Failed to update product in Supabase:', error);
      alert(`Không thể cập nhật sản phẩm trong Supabase: ${getErrorMessage(error)}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product in Supabase:', error);
      alert(`Không thể xóa sản phẩm khỏi Supabase: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased flex flex-col select-none">
      
      {/* Dynamic Header Frame corresponding to user assets */}
      <header className="flex justify-between items-center h-16 px-4 md:px-6 w-full sticky top-0 z-50 bg-[#F8FAFC] border-b border-slate-200/85 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileSidebarExpanded(!mobileSidebarExpanded)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <span 
            onClick={() => setActiveView('Dashboard')}
            className="text-xl font-black text-slate-900 tracking-tight cursor-pointer font-sans"
          >
            OrderHub <span className="text-[#f97316]">F&B</span>
          </span>
        </div>

        {/* Global actions and manager card profiling */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
            <Store size={14} className="text-[#f97316]" />
            <span>Main Branch Selector</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Không có thông báo mới nào')}
              className="p-2 text-slate-600 hover:bg-[#ffeae0] hover:text-[#9d4300] transition-colors rounded-full relative"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f97316] rounded-full"></span>
            </button>
            <button 
              onClick={() => setActiveView('Product Catalog')}
              className="p-2 text-slate-600 hover:bg-[#ffeae0] hover:text-[#9d4300] transition-colors rounded-full"
            >
              <Settings size={18} />
            </button>
            
            {/* Young Female restaurant operations manager screenshot avatar */}
            <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-3">
              <img 
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm cursor-help" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm7mqEKEqO2nmNyTYlT2z3vN6iSJoHFinq_jMBGjnTXdwwMajL4pcwt03Fpw72vRxfpf2JSCYGuBxVhEdvL6TAyJeQIDSO-2eT9WyZInM7fmfhY0Me8anc9altqYlzwgWfKaLo0Ac582qzeqRWH-aQffPUTbJdQX9HRygffF-PgmCRLWWlNaHFXfXBdA9Ell2asaAGw7LE3E9DiLOCbMXPH7dt4iGqdgI5xNen85UssLCn1uWCY4aA8Gw8eEhcVqxINjnyIHcUaik" 
                alt="Ops Manager Headshot" 
                referrerPolicy="no-referrer"
                title="Restaurant Operations Manager"
              />
              <span className="hidden md:inline text-xs font-bold text-slate-700">Admin_Manager_01</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* --- DESKTOP SIDEBAR NAVIGATION FRAME --- */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-slate-100 z-30 justify-between p-4 pb-6">
          <div className="space-y-6">
            {/* Branch Card Block with generic profile initials */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#fffcfb] rounded-xl shadow-xs border border-[#ffeae0]">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-[#9d4300] font-black text-sm">
                MK
              </div>
              <div className="min-w-0">
                <div className="text-slate-800 font-bold text-sm truncate">Main Kitchen</div>
                <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase mt-0.5">Terminal #04</div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1.5">
              {[
                { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                { name: 'Orders', icon: <Receipt size={18} /> },
                { name: 'New Order', icon: <PlusCircle size={18} /> },
                { name: 'Product Catalog', icon: <Settings size={18} /> }
              ].map(item => {
                const isActive = activeView === item.name || (item.name === 'Orders' && activeView.includes('Order'));
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveView(item.name);
                      setMobileSidebarExpanded(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#ffeae0] text-[#9d4300] border-r-4 border-[#f97316]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name === 'Product Catalog' ? 'Product Catalog' : item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1">
            <button 
              onClick={() => alert('Trung tâm trợ giúp luôn sẵn sàng! Hãy liên hệ support@orderhub.vn')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <HelpCircle size={16} />
              <span>Help Center / Support</span>
            </button>
            <button 
              onClick={() => {
                if (confirm('Bạn muốn đăng xuất khỏi Terminal #04?')) {
                  alert('Đăng xuất thành công.');
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-bold hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* --- MOBILE COLLAPSED SLIDE DRAWERS --- */}
        {mobileSidebarExpanded && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden flex">
            <div className="bg-white w-64 h-full p-4 flex flex-col justify-between shadow-xl animate-slide-right">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-base font-black text-[#9d4300]">Navigation menu</span>
                  <button 
                    onClick={() => setMobileSidebarExpanded(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-3 px-3 py-3 bg-[#fffcfb] rounded-lg border border-[#ffeae0]">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#9d4300] font-black text-xs">
                    MK
                  </div>
                  <div>
                    <div className="text-slate-800 font-bold text-xs truncate">Main Kitchen</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-0.5">Terminal #04</div>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1">
                  {[
                    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                    { name: 'Orders', icon: <Receipt size={18} /> },
                    { name: 'New Order', icon: <PlusCircle size={18} /> },
                    { name: 'Product Catalog', icon: <Settings size={18} /> }
                  ].map(item => {
                    const isActive = activeView === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveView(item.name);
                          setMobileSidebarExpanded(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                          isActive
                            ? 'bg-[#ffeae0] text-[#9d4300] border-r-4 border-[#f97316]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name === 'Product Catalog' ? 'Product Catalog' : item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs flex flex-col gap-1">
                <button 
                  onClick={() => {
                    alert('Hỗ trợ F&B trực tuyến hoạt động 24/7');
                    setMobileSidebarExpanded(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  <HelpCircle size={14} />
                  <span>Call Support</span>
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Đăng xuất terminal?')) {
                      setMobileSidebarExpanded(false);
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg hover:text-red-500"
                >
                  <LogOut size={14} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
            {/* Click outside backdrop close layout */}
            <div 
              onClick={() => setMobileSidebarExpanded(false)} 
              className="flex-1"
            ></div>
          </div>
        )}

        {/* --- CENTRAL MAIN CANVAS --- */}
        <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {productsLoading && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Loading product catalog from Supabase...
              </div>
            )}

            {productsError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Supabase product catalog is unavailable. Showing demo products only. Error: {productsError}
              </div>
            )}
            
            {activeView === 'Dashboard' && (
              <DashboardView 
                orders={orders} 
                products={products}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === 'Orders' && (
              <OrdersView 
                orders={orders} 
                onNavigate={(v) => setActiveView(v)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {activeView === 'New Order' && (
              <NewOrderView 
                products={products}
                onAddOrder={handleAddOrder}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === 'Product Catalog' && (
              <ProductCatalogView 
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

          </div>
        </main>
      </div>

      {/* --- MOBILE PORTABLE BOTTOM NAVIGATION BAR (Slide 3 look-and-feel) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-1.5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg select-none text-[10px] font-black tracking-wide text-slate-500">
        {[
          { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { id: 'Orders', label: 'Orders', icon: <Receipt size={18} /> },
          { id: 'New Order', label: 'Entry', icon: <PlusCircle size={18} /> },
          { id: 'Product Catalog', label: 'Products', icon: <Settings size={18} /> }
        ].map(tab => {
          const isActive = activeView === tab.id || (tab.id === 'Orders' && activeView.includes('Order'));
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center justify-center rounded-xl py-1 px-3.5 transition-all outline-none ${
                isActive
                  ? 'text-[#f97316] bg-orange-50 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className="mt-1">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}
