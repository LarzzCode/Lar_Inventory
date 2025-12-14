import { useState } from 'react';
import { databases, DB_ID, COLL_ID } from '../lib/appwrite';
import { ID } from 'appwrite';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState({ success: 0, fail: 0, errors: [] });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = XLSX.read(event.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        setPreviewData(data);
        setLog({ success: 0, fail: 0, errors: [] }); 
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const cleanNumber = (val) => {
    if (!val) return 0;
    const str = String(val).replace(/[^0-9.-]+/g, ""); 
    return parseFloat(str) || 0;
  };

  // Generator kode acak (VR_AUTO_XXXX)
  const generateAutoCode = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `VR_AUTO_${randomNum}`;
  };

  const handleUpload = async () => {
    if (!previewData.length) return;
    setUploading(true);
    setProgress(0);
    let successCount = 0;
    let failCount = 0;
    let errorList = [];
    let processedCodes = new Set();

    for (let i = 0; i < previewData.length; i++) {
      const item = previewData[i];
      const rowNum = i + 2; 

      try {
        // 1. SKIP BARIS KOSONG
        if (!item.part_no && !item.merk && !item.deskripsi) continue; 

        // 2. MERK DEFAULT "VR_AUTO" (JIKA KOSONG)
        const finalMerk = item.merk ? String(item.merk) : "VR_AUTO";

        // 3. VALIDASI WAJIB TERSISA (Hanya Deskripsi)
        if (!item.deskripsi) throw new Error("Nama Barang (Deskripsi) Kosong");

        // 4. LOGIKA PART NUMBER (Auto Generate jika kosong)
        let finalPartNo = item.part_no ? String(item.part_no).trim() : "";
        if (!finalPartNo || finalPartNo === "-") {
            finalPartNo = generateAutoCode();
            while (processedCodes.has(finalPartNo)) {
                finalPartNo = generateAutoCode();
            }
        }

        // Cek duplikat internal file
        if (processedCodes.has(finalPartNo)) {
             throw new Error(`Kode '${finalPartNo}' ganda di dalam file Excel ini.`);
        }
        processedCodes.add(finalPartNo);

        // 5. PERSIAPAN DATA
        const modal = cleanNumber(item.harga_modal);
        const margin = cleanNumber(item.margin);
        const stok = cleanNumber(item.stok_barang);
        const hargaJual = modal + (modal * (margin / 100));

        // 6. KIRIM KE APPWRITE
        await databases.createDocument(DB_ID, COLL_ID, ID.unique(), {
          part_no: finalPartNo,
          merk: finalMerk, // Menggunakan logika VR_AUTO
          kategori: String(item.kategori || 'Lainnya'),
          deskripsi: String(item.deskripsi),
          posisi: String(item.posisi || '-'),
          stok_barang: parseInt(stok),
          harga_modal: parseFloat(modal),
          margin: parseFloat(margin),
          harga_jual: parseFloat(hargaJual)
        });

        successCount++;
      } catch (error) {
        console.error(error);
        failCount++;
        let msg = error.message;
        if (error.code === 409) msg = "GAGAL: Part Number ini sudah ada di database.";
        errorList.push(`Baris ${rowNum}: ${msg}`);
      }

      setProgress(Math.round(((i + 1) / previewData.length) * 100));
    }

    setLog({ success: successCount, fail: failCount, errors: errorList });
    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-enter">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Import Excel</h1>
           <p className="text-slate-500 text-sm">
             Merk kosong = <b>VR_AUTO</b>, Part No kosong = <b>VR_AUTO_XXXX</b>.
           </p>
        </div>
      </div>

      {/* AREA UPLOAD (SAMA SEPERTI SEBELUMNYA) */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-indigo-500 transition-colors">
        {!file ? (
            <>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Pilih File Excel (.xlsx)</h3>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer mx-auto max-w-xs"/>
            </>
        ) : (
            <div className="flex flex-col items-center">
                <FileSpreadsheet size={48} className="text-emerald-600 mb-2" />
                <p className="font-bold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-500 mb-4">{previewData.length} baris terdeteksi</p>
                {!uploading && <button onClick={() => {setFile(null); setLog({success:0, fail:0, errors:[]})}} className="text-red-500 text-xs font-bold hover:underline flex items-center gap-1"><RefreshCw size={12}/> Ganti File</button>}
            </div>
        )}
      </div>

      {file && !uploading && log.success === 0 && log.fail === 0 && (
          <div className="text-center">
              <button onClick={handleUpload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
                  Proses Upload
              </button>
          </div>
      )}

      {/* PROGRESS BAR & LOG ERROR (SAMA SEPERTI SEBELUMNYA) */}
      {uploading && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between mb-2 text-xs font-bold text-slate-500">
                  <span>Memproses...</span>
                  <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="bg-indigo-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
          </div>
      )}

      {(log.success > 0 || log.fail > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="text-emerald-500 mb-2" size={40} />
                  <h3 className="font-bold text-emerald-800 text-2xl">{log.success}</h3>
                  <p className="text-emerald-600 text-sm font-bold">Berhasil Disimpan</p>
              </div>
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="text-red-500" size={24} />
                    <div>
                        <h3 className="font-bold text-red-800 text-lg">{log.fail} Gagal</h3>
                        <p className="text-red-600 text-xs">Lihat error di bawah:</p>
                    </div>
                  </div>
                  {log.errors.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-red-100 max-h-40 overflow-y-auto">
                        <ul className="space-y-1">
                            {log.errors.map((err, i) => <li key={i} className="text-[10px] text-red-600 font-mono border-b border-red-50 pb-1 last:border-0">⚠️ {err}</li>)}
                        </ul>
                    </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}