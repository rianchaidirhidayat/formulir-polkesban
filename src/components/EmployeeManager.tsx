import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Building2,
  Briefcase,
  IdCard,
  Phone,
  Mail,
  Database,
  ClipboardPaste,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee } from '../types';
import {
  getEmployees,
  saveBatchEmployees,
  saveEmployee,
  deleteEmployee,
  subscribeToEmployees,
} from '../services/firestoreService';
import { DEFAULT_EMPLOYEES } from '../data/defaultEmployees';

interface EmployeeManagerProps {
  onNotify?: (title: string, description: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * Parses delimited text (semicolon, comma, or tab) into Employee[]
 */
function parseDelimitedText(text: string): Employee[] {
  const lines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect separator: ;, \t, or ,
  const firstLine = lines[0];
  let sep = ';';
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;

  if (countTab > countSemi && countTab > countComma) {
    sep = '\t';
  } else if (countComma > countSemi) {
    sep = ',';
  } else {
    sep = ';';
  }

  const headerParts = firstLine.split(sep).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const nipIdx = headerParts.findIndex(
    (h) => h.includes('nip') || h.includes('id') || h.includes('nomor induk') || h.includes('no induk')
  );
  const nameIdx = headerParts.findIndex((h) => h.includes('nama') || h.includes('name'));
  const jabatanIdx = headerParts.findIndex(
    (h) => h.includes('jabat') || h.includes('posisi') || h.includes('pekerjaan') || h.includes('position')
  );
  const unitIdx = headerParts.findIndex(
    (h) => h.includes('unit') || h.includes('divisi') || h.includes('bagian') || h.includes('jurusan') || h.includes('department')
  );
  const emailIdx = headerParts.findIndex((h) => h.includes('email') || h.includes('surel'));
  const phoneIdx = headerParts.findIndex(
    (h) => h.includes('telepon') || h.includes('hp') || h.includes('wa') || h.includes('phone') || h.includes('whatsapp')
  );

  const result: Employee[] = [];
  const startRow = nipIdx >= 0 || nameIdx >= 0 ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const rawNip = nipIdx >= 0 ? cols[nipIdx] : cols[0];
    const cleanNip = (rawNip || '').replace(/[^0-9]/g, '').trim();
    const rawNama = nameIdx >= 0 ? cols[nameIdx] : cols[1];

    if (!cleanNip || !rawNama) continue;

    const rawJabatan = jabatanIdx >= 0 ? cols[jabatanIdx] : cols[2];
    const rawUnit = unitIdx >= 0 ? cols[unitIdx] : cols[3];
    let rawEmail = emailIdx >= 0 ? cols[emailIdx] : cols[4];
    if (rawEmail === '-') rawEmail = '';
    let rawPhone = phoneIdx >= 0 ? cols[phoneIdx] : cols[5];
    if (rawPhone === '-') rawPhone = '';

    result.push({
      id: cleanNip,
      nip: cleanNip,
      nama: rawNama.trim(),
      jabatan: rawJabatan?.trim() || undefined,
      unitKerja: rawUnit?.trim() || undefined,
      email: rawEmail?.trim() || undefined,
      phone: rawPhone?.trim() || undefined,
    });
  }

  return result;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ onNotify }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Employee[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Direct Text / Paste modal state
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedRawText, setPastedRawText] = useState('');

  // Self-contained internal notification banner state
  const [internalNotice, setInternalNotice] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Form fields for single employee add/edit
  const [formNip, setFormNip] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToEmployees(
      (list) => {
        setEmployees(list);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.nip.toLowerCase().includes(q) ||
      emp.nama.toLowerCase().includes(q) ||
      (emp.jabatan && emp.jabatan.toLowerCase().includes(q)) ||
      (emp.unitKerja && emp.unitKerja.toLowerCase().includes(q))
    );
  });

  // Handle file select (Excel / CSV)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsUploading(true);
    setInternalNotice(null);

    try {
      let parsedEmployees: Employee[] = [];

      // Check if file is CSV or plain text
      if (
        file.name.toLowerCase().endsWith('.csv') ||
        file.name.toLowerCase().endsWith('.txt') ||
        file.type.includes('csv') ||
        file.type.includes('text')
      ) {
        const textContent = await file.text();
        parsedEmployees = parseDelimitedText(textContent);
      } else {
        // Excel file (.xlsx / .xls)
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Check if worksheet has single delimited text or regular columns
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length > 0) {
          const firstKeys = Object.keys(jsonData[0] || {});
          if (firstKeys.length === 1 && (firstKeys[0].includes(';') || firstKeys[0].includes('\t'))) {
            // Semicolon/tab separated content wrapped in Excel
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            parsedEmployees = parseDelimitedText(csvText);
          } else {
            for (const row of jsonData) {
              const rawNip = String(
                row['NIP'] ||
                row['nip'] ||
                row['Nomor Induk Pegawai'] ||
                row['No. Induk Pegawai'] ||
                row['No Induk'] ||
                row['ID'] ||
                row['id'] ||
                ''
              ).replace(/[^0-9]/g, '').trim();

              const rawNama = String(
                row['Nama'] ||
                row['nama'] ||
                row['Nama Pegawai'] ||
                row['Nama Lengkap'] ||
                row['Nama Lengkap Beserta Gelar'] ||
                row['Name'] ||
                ''
              ).trim();

              const rawJabatan = String(
                row['Jabatan'] ||
                row['jabatan'] ||
                row['Posisi'] ||
                row['Pekerjaan'] ||
                row['Position'] ||
                ''
              ).trim();

              const rawUnit = String(
                row['Unit Kerja'] ||
                row['unit_kerja'] ||
                row['Unit'] ||
                row['Divisi'] ||
                row['Bagian'] ||
                row['Jurusan'] ||
                row['Department'] ||
                ''
              ).trim();

              let rawEmail = String(row['Email'] || row['email'] || row['Surel'] || '').trim();
              if (rawEmail === '-') rawEmail = '';

              let rawPhone = String(
                row['No HP'] ||
                row['No Telepon'] ||
                row['Telepon'] ||
                row['WhatsApp'] ||
                row['phone'] ||
                row['Phone'] ||
                ''
              ).trim();
              if (rawPhone === '-') rawPhone = '';

              if (rawNip && rawNama) {
                parsedEmployees.push({
                  id: rawNip,
                  nip: rawNip,
                  nama: rawNama,
                  jabatan: rawJabatan || undefined,
                  unitKerja: rawUnit || undefined,
                  email: rawEmail || undefined,
                  phone: rawPhone || undefined,
                });
              }
            }
          }
        }
      }

      if (parsedEmployees.length === 0) {
        throw new Error(
          'Tidak ditemukan kolom NIP dan Nama yang valid. Pastikan berkas memiliki kolom NIP dan Nama.'
        );
      }

      setPreviewData(parsedEmployees);
      const readyMsg = `Ditemukan ${parsedEmployees.length} data pegawai valid dari ${file.name}. Silakan tinjau dan klik tombol "Simpan ke Database" di bawah.`;
      setInternalNotice({
        title: 'Pratinjau Data Siap',
        desc: readyMsg,
        type: 'info',
      });
      if (onNotify) {
        onNotify('Pratinjau Berkas Siap', readyMsg, 'info');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Format berkas tidak didukung';
      setInternalNotice({
        title: 'Gagal Membaca Berkas',
        desc: errMsg,
        type: 'error',
      });
      if (onNotify) {
        onNotify('Gagal Membaca Berkas', errMsg, 'error');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Commit preview data to Firestore
  const handleConfirmImport = async () => {
    if (!previewData || previewData.length === 0) return;

    setIsUploading(true);
    setInternalNotice(null);
    try {
      const count = await saveBatchEmployees(previewData);
      setPreviewData(null);
      setSelectedFileName('');
      const successTitle = 'Data Pegawai Berhasil Disimpan ke Database!';
      const successDesc = `Alhamdulillah! ${count} data pegawai berhasil disimpan ke database Firestore & memori lokal. NIP auto-fill formulir langsung aktif.`;
      setInternalNotice({
        title: successTitle,
        desc: successDesc,
        type: 'success',
      });
      if (onNotify) {
        onNotify(successTitle, successDesc, 'success');
      }
    } catch (err: any) {
      const errTitle = 'Gagal Menyimpan ke Database';
      const errDesc = err.message || 'Terjadi masalah saat menyimpan ke Firestore.';
      setInternalNotice({
        title: errTitle,
        desc: errDesc,
        type: 'error',
      });
      if (onNotify) {
        onNotify(errTitle, errDesc, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // One-click sync of all 412 master employees into Firestore
  const handleSyncAllDefaultEmployees = async () => {
    setIsUploading(true);
    setInternalNotice(null);
    try {
      const count = await saveBatchEmployees(DEFAULT_EMPLOYEES);
      const successTitle = '412 Data Pegawai Berhasil Dimasukkan ke Database!';
      const successDesc = `Seluruh ${count} data pegawai resmi telah tersimpan secara permanen di database Firestore & siap digunakan untuk auto-fill NIP formulir.`;
      setInternalNotice({
        title: successTitle,
        desc: successDesc,
        type: 'success',
      });
      if (onNotify) {
        onNotify(successTitle, successDesc, 'success');
      }
    } catch (err: any) {
      setInternalNotice({
        title: 'Gagal Menyimpan ke Database',
        desc: err.message || 'Terjadi kesalahan saat menyimpan ke Firestore.',
        type: 'error',
      });
      if (onNotify) {
        onNotify('Gagal Menyimpan', err.message, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Parse pasted raw text
  const handleParsePastedText = () => {
    if (!pastedRawText.trim()) return;
    try {
      const parsed = parseDelimitedText(pastedRawText);
      if (parsed.length === 0) {
        throw new Error('Tidak ada data pegawai yang dapat diproses. Pastikan format teks berisi NIP dan Nama.');
      }
      setPreviewData(parsed);
      setSelectedFileName('Teks Ditempel (' + parsed.length + ' data)');
      setIsPasteModalOpen(false);
      setPastedRawText('');
      const readyMsg = `Ditemukan ${parsed.length} data pegawai valid dari teks yang ditempel. Silakan tinjau dan klik "Simpan ke Database".`;
      setInternalNotice({
        title: 'Pratinjau Data Siap',
        desc: readyMsg,
        type: 'info',
      });
      if (onNotify) {
        onNotify('Pratinjau Data Siap', readyMsg, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Download template Excel file
  const handleDownloadTemplateExcel = () => {
    const templateData = [
      {
        NIP: '198501012010121001',
        'Nama Lengkap': 'Rian Chaidir Hidayat, M.Kom.',
        Jabatan: 'Pranata Komputer Ahli Muda',
        'Unit Kerja': 'Sub Bagian Administrasi Sistem Informasi & IT',
        Email: 'rianchaidirhidayat@gmail.com',
        'No WhatsApp': '081234567890',
      },
      {
        NIP: '197805122002121002',
        'Nama Lengkap': 'Dr. Ir. Ahmad Sudrajat, M.T.',
        Jabatan: 'Kepala Bagian Umum & Kepegawaian',
        'Unit Kerja': 'Bagian Tata Usaha dan Kepegawaian',
        Email: 'ahmad.sudrajat@instansi.go.id',
        'No WhatsApp': '081298765432',
      },
      {
        NIP: '199203152015032004',
        'Nama Lengkap': 'Siti Nurhaliza, S.ST., M.Keb.',
        Jabatan: 'Dosen Lektor / Tenaga Pendidik',
        'Unit Kerja': 'Jurusan Kebidanan & Keperawatan',
        Email: 'siti.nurhaliza@poltekkes.ac.id',
        'No WhatsApp': '085712345678',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // Adjust column widths
    ws['!cols'] = [
      { wch: 22 }, // NIP
      { wch: 32 }, // Nama
      { wch: 30 }, // Jabatan
      { wch: 40 }, // Unit Kerja
      { wch: 30 }, // Email
      { wch: 18 }, // WhatsApp
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Pegawai');
    XLSX.writeFile(wb, 'Template_Master_Data_Pegawai.xlsx');

    if (onNotify) {
      onNotify('Template Terunduh', 'Format Excel siap diisi dengan data pegawai instansi Anda.', 'info');
    }
  };

  // Export current list to Excel
  const handleExportCurrent = () => {
    if (employees.length === 0) {
      alert('Belum ada data pegawai untuk diekspor.');
      return;
    }

    const exportRows = employees.map((emp) => ({
      NIP: emp.nip,
      'Nama Lengkap': emp.nama,
      Jabatan: emp.jabatan || '',
      'Unit Kerja': emp.unitKerja || '',
      Email: emp.email || '',
      'No Telepon': emp.phone || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 30 }, { wch: 35 }, { wch: 30 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Pegawai');
    XLSX.writeFile(wb, `Data_Pegawai_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Open add/edit modal
  const handleOpenAddModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormNip(emp.nip);
      setFormNama(emp.nama);
      setFormJabatan(emp.jabatan || '');
      setFormUnit(emp.unitKerja || '');
      setFormEmail(emp.email || '');
      setFormPhone(emp.phone || '');
    } else {
      setEditingEmployee(null);
      setFormNip('');
      setFormNama('');
      setFormJabatan('');
      setFormUnit('');
      setFormEmail('');
      setFormPhone('');
    }
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Save single employee form
  const handleSaveSingleEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNip = formNip.replace(/[^0-9]/g, '').trim();

    if (!cleanNip) {
      setFormError('NIP wajib diisi.');
      return;
    }
    if (!formNama.trim()) {
      setFormError('Nama pegawai wajib diisi.');
      return;
    }

    const newEmp: Employee = {
      id: cleanNip,
      nip: cleanNip,
      nama: formNama.trim(),
      jabatan: formJabatan.trim() || undefined,
      unitKerja: formUnit.trim() || undefined,
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
    };

    try {
      await saveEmployee(newEmp);
      setIsAddModalOpen(false);
      if (onNotify) {
        onNotify(
          'Data Pegawai Disimpan',
          `${newEmp.nama} (${newEmp.nip}) berhasil diperbarui.`,
          'success'
        );
      }
    } catch (err: any) {
      setFormError('Gagal menyimpan: ' + err.message);
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (emp: Employee) => {
    if (window.confirm(`Yakin ingin menghapus pegawai ${emp.nama} (NIP: ${emp.nip})?`)) {
      await deleteEmployee(emp.id);
      if (onNotify) {
        onNotify('Pegawai Dihapus', `${emp.nama} telah dihapus dari database master.`, 'info');
      }
    }
  };

  // Reset to default sample employees
  const handleResetToDefault = async () => {
    if (
      window.confirm(
        'Kembalikan data pegawai ke data contoh bawaan? Data pegawai saat ini akan diganti dengan data contoh.'
      )
    ) {
      await saveBatchEmployees(DEFAULT_EMPLOYEES);
      if (onNotify) {
        onNotify('Reset Berhasil', 'Database pegawai dikembalikan ke data contoh bawaan.', 'success');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Internal Notification Banner */}
      {internalNotice && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 border shadow-xs transition-all ${
            internalNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
              : internalNotice.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100'
              : 'bg-[#829273]/10 border-[#829273]/40 text-[#3D4035] dark:text-[#E8E6DF]'
          }`}
        >
          <div className="flex items-start gap-3">
            {internalNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : internalNotice.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#829273] shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">{internalNotice.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{internalNotice.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInternalNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Database Master Pegawai (NIP & Auto-fill)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#829273]/20 text-[#637254] dark:text-[#CBD5C0] border border-[#829273]/30">
                  {employees.length} Pegawai Terdaftar
                </span>
              </div>
              <p className="text-xs text-[#737766] dark:text-[#A3A796] mt-0.5 max-w-2xl">
                Impor data pegawai dari berkas Excel atau CSV. Ketika pegawai mengetik 18 digit NIP pada formulir, kolom <strong>Nama Pegawai</strong>, <strong>Jabatan</strong>, dan <strong>Unit Kerja</strong> akan otomatis terisi secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncAllDefaultEmployees}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Masukkan seluruh 412 data pegawai ke database Firestore"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Menyimpan ke DB...' : 'Masukan 412 Pegawai ke Database'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplateExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#EAE6D7] border border-[#E5E2D1] dark:border-[#3B3E32] transition-colors cursor-pointer"
              title="Unduh format template Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#829273]" />
              <span>Unduh Template</span>
            </button>
            <button
              type="button"
              onClick={handleExportCurrent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#EAE6D7] border border-[#E5E2D1] dark:border-[#3B3E32] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#637254] dark:text-[#B5C4A6]" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>

        {/* Upload Zone & Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Upload Excel / CSV */}
          <div className="md:col-span-2 p-5 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-dashed border-[#829273]/40 hover:border-[#829273] transition-colors flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#829273]/15 text-[#829273]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Impor Berkas Excel (.xlsx, .xls) atau CSV / Teks
                </h4>
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-0.5">
                  Mendukung kolom atau pemisah titik koma/koma: <code>NIP</code>, <code>Nama Lengkap</code>, <code>Jabatan</code>, <code>Unit Kerja</code>, <code>Email</code>, <code>No Telepon</code>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E2D1]/60 dark:border-[#3B3E32]/60">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#829273] hover:bg-[#728263] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Membaca Berkas...' : 'Pilih Berkas Excel / CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(true)}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1E201B] hover:bg-[#F4F2E9] dark:hover:bg-[#33372C] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-[#829273]" />
                  <span>Tempel Teks (CSV / Tabel)</span>
                </button>
              </div>

              <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                Maksimal 5.000 data per unggahan
              </span>
            </div>
          </div>

          {/* Box 2: Manual Add & Reset */}
          <div className="p-5 rounded-xl bg-[#FDFCF8] dark:bg-[#2A2D25] border border-[#E5E2D1] dark:border-[#3B3E32] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#829273]" />
                <span>Tambah / Kelola Manual</span>
              </h4>
              <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-1">
                Input data pegawai satu per satu secara langsung tanpa berkas Excel.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1E201B] hover:bg-[#F4F2E9] dark:hover:bg-[#33372C] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#829273]" />
                <span>Tambah Pegawai Baru</span>
              </button>
              <button
                type="button"
                onClick={handleSyncAllDefaultEmployees}
                className="text-[11px] text-[#737766] hover:text-[#637254] dark:text-[#A3A796] dark:hover:text-[#CBD5C0] text-center underline cursor-pointer"
              >
                Sinkronkan Ulang 412 Pegawai
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Import Modal / Card */}
      {previewData && (
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border-2 border-emerald-600 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Pratinjau Impor ({previewData.length} Data Pegawai Ditemukan)
                </h4>
                <p className="text-xs text-[#737766] dark:text-[#A3A796]">
                  Sumber: {selectedFileName} • Silakan tinjau data di bawah lalu klik tombol hijau untuk menyimpan ke database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isUploading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Firestore...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Simpan ke Database ({previewData.length} Pegawai)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-60 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">No</th>
                  <th className="py-2.5 px-3 font-semibold">NIP (18 Digit)</th>
                  <th className="py-2.5 px-3 font-semibold">Nama Pegawai</th>
                  <th className="py-2.5 px-3 font-semibold">Jabatan</th>
                  <th className="py-2.5 px-3 font-semibold">Unit Kerja</th>
                  <th className="py-2.5 px-3 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D1] dark:divide-[#3B3E32]">
                {previewData.slice(0, 50).map((emp, idx) => (
                  <tr key={idx} className="hover:bg-[#FDFCF8] dark:hover:bg-[#2A2D25]">
                    <td className="py-2 px-3 text-[#737766] dark:text-[#A3A796]">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-medium text-[#829273]">{emp.nip}</td>
                    <td className="py-2 px-3 font-medium text-[#3D4035] dark:text-[#E8E6DF]">{emp.nama}</td>
                    <td className="py-2 px-3 text-[#525746] dark:text-[#CBD5C0]">{emp.jabatan || '-'}</td>
                    <td className="py-2 px-3 text-[#525746] dark:text-[#CBD5C0]">{emp.unitKerja || '-'}</td>
                    <td className="py-2 px-3 text-[#737766] dark:text-[#A3A796]">{emp.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 50 && (
            <p className="text-[11px] text-[#737766] dark:text-[#A3A796] italic text-center">
              Menampilkan 50 data pertama dari total {previewData.length} baris.
            </p>
          )}
        </div>
      )}

      {/* Search & List Table */}
      <div className="bg-white dark:bg-[#22251F] rounded-2xl border border-[#E5E2D1] dark:border-[#3B3E32] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#737766] dark:text-[#A3A796] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan NIP, Nama, atau Jabatan..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#1E201B] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
            />
          </div>

          <div className="text-xs text-[#737766] dark:text-[#A3A796]">
            Menampilkan <strong>{filteredEmployees.length}</strong> dari {employees.length} pegawai
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]">
              <tr>
                <th className="py-3 px-4 font-bold">NIP</th>
                <th className="py-3 px-4 font-bold">Nama Lengkap</th>
                <th className="py-3 px-4 font-bold">Jabatan</th>
                <th className="py-3 px-4 font-bold">Unit Kerja</th>
                <th className="py-3 px-4 font-bold">Kontak</th>
                <th className="py-3 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2D1] dark:divide-[#3B3E32]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737766] dark:text-[#A3A796]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#829273]" />
                    <span>Memuat data pegawai...</span>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#737766] dark:text-[#A3A796]">
                    <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <span>Tidak ada data pegawai yang sesuai dengan pencarian.</span>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#FDFCF8] dark:hover:bg-[#2A2D25] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#829273]">
                      {emp.nip}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#3D4035] dark:text-[#E8E6DF]">
                      {emp.nama}
                    </td>
                    <td className="py-3 px-4 text-[#525746] dark:text-[#CBD5C0]">
                      {emp.jabatan ? (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-[#829273]" />
                          <span>{emp.jabatan}</span>
                        </span>
                      ) : (
                        <span className="text-[#A3A796] italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#525746] dark:text-[#CBD5C0]">
                      {emp.unitKerja ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#C97C5D]" />
                          <span>{emp.unitKerja}</span>
                        </span>
                      ) : (
                        <span className="text-[#A3A796] italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#737766] dark:text-[#A3A796]">
                      <div className="space-y-0.5">
                        {emp.email && <div className="text-[11px]">{emp.email}</div>}
                        {emp.phone && <div className="text-[11px] font-mono">{emp.phone}</div>}
                        {!emp.email && !emp.phone && <span className="text-[#A3A796] italic">-</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(emp)}
                          className="p-1.5 rounded-lg text-[#737766] hover:text-[#3D4035] dark:hover:text-white hover:bg-[#F4F2E9] dark:hover:bg-[#33372C] cursor-pointer"
                          title="Edit Pegawai"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp)}
                          className="p-1.5 rounded-lg text-[#737766] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Single Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E201B] rounded-2xl shadow-xl border border-[#E5E2D1] dark:border-[#3B3E32] w-full max-w-md overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E5E2D1] dark:border-[#3B3E32] flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF] flex items-center gap-2">
                <IdCard className="w-4 h-4 text-[#829273]" />
                <span>{editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#737766] hover:text-[#3D4035] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleEmployee} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  NIP (Nomor Induk Pegawai) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Contoh: 198501012010121001"
                  required
                  className="w-full font-mono px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Nama Lengkap Beserta Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Rian Chaidir Hidayat, M.Kom."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  placeholder="Contoh: Pranata Komputer Ahli Muda"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                  Unit Kerja / Bagian / Jurusan
                </label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="Contoh: Sub Bagian Administrasi Sistem Informasi"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@instansi.go.id"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#3D4035] dark:text-[#E8E6DF] mb-1">
                    No. Telepon / WA
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF]"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {formError}
                </p>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E2D1] dark:border-[#3B3E32]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#829273] hover:bg-[#728263]"
                >
                  Simpan Data Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#22251F] rounded-2xl max-w-2xl w-full p-6 border border-[#E5E2D1] dark:border-[#3B3E32] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-[#829273]" />
                <h3 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Tempel Data Pegawai (Format CSV / Tabel / Titik Koma)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] text-[#737766] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#737766] dark:text-[#A3A796]">
              Tempel baris teks langsung dari Excel, Google Sheets, atau berkas CSV. Sistem akan otomatis mendeteksi kolom NIP, Nama, Jabatan, Unit Kerja, Email, dan Telepon.
            </p>

            <textarea
              rows={8}
              value={pastedRawText}
              onChange={(e) => setPastedRawText(e.target.value)}
              placeholder="Contoh:&#10;197009211996032001;Dr. Pramita Iriana, S,Kp., M.Biomed;Lektor Kepala;Jurusan Keperawatan;-;-&#10;196412031989032001;Dr. Supriyatin, S.Kp., M.Kep;Lektor Kepala;Jurusan Keperawatan;-;-"
              className="w-full p-3 rounded-xl font-mono text-xs border border-[#E5E2D1] dark:border-[#3B3E32] bg-[#FDFCF8] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#829273]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#737766] dark:text-[#A3A796]">
                Mendukung pemisah titik koma (;), koma (,), atau tabulasi.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pastedRawText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#829273] hover:bg-[#728263] disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  Proses & Pratinjau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
