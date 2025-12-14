import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { databases, DB_ID, COLL_ID } from '../lib/appwrite';
import { ID } from 'appwrite';
import { Save, Loader2, Package, DollarSign, Layers, Tag } from 'lucide-react';

// KOMPONEN UI (Di luar fungsi utama agar form tidak hilang fokus)
const InputGroup = ({ label, error, children, icon: Icon }) => (
  <div className="mb-5">
    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
      {Icon && <Icon size={14} className="text-indigo-500" />} {label}
    </label>
    {children}
    {error && <span className="text-red-500 text-[10px] font-bold mt-1 block animate-pulse">* Wajib diisi</span>}
  </div>
);

export default function InputBarang() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
  
  const hargaModal = watch("harga_modal");
  const margin = watch("margin");

  // Kalkulasi Harga Jual Otomatis
  useEffect(() => {
    const modal = parseFloat(hargaModal) || 0;
    const persentase = parseFloat(margin) || 0;
    if (modal > 0) {
        setValue("harga_jual", modal + (modal * (persentase / 100)));
    }
  }, [hargaModal, margin, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await databases.createDocument(DB_ID, COLL_ID, ID.unique(), {
          ...data,
          kategori: data.kategori, // Field Baru
          stok_barang: parseInt(data.stok_barang),
          harga_modal: parseFloat(data.harga_modal),
          margin: parseFloat(data.margin),
          harga_jual: parseFloat(data.harga_jual),
      });
      alert("✅ Data Berhasil Disimpan!");
      reset();
    } catch (error) { 
        alert("Gagal menyimpan: " + error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400";

  return (
    <div className="max-w-5xl mx-auto animate-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Input Barang</h1>
        <p className="text-slate-500 font-medium mt-1">Tambahkan stok sparepart baru ke database.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KARTU KIRI: DETAIL BARANG */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Identitas Barang</h3>
                    <p className="text-xs text-slate-400">Informasi fisik dan klasifikasi</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Part Number" error={errors.part_no}>
                    <input {...register("part_no", { required: true })} className={inputClass} placeholder="Misal: 5TL-H2021" />
                </InputGroup>
                <InputGroup label="Merk / Brand" error={errors.merk}>
                    <input {...register("merk", { required: true })} className={inputClass} placeholder="Yamaha, Honda..." />
                </InputGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* INPUT KATEGORI BARU */}
                <InputGroup label="Kategori" icon={Tag} error={errors.kategori}>
                    <select {...register("kategori", { required: true })} className={inputClass}>
                        <option value="">Pilih...</option>
                        <option value="Oli">Oli / Pelumas</option>
                        <option value="Ban">Ban & Velg</option>
                        <option value="Kampas">Kampas Rem</option>
                        <option value="Mesin">Sparepart Mesin</option>
                        <option value="CVT">Bagian CVT</option>
                        <option value="Body">Body Part</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </InputGroup>

                <div className="md:col-span-2">
                    <InputGroup label="Nama Barang / Deskripsi" error={errors.deskripsi}>
                        <input {...register("deskripsi", { required: true })} className={inputClass} placeholder="Nama lengkap sparepart..." />
                    </InputGroup>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Lokasi Rak" icon={Layers}>
                    <input {...register("posisi")} className={inputClass} placeholder="A-01" />
                </InputGroup>
                <InputGroup label="Stok Awal" error={errors.stok_barang}>
                    <input type="number" {...register("stok_barang", { required: true })} className={inputClass} placeholder="0" />
                </InputGroup>
            </div>
        </div>

        {/* KARTU KANAN: HARGA */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-fit lg:sticky lg:top-6">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Harga & Margin</h3>
                    <p className="text-xs text-slate-400">Kalkulasi profit otomatis</p>
                </div>
            </div>

            <InputGroup label="Harga Modal (Rp)" error={errors.harga_modal}>
                <input type="number" step="any" {...register("harga_modal", { required: true })} className={inputClass} placeholder="0" />
            </InputGroup>

            <InputGroup label="Margin (%)" error={errors.margin}>
                <input type="number" step="any" {...register("margin", { required: true })} className={inputClass} placeholder="Contoh: 20" />
            </InputGroup>

            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl mt-6 text-white shadow-xl shadow-slate-900/20">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Harga Jual Final</label>
                <div className="flex items-center text-emerald-400 font-bold text-lg">
                    <span>Rp</span>
                    <input 
                        type="number" readOnly 
                        {...register("harga_jual")} 
                        className="w-full bg-transparent text-2xl font-bold text-white outline-none border-none p-0 ml-2 focus:ring-0" 
                    />
                </div>
            </div>

            <button 
                type="submit" disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Simpan Database
            </button>
        </div>

      </form>
    </div>
  );
}