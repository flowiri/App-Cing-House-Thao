import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Branch, Product, Order } from './types';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import NewOrderView from './components/NewOrderView';
import ProductCatalogView from './components/ProductCatalogView';
import CustomerDataView from './components/CustomerDataView';
import LoginView from './components/LoginView';
import { supabase } from './lib/supabase';
import { loadBranches } from './services/branches';
import {
  createOrder,
  deleteOrder,
  loadOrders,
} from './services/orders';
import {
  createProduct,
  deleteProduct,
  loadProducts,
  updateProduct
} from './services/products';
import { LayoutDashboard, Receipt, PlusCircle, Settings, Store, Bell, HelpCircle, LogOut, Menu, X, UsersRound, LoaderCircle } from 'lucide-react';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [mobileSidebarExpanded, setMobileSidebarExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        setAuthLoading(true);
        setAuthError(null);
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setSession(data.session);
      } catch (error) {
        console.error('Failed to load Supabase auth session:', error);
        if (isMounted) {
          setSession(null);
          setAuthError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setAuthLoading(false);

      if (!nextSession) {
        setActiveView('Dashboard');
        setMobileSidebarExpanded(false);
        setBranches([]);
        setProducts([]);
        setOrders([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Branches come only from Supabase.
  useEffect(() => {
    let isMounted = true;

    if (!session) {
      setBranches([]);
      setBranchesLoading(false);
      setBranchesError(null);
      return () => {
        isMounted = false;
      };
    }

    const loadSupabaseBranches = async () => {
      try {
        setBranchesLoading(true);
        setBranchesError(null);
        const supabaseBranches = await loadBranches();
        if (isMounted) setBranches(supabaseBranches);
      } catch (error) {
        console.error('Failed to load branches from Supabase:', error);
        if (isMounted) {
          setBranches([]);
          setBranchesError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setBranchesLoading(false);
      }
    };

    loadSupabaseBranches();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  // Product catalog comes only from Supabase.
  useEffect(() => {
    let isMounted = true;

    if (!session) {
      setProducts([]);
      setProductsLoading(false);
      setProductsError(null);
      return () => {
        isMounted = false;
      };
    }

    const loadSupabaseProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError(null);
        const supabaseProducts = await loadProducts();
        if (isMounted) setProducts(supabaseProducts);
      } catch (error) {
        console.error('Failed to load products from Supabase:', error);
        if (isMounted) {
          setProducts([]);
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
  }, [session?.user.id]);

  // Orders also come only from Supabase.
  useEffect(() => {
    let isMounted = true;

    if (!session) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(null);
      return () => {
        isMounted = false;
      };
    }

    const loadSupabaseOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const supabaseOrders = await loadOrders();
        if (isMounted) setOrders(supabaseOrders);
      } catch (error) {
        console.error('Failed to load orders from Supabase:', error);
        if (isMounted) {
          setOrders([]);
          setOrdersError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    };

    loadSupabaseOrders();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw error;

    setSession(data.session);
    setActiveView('Dashboard');
  };

  const handleSignOut = async () => {
    if (!confirm('Bạn muốn đăng xuất khỏi OrderHub F&B?')) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setActiveView('Dashboard');
      setMobileSidebarExpanded(false);
    } catch (error) {
      console.error('Failed to sign out from Supabase:', error);
      alert(`Không thể đăng xuất: ${getErrorMessage(error)}`);
    }
  };

  // --- CRUD Order Actions handlers ---
  const handleAddOrder = async (newOrder: Order): Promise<boolean> => {
    try {
      const savedOrder = await createOrder(newOrder);
      setOrders(currentOrders => [savedOrder, ...currentOrders.filter(order => order.id !== savedOrder.id)]);
      return true;
    } catch (error) {
      console.error('Failed to add order in Supabase:', error);
      alert(`Không thể lưu đơn hàng vào Supabase: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleDeleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      await deleteOrder(orderId);
      setOrders(currentOrders => currentOrders.filter(order => order.id !== orderId));
      return true;
    } catch (error) {
      console.error('Failed to delete order in Supabase:', error);
      alert(`Không thể xóa đơn hàng khỏi Supabase: ${getErrorMessage(error)}`);
      return false;
    }
  };

  // --- CRUD Product Actions handlers ---
  const handleAddProduct = async (newProduct: Product): Promise<boolean> => {
    try {
      const savedProduct = await createProduct(newProduct);
      setProducts(currentProducts => [savedProduct, ...currentProducts.filter(p => p.id !== savedProduct.id)]);
      alert(`Đã thêm sản phẩm "${savedProduct.name}" vào Supabase thành công.`);
      return true;
    } catch (error) {
      console.error('Failed to add product in Supabase:', error);
      alert(`Không thể thêm sản phẩm vào Supabase: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleEditProduct = async (updatedProduct: Product): Promise<boolean> => {
    try {
      const savedProduct = await updateProduct(updatedProduct);
      setProducts(currentProducts => currentProducts.map(p => p.id === savedProduct.id ? savedProduct : p));
      alert(`Đã cập nhật thông tin sản phẩm "${savedProduct.name}" trong Supabase.`);
      return true;
    } catch (error) {
      console.error('Failed to update product in Supabase:', error);
      alert(`Không thể cập nhật sản phẩm trong Supabase: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    try {
      await deleteProduct(productId);
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error('Failed to delete product in Supabase:', error);
      alert(`Không thể xóa sản phẩm khỏi Supabase: ${getErrorMessage(error)}`);
      return false;
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-slate-700 font-sans antialiased flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
          <LoaderCircle size={20} className="animate-spin text-[#f97316]" />
          <span className="text-sm font-black">Đang kiểm tra phiên đăng nhập...</span>
        </div>
      </main>
    );
  }

  if (!session) {
    return <LoginView authError={authError} onLogin={handleLogin} />;
  }

  const userMetadata = session.user.user_metadata;
  const displayName = typeof userMetadata?.full_name === 'string' && userMetadata.full_name.trim()
    ? userMetadata.full_name.trim()
    : session.user.email ?? 'Admin user';
  const userInitials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

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
            
            <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-3">
              <div
                className="w-8 h-8 rounded-full border border-orange-100 bg-orange-100 text-[#9d4300] flex items-center justify-center shadow-sm text-[11px] font-black"
                title={displayName}
              >
                {userInitials}
              </div>
              <span className="hidden md:inline max-w-[180px] truncate text-xs font-bold text-slate-700">{displayName}</span>
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
                { name: 'Customers', icon: <UsersRound size={18} /> },
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
                    <span>{item.name === 'Customers' ? 'Khách hàng' : item.name === 'Product Catalog' ? 'Product Catalog' : item.name}</span>
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
              onClick={handleSignOut}
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
                    { name: 'Customers', icon: <UsersRound size={18} /> },
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
                        <span>{item.name === 'Customers' ? 'Khách hàng' : item.name === 'Product Catalog' ? 'Product Catalog' : item.name}</span>
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
                  onClick={handleSignOut}
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
            {branchesLoading && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Loading branches from Supabase...
              </div>
            )}

            {branchesError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Supabase branches are unavailable. No local branch fallback is used. Error: {branchesError}
              </div>
            )}

            {productsLoading && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Loading product catalog from Supabase...
              </div>
            )}

            {productsError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Supabase product catalog is unavailable. No local product fallback is used. Error: {productsError}
              </div>
            )}

            {ordersLoading && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                Loading orders from Supabase...
              </div>
            )}

            {ordersError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                Supabase orders are unavailable. No local order fallback is used. Error: {ordersError}
              </div>
            )}
            
            {activeView === 'Dashboard' && (
              <DashboardView 
                branches={branches}
                orders={orders} 
                products={products}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === 'Orders' && (
              <OrdersView 
                branches={branches}
                orders={orders} 
                onNavigate={(v) => setActiveView(v)}
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeView === 'New Order' && (
              <NewOrderView 
                branches={branches}
                products={products}
                onAddOrder={handleAddOrder}
                onNavigate={(v) => setActiveView(v)}
              />
            )}

            {activeView === 'Customers' && (
              <CustomerDataView orders={orders} />
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
          { id: 'Customers', label: 'Khách', icon: <UsersRound size={18} /> },
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
