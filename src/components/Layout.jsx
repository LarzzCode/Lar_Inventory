import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusSquare, Package, LogOut, FileSpreadsheet } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/input', label: 'Input', icon: PlusSquare },
    { path: '/import', label: 'Import', icon: FileSpreadsheet },
  ];

  // Komponen Sidebar Desktop (Tidak Berubah Banyak)
  const SidebarDesktop = () => (
    <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-full fixed left-0 top-0 z-30">
       <div className="h-20 flex items-center px-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
                  <Package size={22} />
                </div>
                <span className="text-xl font-extrabold text-slate-800 tracking-tight">Bengkel<span className="text-indigo-600">Pro</span></span>
            </div>
       </div>
       <nav className="flex-1 px-4 py-6 space-y-2">
         {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <Icon size={20} /> {item.label}
              </Link>
            )
         })}
       </nav>
       <div className="p-4 border-t border-slate-50">
          <button className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl">
             <LogOut size={18} /> Sign Out
          </button>
       </div>
    </div>
  );

  // Komponen Bottom Bar Mobile (BARU!)
  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center px-2 py-3">
        {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center gap-1 p-2">
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 -translate-y-2' : 'text-slate-400'
                }`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {/* Label Kecil (Opsional, bisa dihapus jika ingin icon saja) */}
                <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.label}
                </span>
              </Link>
            )
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. SIDEBAR (Desktop Only) */}
      <SidebarDesktop />

      {/* 2. MAIN CONTENT */}
      {/* ml-0 di HP, ml-72 di Desktop. pb-24 agar konten tidak tertutup Bottom Bar di HP */}
      <main className="md:ml-72 min-h-screen transition-all duration-300">
        
        {/* Mobile Header Sederhana (Hanya Logo) */}
        <header className="md:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-center sticky top-0 z-40 px-4">
             <div className="flex items-center gap-2 font-extrabold text-slate-800 text-lg">
                <Package className="text-indigo-600" size={20} /> BengkelPro
             </div>
        </header>

        {/* Konten Halaman */}
        <div className="p-4 md:p-8 pb-28 md:pb-8 w-full max-w-[1600px] mx-auto">
           {children}
        </div>

      </main>

      {/* 3. BOTTOM NAVIGATION (Mobile Only) */}
      <MobileBottomNav />

    </div>
  );
}