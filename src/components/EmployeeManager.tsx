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

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ onNotify }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Employee[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        throw new Error('Berkas Excel/CSV kosong atau format baris tidak terbaca.');
      }

      // Map columns flexibly (handles Indonesian and English headers)
      const parsedEmployees: Employee[] = [];
      for (const row of jsonData) {
        // Look for NIP column
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

        // Look for Nama column
        const rawNama = String(
          row['Nama'] ||
          row['nama'] ||
          row['Nama Pegawai'] ||
          row['Nama Lengkap'] ||
          row['Nama Lengkap Beserta Gelar'] ||
          row['Name'] ||
          ''
        ).trim();

        // Look for Jabatan column
        const rawJabatan = String(
          row['Jabatan'] ||
          row['jabatan'] ||
          row['Posisi'] ||
          row['Pekerjaan'] ||
          row['Position'] ||
          ''
        ).trim();

        // Look for Unit Kerja column
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

        // Look for Email column
        const rawEmail = String(
          row['Email'] ||
          row['email'] ||
          row['Surel'] ||
          ''
        ).trim();

        // Look for Phone / WhatsApp column
        const rawPhone = String(
          row['No HP'] ||
          row['No Telepon'] ||
          row['Telepon'] ||
          row['WhatsApp'] ||
          row['phone'] ||
          row['Phone'] ||
          ''
        ).trim();

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

      if (parsedEmployees.length === 0) {
        throw new Error(
          'Tidak ditemukan kolom NIP dan Nama yang valid. Pastikan berkas memiliki kolom NIP dan Nama.'
        );
      }

      setPreviewData(parsedEmployees);
      if (onNotify) {
        onNotify(
          'Pratinjau Berkas Siap',
          `Ditemukan ${parsedEmployees.length} data pegawai valid dari ${file.name}. Silakan periksa lalu simpan.`,
          'info'
        );
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify('Gagal Membaca Berkas', err.message || 'Format berkas tidak didukung', 'error');
      } else {
        alert('Gagal membaca berkas: ' + err.message);
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
    try {
      const count = await saveBatchEmployees(previewData);
      setPreviewData(null);
      setSelectedFileName('');
      if (onNotify) {
        onNotify(
          'Impor Pegawai Berhasil!',
          `${count} data pegawai berhasil disimpan ke database master. NIP auto-fill siap digunakan.`,
          'success'
        );
      }
    } catch (err: any) {
      if (onNotify) {
        onNotify('Gagal Menyimpan', err.message, 'error');
      }
    } finally {
      setIsUploading(false);
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
              onClick={handleDownloadTemplateExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#EAE6D7] border border-[#E5E2D1] dark:border-[#3B3E32] transition-colors cursor-pointer"
              title="Unduh format template Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#829273]" />
              <span>Unduh Template Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCurrent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F2E9] dark:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] hover:bg-[#EAE6D7] border border-[#E5E2D1] dark:border-[#3B3E32] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#637254] dark:text-[#B5C4A6]" />
              <span>Ekspor Data</span>
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
                  Impor Berkas Excel (.xlsx, .xls) atau CSV
                </h4>
                <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-0.5">
                  Mendukung kolom: <code>NIP</code>, <code>Nama Lengkap</code>, <code>Jabatan</code>, <code>Unit Kerja</code>, <code>Email</code>, <code>No Telepon</code>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E2D1]/60 dark:border-[#3B3E32]/60">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#829273] hover:bg-[#728263] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Membaca Berkas...' : 'Pilih Berkas Excel / CSV'}</span>
              </button>

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
                onClick={handleResetToDefault}
                className="text-[11px] text-[#737766] hover:text-[#C97C5D] dark:text-[#A3A796] dark:hover:text-[#E89E82] text-center underline cursor-pointer"
              >
                Kembalikan ke Contoh Bawaan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Import Modal / Card */}
      {previewData && (
        <div className="bg-white dark:bg-[#22251F] rounded-2xl p-6 border-2 border-[#829273] shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D1] dark:border-[#3B3E32]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#829273]" />
              <div>
                <h4 className="text-sm font-bold text-[#3D4035] dark:text-[#E8E6DF]">
                  Pratinjau Impor ({previewData.length} Pegawai Ditemukan)
                </h4>
                <p className="text-xs text-[#737766] dark:text-[#A3A796]">
                  Berkas: {selectedFileName} • Silakan periksa data sebelum disimpan ke Firestore
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#737766] hover:bg-[#F4F2E9] dark:hover:bg-[#2A2D25] cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isUploading}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#829273] hover:bg-[#728263] shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Menyimpan...' : 'Simpan ke Database'}</span>
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
    </div>
  );
};
