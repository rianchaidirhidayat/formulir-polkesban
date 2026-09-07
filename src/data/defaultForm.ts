import { FormConfig, FormResponse } from '../types';

export const DEFAULT_FORM_CONFIG: FormConfig = {
  id: 'form-poltekkes-001',
  title: 'Survei Kepuasan Layanan & Registrasi Terpadu',
  description:
    'Formulir evaluasi mutu pelayanan dan pendaftaran layanan terpadu. Data tersinkronisasi otomatis dengan Google Spreadsheet resmi dan terverifikasi secara real-time.',
  theme: {
    id: 'theme-natural-tones',
    name: 'Natural Tones (Sage & Terracotta)',
    primaryColor: '#829273', // Natural Sage Green
    primaryHover: '#718162',
    accentColor: '#C97C5D', // Warm Terracotta Clay
    backgroundColor: '#FDFCF8', // Warm Linen Canvas
    bannerImage:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1400&q=80',
    fontFamily: 'sans',
    cardRadius: 'rounded-2xl',
    cardBorder: true,
    brandName: 'FormPro AI',
    brandTagline: 'Natural Tones',
    showBrandTagline: true,
    logoText: 'F',
    density: 'compact',
    layoutMode: 'auto',
    showQuestionNumbers: false,
  },
  integrations: {
    googleSheets: {
      enabled: true,
      spreadsheetId: '',
      spreadsheetUrl: '',
      sheetName: 'Respon Formulir',
      lastSyncedAt: undefined,
    },
    emailNotifications: {
      enabled: true,
      adminEmail: 'rianchaidirhidayat@staff.poltekkesbandung.ac.id',
      notifyRespondent: true,
      subjectTemplate: '[Notifikasi Respon Baru] Survei Kepuasan Layanan',
    },
    webhook: {
      enabled: false,
      url: 'https://webhook.site/form-incoming-events',
      apiKey: 'sec_live_' + Math.random().toString(36).substring(2, 12),
    },
  },
  questions: [
    {
      id: 'q_nama',
      title: 'Nama Lengkap Beserta Gelar (Jika Ada)',
      description: 'Masukkan nama resmi sesuai identitas KTP atau identitas institusi',
      type: 'short_text',
      validation: {
        required: true,
        type: 'min_length',
        minLength: 3,
        maxLength: 100,
        regexErrorMessage: 'Nama lengkap minimal harus terdiri dari 3 karakter.',
      },
    },
    {
      id: 'q_email',
      title: 'Alamat Email Aktif',
      description: 'Konfirmasi bukti pengisian formulir akan dikirimkan ke email ini',
      type: 'short_text',
      validation: {
        required: true,
        type: 'email',
        customRegex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        regexErrorMessage: 'Format email tidak valid (contoh: nama@domain.ac.id)',
      },
    },
    {
      id: 'q_whatsapp',
      title: 'Nomor WhatsApp / Telepon',
      description: 'Format nomor Indonesia diawali dengan 08 atau +62 (10-14 digit)',
      type: 'short_text',
      validation: {
        required: true,
        type: 'phone_id',
        customRegex: '^(\\+62|62|0)8[1-9][0-9]{7,11}$',
        regexErrorMessage:
          'Format nomor WhatsApp tidak valid. Gunakan format Indonesia (contoh: 08123456789 atau +6281234567890)',
      },
    },
    {
      id: 'q_kategori',
      title: 'Kategori / Status Responden',
      description: 'Pilih status keterikatan Anda saat ini',
      type: 'multiple_choice',
      options: [
        'Mahasiswa Poltekkes',
        'Dosen & Tenaga Kependidikan',
        'Alumni',
        'Mitra Kerja / Rumah Sakit / Puskesmas',
        'Masyarakat Umum',
      ],
      validation: {
        required: true,
      },
    },
    {
      id: 'q_nim',
      title: 'Nomor Induk Mahasiswa (NIM)',
      description: 'Wajib diisi bagi mahasiswa (format angka 9-12 digit)',
      type: 'short_text',
      validation: {
        required: true,
        type: 'nim_nik',
        customRegex: '^[0-9]{8,14}$',
        regexErrorMessage: 'NIM harus berupa deret angka 8 hingga 14 digit',
      },
      conditionalLogic: {
        enabled: true,
        parentQuestionId: 'q_kategori',
        operator: 'equals',
        value: 'Mahasiswa Poltekkes',
      },
    },
    {
      id: 'q_layanan',
      title: 'Layanan yang Pernah Anda Gunakan',
      description: 'Anda dapat memilih lebih dari satu layanan yang pernah diakses',
      type: 'checkboxes',
      options: [
        'Layanan Akademik & Kemahasiswaan',
        'Laboratorium & Praktikum Klinik',
        'Perpustakaan & Repository Digital',
        'Pelayanan Poliklinik & Kesehatan',
        'Administrasi Keuangan & Pembayaran',
        'Sistem Informasi & Portal Akademik',
      ],
      validation: {
        required: true,
        type: 'checkbox_count',
        minCheckbox: 1,
        maxCheckbox: 5,
        regexErrorMessage: 'Pilih minimal 1 layanan dan maksimal 5 layanan.',
      },
    },
    {
      id: 'q_kepuasan_skala',
      title: 'Tingkat Kepuasan Menyeluruh Terhadap Pelayanan',
      description: 'Berikan penilaian obyektif Anda dari skala 1 (Sangat Tidak Puas) hingga 5 (Sangat Puas)',
      type: 'linear_scale',
      linearScale: {
        min: 1,
        max: 5,
        minLabel: '1 - Sangat Tidak Puas',
        maxLabel: '5 - Sangat Puas',
      },
      validation: {
        required: true,
      },
    },
    {
      id: 'q_kecepatan_layanan',
      title: 'Kecepatan dan Ketepatan Respon Petugas',
      description: 'Seberapa responsif petugas dalam menangani kebutuhan Anda?',
      type: 'linear_scale',
      linearScale: {
        min: 1,
        max: 5,
        minLabel: '1 - Sangat Lambat',
        maxLabel: '5 - Sangat Cepat & Tanggap',
      },
      validation: {
        required: true,
      },
    },
    {
      id: 'q_dokumen',
      title: 'Unggah Berkas Bukti / Identitas / Pendukung (Opsional)',
      description: 'Format yang didukung: PDF, PNG, JPEG. Ukuran maksimal 5MB per berkas.',
      type: 'file_upload',
      validation: {
        required: false,
        type: 'file_constraint',
        maxFileSizeMb: 5,
        allowedFileTypes: ['pdf', 'image'],
        regexErrorMessage: 'Berkas harus berformat PDF/Gambar dan tidak melebihi 5MB.',
      },
    },
    {
      id: 'q_saran',
      title: 'Kritik, Saran, dan Masukan Perbaikan',
      description: 'Tuliskan pengalaman atau saran konstruktif demi peningkatan mutu pelayanan ke depan',
      type: 'long_text',
      validation: {
        required: false,
        minLength: 10,
        maxLength: 1000,
        regexErrorMessage: 'Saran minimal 10 karakter agar lebih informatif.',
      },
    },
    {
      id: 'q_tanda_tangan',
      title: 'Tanda Tangan Digital & Persetujuan Responden',
      description:
        'Goreskan tanda tangan elektronik Anda atau ketik nama sebagai bukti keabsahan dan persetujuan pengisian evaluasi ini.',
      type: 'signature',
      validation: {
        required: true,
        regexErrorMessage: 'Tanda tangan digital wajib dibubuhkan sebelum mengirimkan formulir.',
      },
    },
  ],
};

// Lightweight sample signature data URLs for seeded responses
const SAMPLE_SIGNATURE_1 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M 30 65 Q 60 15 100 50 T 180 35 T 260 55" stroke="%231E201B" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M 70 70 Q 150 78 240 68" stroke="%231E201B" stroke-width="2" fill="none"/></svg>';

const SAMPLE_SIGNATURE_2 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M 40 55 C 80 20 110 70 150 40 S 220 20 250 60" stroke="%231E3A8A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M 90 75 L 210 72" stroke="%231E3A8A" stroke-width="2" fill="none"/></svg>';

export const INITIAL_SEED_RESPONSES: FormResponse[] = [
  {
    id: 'resp-101',
    formId: 'form-poltekkes-001',
    submittedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    respondentName: 'Siti Nurhaliza, S.Tr.Keb',
    respondentEmail: 'siti.nurhaliza@gmail.com',
    answers: {
      q_nama: 'Siti Nurhaliza, S.Tr.Keb',
      q_email: 'siti.nurhaliza@gmail.com',
      q_whatsapp: '081234567891',
      q_kategori: 'Alumni',
      q_layanan: ['Layanan Akademik & Kemahasiswaan', 'Perpustakaan & Repository Digital'],
      q_kepuasan_skala: 5,
      q_kecepatan_layanan: 5,
      q_saran: 'Proses legalisir ijazah online sangat cepat dan ramah. Terima kasih banyak atas peningkatannya!',
      q_tanda_tangan: SAMPLE_SIGNATURE_1,
    },
    googleSheetStatus: 'synced',
    emailNotificationStatus: 'sent',
    webhookStatus: 'not_configured',
  },
  {
    id: 'resp-102',
    formId: 'form-poltekkes-001',
    submittedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    respondentName: 'Ahmad Fauzi',
    respondentEmail: 'ahmad.fauzi@student.poltekkes.ac.id',
    answers: {
      q_nama: 'Ahmad Fauzi',
      q_email: 'ahmad.fauzi@student.poltekkes.ac.id',
      q_whatsapp: '085721987654',
      q_kategori: 'Mahasiswa Poltekkes',
      q_nim: 'P17320121045',
      q_layanan: [
        'Laboratorium & Praktikum Klinik',
        'Sistem Informasi & Portal Akademik',
      ],
      q_kepuasan_skala: 4,
      q_kecepatan_layanan: 4,
      q_saran: 'Fasilitas alat laboratorium lengkap, hanya koneksi WiFi di gedung B perlu diperkuat.',
      q_tanda_tangan: SAMPLE_SIGNATURE_2,
    },
    googleSheetStatus: 'synced',
    emailNotificationStatus: 'sent',
    webhookStatus: 'not_configured',
  },
  {
    id: 'resp-103',
    formId: 'form-poltekkes-001',
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    respondentName: 'Dr. Hendra Kusuma, M.Kes',
    respondentEmail: 'hendra.kusuma@dosen.poltekkes.ac.id',
    answers: {
      q_nama: 'Dr. Hendra Kusuma, M.Kes',
      q_email: 'hendra.kusuma@dosen.poltekkes.ac.id',
      q_whatsapp: '081398765432',
      q_kategori: 'Dosen & Tenaga Kependidikan',
      q_layanan: [
        'Layanan Akademik & Kemahasiswaan',
        'Administrasi Keuangan & Pembayaran',
        'Perpustakaan & Repository Digital',
      ],
      q_kepuasan_skala: 5,
      q_kecepatan_layanan: 4,
      q_saran: 'Koordinasi penelitian dan pengabdian masyarakat semakin terstruktur.',
      q_tanda_tangan: SAMPLE_SIGNATURE_1,
    },
    googleSheetStatus: 'synced',
    emailNotificationStatus: 'sent',
    webhookStatus: 'not_configured',
  },
  {
    id: 'resp-104',
    formId: 'form-poltekkes-001',
    submittedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    respondentName: 'Rina Marlina',
    respondentEmail: 'rina.marlina99@yahoo.com',
    answers: {
      q_nama: 'Rina Marlina',
      q_email: 'rina.marlina99@yahoo.com',
      q_whatsapp: '087812349876',
      q_kategori: 'Masyarakat Umum',
      q_layanan: ['Pelayanan Poliklinik & Kesehatan'],
      q_kepuasan_skala: 5,
      q_kecepatan_layanan: 5,
      q_saran: 'Pelayanan poli gigi sangat ramah, higienis, dan antrean teratur.',
      q_tanda_tangan: SAMPLE_SIGNATURE_2,
    },
    googleSheetStatus: 'synced',
    emailNotificationStatus: 'sent',
    webhookStatus: 'not_configured',
  },
];

export const defaultFormConfig = DEFAULT_FORM_CONFIG;
export const initialResponses = INITIAL_SEED_RESPONSES;

