import { useState, useEffect } from 'react';
import { databases, DB_ID, COLL_ID } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Trash2, Edit, Search, Save, X, AlertCircle, Plus, Tag, Layers, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [allItems, setAllItems] = useState([]); 
  const [filteredItems, setFilteredItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // STATE DASHBOARD
  const [stats, setStats] = useState({ totalItems: 0, totalAsset: 0, lowStock: 0 });
  const [page, setPage] = useState(0); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [activeTab, setActiveTab] = useState('all'); 
  
  // STATE MODAL EDIT
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const PER_PAGE = 15; 

  // --- 1. FETCH DATA (CLIENT SIDE) ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DB_ID, COLL_ID, [
          Query.limit(5000), 
          Query.orderDesc('$createdAt')
      ]);
      setAllItems(response.documents); 
      setFilteredItems(response.documents); 
      calculateStats(response.documents);
    } catch (error) { 
        console.error("Gagal ambil data:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  const calculateStats = (docs) => {
    const currentAsset = docs.reduce((acc, item) => acc + (item.harga_modal * item.stok_barang), 0);
    setStats({ 
       totalItems: docs.length, 
       totalAsset: currentAsset, 
       lowStock: docs.filter(i => i.stok_barang < 5).length 
    });
  };

  useEffect(() => { fetchAllData(); }, []); 

  // --- 2. LOGIKA SEARCH & FILTER ---
  useEffect(() => {
    let result = allItems;
    if (activeTab === 'low') {
        result = result.filter(item => item.stok_barang < 5);
    } else if (activeTab !== 'all') {
        result = result.filter(item => item.kategori === activeTab);
    }

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(item => 
            (item.deskripsi && item.deskripsi.toLowerCase().includes(lowerTerm)) ||
            (item.part_no && item.part_no.toLowerCase().includes(lowerTerm)) ||
            (item.merk && item.merk.toLowerCase().includes(lowerTerm))
        );
    }
    setFilteredItems(result);
    setPage(0); 
  }, [searchTerm, activeTab, allItems]);

  const paginatedItems = filteredItems.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // --- 3. LOGIKA CRUD ---
  const handleDelete = async (id) => { 
      if (confirm("Yakin hapus data ini?")) { 
          await databases.deleteDocument(DB_ID, COLL_ID, id); 
          const newList = allItems.filter(item => item.$id !== id);
          setAllItems(newList);
          calculateStats(newList);
      } 
  };

  const handleEditClick = (item) => {
      setEditingItem({ ...item }); 
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const updated = await databases.updateDocument(DB_ID, COLL_ID, editingItem.$id, {
              deskripsi: editingItem.deskripsi,
              part_no: editingItem.part_no,
              merk: editingItem.merk,
              kategori: editingItem.kategori,
              posisi: editingItem.posisi,
              stok_barang: parseInt(editingItem.stok_barang),
              harga_modal: parseFloat(editingItem.harga_modal),
              margin: parseFloat(editingItem.margin),
              harga_jual: parseFloat(editingItem.harga_jual)
          });

          const newList = allItems.map(item => item.$id === updated.$id ? updated : item);
          setAllItems(newList);
          calculateStats(newList);
          setEditingItem(null); 
          alert("✅ Data berhasil diupdate!");
      } catch (error) {
          alert("Gagal update: " + error.message);
      } finally {
          setIsSaving(false);
      }
  };

  const handleEditChange = (field, value) => {
      let newData = { ...editingItem, [field]: value };
      if (field === 'harga_modal' || field === 'margin') {
          const modal = parseFloat(field === 'harga_modal' ? value : editingItem.harga_modal) || 0;
          const margin = parseFloat(field === 'margin' ? value : editingItem.margin) || 0;
          newData.harga_jual = modal + (modal * (margin / 100));
      }
      setEditingItem(newData);
  };

  const toRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const TabBtn = ({ id, label, icon: Icon, colorClass }) => (
    <button 
        onClick={() => { setActiveTab(id); setSearchTerm(''); }} 
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap snap-start
        ${activeTab === id 
            ? `bg-slate-900 text-white border-slate-900 shadow-lg transform scale-105` 
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
        } ${activeTab === id && colorClass ? colorClass : ''}`}
    >
        {Icon && <Icon size={14} />} {label}
    </button>
  );

  return (
    <>
        {/* --- KONTEN UTAMA (DI DALAM ANIMASI) --- */}
        <div className="space-y-6 pb-32 animate-enter relative z-0">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventaris Gudang</h1>
                <p className="text-slate-500 text-sm font-medium">Total {stats.totalItems} Item terdaftar.</p>
            </div>
            <Link to="/input" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 md:py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                <Plus size={18} /> Tambah Barang Baru
            </Link>
        </div>

        {/* FILTER BAR STICKY */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20">
            <div className="relative group mb-3">
                <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Cari Barang..." 
                    className="w-full pl-12 pr-10 py-2.5 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"><RefreshCw size={16} /></button>}
            </div>

            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x">
                <TabBtn id="all" label="Semua" icon={Layers} />
                <TabBtn id="low" label="Stok Kritis" icon={AlertCircle} colorClass="bg-red-600 border-red-600" />
                <div className="w-px h-6 bg-slate-300 mx-1 self-center shrink-0"></div>
                {['Oli', 'Ban', 'Kampas', 'Mesin', 'Lainnya'].map(k => <TabBtn key={k} id={k} label={k} icon={Tag} />)}
            </div>
        </div>

        {/* LIST DATA */}
        {loading ? (
            <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</p></div>
        ) : (
            <>
                {/* DESKTOP TABLE */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Detail Produk</th>
                                <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Lokasi</th>
                                <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Stok</th>
                                <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Harga Jual</th>
                                <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedItems.map((item) => (
                                <tr key={item.$id} className="hover:bg-indigo-50/10 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${item.stok_barang < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{item.merk ? item.merk.substring(0, 2).toUpperCase() : '??'}</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-[15px]">{item.deskripsi}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 rounded">{item.part_no}</span>
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">{item.merk}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 font-medium text-xs">{item.posisi || '-'}</td>
                                    <td className="px-6 py-3 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.stok_barang < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.stok_barang}</span></td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-700">{toRupiah(item.harga_jual)}</td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(item.$id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-3">
                    {paginatedItems.map(item => (
                        <div key={item.$id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${item.stok_barang < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{item.merk}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditClick(item)} className="p-1.5 bg-slate-50 text-slate-500 rounded-lg active:bg-indigo-100 active:text-indigo-600"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(item.$id)} className="p-1.5 bg-slate-50 text-slate-500 rounded-lg active:bg-red-100 active:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 text-base leading-snug pr-2 mb-1 line-clamp-2">{item.deskripsi}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-3">{item.part_no}</p>
                            <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Stok</p>
                                    <p className={`text-sm font-extrabold ${item.stok_barang < 5 ? 'text-red-600' : 'text-slate-800'}`}>{item.stok_barang} <span className="text-[10px] font-normal text-slate-400">Unit</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Harga Jual</p>
                                    <p className="text-lg font-extrabold text-indigo-600">{toRupiah(item.harga_jual)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* PAGINATION */}
                {filteredItems.length > PER_PAGE && (
                    <div className="flex items-center justify-center gap-4 pt-6">
                        <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"><ArrowLeft size={14} /> Prev</button>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{page + 1} / {Math.ceil(filteredItems.length / PER_PAGE)}</span>
                        <button disabled={(page + 1) * PER_PAGE >= filteredItems.length} onClick={() => setPage(p => p + 1)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-900 text-white border border-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40">Next <ArrowRight size={14} /></button>
                    </div>
                )}
            </>
        )}
        </div>

        {/* --- MODAL EDIT (DI LUAR DIV UTAMA AGAR POSISI FIXED BENAR) --- */}
        {editingItem && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white w-full md:max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                    
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Edit size={18} className="text-indigo-600"/> Edit Barang</h3>
                        <button onClick={() => setEditingItem(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-100"><X size={18} /></button>
                    </div>
                    
                    {/* Modal Body */}
                    <form onSubmit={handleUpdate} className="p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Part Number</label>
                                <input type="text" value={editingItem.part_no} onChange={e => handleEditChange('part_no', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Merk</label>
                                <input type="text" value={editingItem.merk} onChange={e => handleEditChange('merk', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Barang</label>
                            <input type="text" value={editingItem.deskripsi} onChange={e => handleEditChange('deskripsi', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                                <select value={editingItem.kategori} onChange={e => handleEditChange('kategori', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none">
                                    {['Oli', 'Ban', 'Kampas', 'Mesin', 'CVT', 'Body', 'Lainnya'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Rak</label>
                                <input type="text" value={editingItem.posisi} onChange={e => handleEditChange('posisi', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Stok</label>
                                <input type="number" value={editingItem.stok_barang} onChange={e => handleEditChange('stok_barang', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Modal (Rp)</label>
                                    <input type="number" value={editingItem.harga_modal} onChange={e => handleEditChange('harga_modal', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Margin (%)</label>
                                    <input type="number" value={editingItem.margin} onChange={e => handleEditChange('margin', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                                <span className="text-xs font-bold text-slate-500">Harga Jual:</span>
                                <span className="text-xl font-extrabold text-indigo-600">{toRupiah(editingItem.harga_jual)}</span>
                            </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2 active:scale-95 transition-all">
                            {isSaving ? 'Menyimpan...' : <><Save size={18}/> Simpan Perubahan</>}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </>
  );
}