import React, { useState, useEffect } from 'react';
import { FormConfig, FormResponse, WebhookLog, NavigationTab } from './types';
import { defaultFormConfig, initialResponses } from './data/defaultForm';
import { Header } from './components/Header';
import { FormEditor } from './components/FormEditor';
import { FormRespondentView } from './components/FormRespondentView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { IntegrationSettings } from './components/IntegrationSettings';
import {
  signInWithGoogle,
  signOutUser,
  initAuthListener,
  getAccessToken,
} from './services/firebaseAuth';
import { appendRowToGoogleSheet, sendEmailViaGmail } from './services/googleWorkspace';
import { triggerWebhook } from './services/webhookService';
import {
  testFirestoreConnection,
  initializeFirestoreDatabase,
  subscribeToFormConfig,
  saveFormConfigToFirestore,
  subscribeToResponses,
  saveResponseToFirestore,
  deleteResponseFromFirestore,
} from './services/firestoreService';
import { ShareModal } from './components/ShareModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Bell, CheckCircle2, AlertCircle, Sparkles, X, Database } from 'lucide-react';

// Helper to detect locked respondent mode from query params and session auth
// Default is ALWAYS locked respondent mode for maximum data security!
const checkIsRespondentMode = (): boolean => {
  if (typeof window === 'undefined') return true;
  const searchParams = new URLSearchParams(window.location.search);
  const view = searchParams.get('view');
  const mode = searchParams.get('mode');

  // If explicitly forced respondent view
  if (view === 'form' || view === 'respondent' || mode === 'respondent' || mode === 'form') {
    return true;
  }

  // If user is already authenticated as admin in this browser session
  const isAdminAuthenticated = sessionStorage.getItem('app_admin_auth') === 'true';
  if (isAdminAuthenticated) {
    return false;
  }

  // DEFAULT FOR ANYONE OPENING THE APP: ALWAYS LOCKED RESPONDENT MODE!
  return true;
};

export default function App() {
  // Mode Responden: Terkunci secara default agar pegawai tidak dapat melihat menu admin
  const [isRespondentMode, setIsRespondentMode] = useState<boolean>(() => checkIsRespondentMode());
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Application State
  const [activeTab, setActiveTab] = useState<NavigationTab>(() =>
    checkIsRespondentMode() ? 'respondent' : 'editor'
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Form Configuration with localStorage fallback & cloud sync
  const [formConfig, setFormConfig] = useState<FormConfig>(() => {
    const saved = localStorage.getItem('app_form_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved form config:', e);
      }
    }
    return defaultFormConfig;
  });

  // Responses with localStorage fallback & cloud sync
  const [responses, setResponses] = useState<FormResponse[]>(() => {
    const saved = localStorage.getItem('app_form_responses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved responses:', e);
      }
    }
    return initialResponses;
  });

  // Webhook audit logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Form saving states
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Live Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Synchronize dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Persist form config on change
  useEffect(() => {
    localStorage.setItem('app_form_config', JSON.stringify(formConfig));
  }, [formConfig]);

  // Persist responses on change
  useEffect(() => {
    localStorage.setItem('app_form_responses', JSON.stringify(responses));
  }, [responses]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = initAuthListener(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const token = await getAccessToken();
        setAccessToken(token);
      } else {
        setAccessToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync respondent mode with browser navigation & URL changes
  useEffect(() => {
    const handlePopState = () => {
      const isResp = checkIsRespondentMode();
      setIsRespondentMode(isResp);
      if (isResp) setActiveTab('respondent');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Force respondent tab when respondent mode is active
  useEffect(() => {
    if (isRespondentMode) {
      setActiveTab('respondent');
    }
  }, [isRespondentMode]);

  // Check on initial load if admin view was explicitly opened (?view=admin or ?admin=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get('view');
      const mode = searchParams.get('mode');
      const admin = searchParams.get('admin');
      if (view === 'admin' || mode === 'admin' || admin === 'true') {
        const isAdminAuthenticated = sessionStorage.getItem('app_admin_auth') === 'true';
        if (!isAdminAuthenticated) {
          setIsAdminAuthModalOpen(true);
        } else {
          setIsRespondentMode(false);
          setActiveTab('editor');
        }
      }
    }
  }, []);

  const handleSwitchToAdmin = () => {
    setIsAdminAuthModalOpen(true);
  };

  const handleAdminUnlockSuccess = () => {
    sessionStorage.setItem('app_admin_auth', 'true');
    setIsRespondentMode(false);
    setActiveTab('editor');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'admin');
      window.history.pushState({}, '', url.toString());
    }
    setToastMessage({
      title: 'Akses Admin Terbuka',
      description: 'Menu Builder, Analitik, Tema, dan Integrasi telah aktif.',
      type: 'success',
    });
  };

  const handleLockToRespondent = () => {
    sessionStorage.removeItem('app_admin_auth');
    setIsRespondentMode(true);
    setActiveTab('respondent');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('mode');
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.pathname);
    }
    setToastMessage({
      title: 'Mode Pegawai Aktif (Terkunci)',
      description: 'Menu Builder, Analytics, Integrasi, dan Themes disembunyikan total.',
      type: 'info',
    });
  };

  // Firebase Firestore Real-Time Database Connection & Synchronization
  useEffect(() => {
    let isMounted = true;

    // Test connection & seed initial database if needed
    testFirestoreConnection().then((connected) => {
      if (isMounted) setIsFirestoreConnected(connected);
      if (connected) {
        initializeFirestoreDatabase(formConfig, responses).catch((err) =>
          console.warn('Initial Firestore setup notice:', err)
        );
      }
    });

    // Real-time listener for form schema updates across all devices
    const unsubscribeForm = subscribeToFormConfig(
      formConfig.id,
      (remoteConfig) => {
        if (remoteConfig && remoteConfig.id === formConfig.id) {
          setFormConfig(remoteConfig);
          if (isMounted) setIsFirestoreConnected(true);
        }
      },
      (err) => console.warn('Firestore form listener notice:', err)
    );

    // Real-time listener for responses submitted by any employee
    const unsubscribeResponses = subscribeToResponses(
      formConfig.id,
      (remoteResponses) => {
        if (remoteResponses) {
          setResponses(remoteResponses);
          if (isMounted) setIsFirestoreConnected(true);
        }
      },
      (err) => console.warn('Firestore responses listener notice:', err)
    );

    return () => {
      isMounted = false;
      unsubscribeForm();
      unsubscribeResponses();
    };
  }, [formConfig.id]);

  const handleUpdateFormConfig = (newConfig: FormConfig) => {
    setFormConfig(newConfig);
    setHasUnsavedChanges(true);
    localStorage.setItem('app_form_config', JSON.stringify(newConfig));
    saveFormConfigToFirestore(newConfig).catch((err) =>
      console.warn('Firestore config save notice:', err)
    );
  };

  const handleManualSave = async () => {
    setIsSavingForm(true);
    try {
      localStorage.setItem('app_form_config', JSON.stringify(formConfig));
      await saveFormConfigToFirestore(formConfig);
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeStr);
      setHasUnsavedChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3500);
      setToastMessage({
        title: 'Perubahan Berhasil Disimpan!',
        description: `Formulir telah disimpan & disinkronkan ke live responden (${timeStr}). Tampilan pegawai kini telah diperbarui.`,
        type: 'success',
      });
    } catch (err: any) {
      console.warn('Manual save warning:', err);
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSavedTime(timeStr);
      setHasUnsavedChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3500);
      setToastMessage({
        title: 'Perubahan Disimpan di Browser',
        description: 'Perubahan formulir berhasil disimpan dan akan otomatis disinkronkan ke cloud saat koneksi stabil.',
        type: 'info',
      });
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
      setAccessToken(res.accessToken);
      setToastMessage({
        title: 'Berhasil Masuk',
        description: `Akun Google ${res.user.email} siap digunakan untuk integrasi Sheets & Gmail.`,
        type: 'success',
      });
    } catch (err: any) {
      alert(`Gagal masuk dengan Google: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setAccessToken(null);
    setToastMessage({
      title: 'Telah Keluar',
      description: 'Sesi akun Google Anda telah diakhiri.',
      type: 'info',
    });
  };

  // Submit Handler for Respondent View
  const handleSubmitForm = async (answers: Record<string, any>): Promise<FormResponse> => {
    const newId = 'resp_' + Date.now();
    const nowIso = new Date().toISOString();

    // Extract respondent identity if question exists
    let respondentName = 'Responden Anonim';
    let respondentEmail = '';

    Object.entries(answers).forEach(([qId, val]) => {
      const q = formConfig.questions.find((item) => item.id === qId);
      if (!q) return;
      const lower = q.title.toLowerCase();
      if (lower.includes('nama') && typeof val === 'string' && val.trim()) {
        respondentName = val.trim();
      }
      if (
        (lower.includes('email') || q.validation.type === 'email') &&
        typeof val === 'string' &&
        val.trim()
      ) {
        respondentEmail = val.trim();
      }
    });

    const newResponse: FormResponse = {
      id: newId,
      formId: formConfig.id,
      submittedAt: nowIso,
      respondentName,
      respondentEmail,
      answers,
      googleSheetStatus: 'pending',
      emailNotificationStatus: 'pending',
      webhookStatus: 'not_configured',
    };

    // 1. Google Sheets Auto-Sync
    let updatedResponse = { ...newResponse };
    const sheetId = formConfig.integrations.googleSheets.spreadsheetId;
    if (sheetId && accessToken) {
      try {
        const rowData = [
          new Date(nowIso).toLocaleString('id-ID'),
          newId,
          respondentName,
          respondentEmail,
          ...formConfig.questions.map((q) => {
            const a = answers[q.id];
            if (a === undefined || a === null) return '';
            if (Array.isArray(a)) return a.join(', ');
            if (typeof a === 'object') return `Berkas: ${(a as any).name || 'Upload'}`;
            return String(a);
          }),
        ];

        await appendRowToGoogleSheet(sheetId, rowData, accessToken);
        updatedResponse.googleSheetStatus = 'synced';
      } catch (sheetErr) {
        console.warn('Google Sheets auto-sync notice:', sheetErr);
      }
    }

    // 2. Real-Time Gmail Notification to Admin
    const emailConfig = formConfig.integrations.emailNotifications;
    if (emailConfig.enabled && emailConfig.adminEmail && accessToken) {
      try {
        const answersHtml = formConfig.questions
          .map((q) => {
            const a = answers[q.id];
            const displayVal =
              a === undefined
                ? '<span style="color:#94a3b8">Tidak diisi</span>'
                : Array.isArray(a)
                ? a.join(', ')
                : typeof a === 'object'
                ? `Berkas: ${(a as any).name}`
                : String(a);
            return `
              <div style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f766e; display: block; font-size: 13px;">${q.title}</strong>
                <div style="margin-top: 4px; color: #1e293b; font-size: 14px;">${displayVal}</div>
              </div>
            `;
          })
          .join('');

        const adminMailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
            <div style="border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #0f766e; margin: 0;">Respon Baru Diterima! 📝</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Formulir: <strong>${formConfig.title}</strong></p>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5;">
              Halo Pengelola,<br/>
              Telah masuk tanggapan baru dari <strong>${respondentName}</strong> (${respondentEmail || 'Tanpa email'}) pada ${new Date(nowIso).toLocaleString('id-ID')}.
            </p>

            <h3 style="font-size: 15px; color: #0f766e; margin: 20px 0 10px;">Ringkasan Data yang Diserahkan:</h3>
            ${answersHtml}

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              Notifikasi real-time terotomatisasi • Sistem Formulir Cerdas Poltekkes Bandung
            </div>
          </div>
        `;

        await sendEmailViaGmail({
          to: emailConfig.adminEmail,
          subject: `[Respon Baru] ${formConfig.title} - ${respondentName}`,
          htmlContent: adminMailBody,
          accessToken,
        });

        updatedResponse.emailNotificationStatus = 'sent';

        // Also notify respondent if enabled and provided email
        if (emailConfig.notifyRespondent && respondentEmail) {
          await sendEmailViaGmail({
            to: respondentEmail,
            subject: `Tanda Terima Pengisian: ${formConfig.title}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px;">
                <h3 style="color: #0f766e;">Terima Kasih, ${respondentName}!</h3>
                <p>Tanggapan Anda pada formulir <strong>${formConfig.title}</strong> telah berhasil kami terima dan dicatat di sistem.</p>
                <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px;">
                  ID Respon: ${newId}<br/>
                  Waktu: ${new Date(nowIso).toLocaleString('id-ID')}
                </div>
              </div>
            `,
            accessToken,
          });
        }
      } catch (mailErr) {
        console.warn('Gmail notification dispatch notice:', mailErr);
      }
    }

    // 3. Webhook Dispatch to 3rd Party API
    const webhookConf = formConfig.integrations.webhook;
    if (webhookConf.enabled && webhookConf.url) {
      triggerWebhook(webhookConf.url, webhookConf.apiKey, {
        event: 'form_response_submitted',
        formId: formConfig.id,
        responseId: newId,
        submittedAt: nowIso,
        respondentName,
        respondentEmail,
        answers,
      }).then((log) => {
        setWebhookLogs((prev) => [log, ...prev]);
      });
    }

    // Save into state
    setResponses((prev) => [updatedResponse, ...prev]);

    // Save to Firestore Real-Time Cloud Database for all employees
    saveResponseToFirestore(updatedResponse)
      .then(() => {
        setIsFirestoreConnected(true);
      })
      .catch((fsErr) => {
        console.warn('Firestore response cloud save notice:', fsErr);
      });

    // Show celebratory toast notification
    setToastMessage({
      title: 'Tanggapan Baru Masuk!',
      description: `Respon dari ${respondentName} telah tersimpan di Firebase Firestore.`,
      type: 'success',
    });

    return updatedResponse;
  };

  // Sync all responses to Google Sheets manually
  const handleBatchSyncSheets = async () => {
    const sheetId = formConfig.integrations.googleSheets.spreadsheetId;
    if (!sheetId) {
      alert('Pilih atau buat Google Spreadsheet terlebih dahulu di tab "Integrasi & API".');
      setActiveTab('integrations');
      return;
    }
    if (!accessToken) {
      handleSignIn();
      return;
    }

    setIsSyncingSheets(true);
    let successCount = 0;

    try {
      for (const resp of responses) {
        if (resp.googleSheetStatus !== 'synced') {
          const rowData = [
            new Date(resp.submittedAt).toLocaleString('id-ID'),
            resp.id,
            resp.respondentName || '',
            resp.respondentEmail || '',
            ...formConfig.questions.map((q) => {
              const a = resp.answers[q.id];
              if (a === undefined || a === null) return '';
              if (Array.isArray(a)) return a.join(', ');
              if (typeof a === 'object') return `Berkas: ${(a as any).name || 'Upload'}`;
              return String(a);
            }),
          ];
          await appendRowToGoogleSheet(sheetId, rowData, accessToken);
          successCount++;
        }
      }

      // Mark all as synced
      setResponses((prev) =>
        prev.map((r) => ({ ...r, googleSheetStatus: 'synced' }))
      );

      setToastMessage({
        title: 'Sinkronisasi Selesai',
        description: `${successCount} data respon berhasil ditambahkan ke Google Spreadsheet.`,
        type: 'success',
      });
    } catch (err: any) {
      alert(`Kendala saat sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleDeleteResponse = (responseId: string) => {
    setResponses((prev) => prev.filter((r) => r.id !== responseId));
    deleteResponseFromFirestore(responseId).catch((fsErr) =>
      console.warn('Firestore delete response notice:', fsErr)
    );
    setToastMessage({
      title: 'Respon Dihapus',
      description: 'Data respon telah dihapus dari sistem dan database cloud.',
      type: 'info',
    });
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor:
          activeTab === 'respondent'
            ? isDarkMode
              ? '#090d16'
              : formConfig.theme.backgroundColor || '#f8fafc'
            : isDarkMode
            ? '#090d16'
            : '#f8fafc',
      }}
    >
      {/* Universal Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        responseCount={responses.length}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isFirestoreConnected={isFirestoreConnected}
        onShareForm={() => setIsShareModalOpen(true)}
        isRespondentMode={isRespondentMode}
        onSwitchToAdmin={handleSwitchToAdmin}
        onLockToRespondent={handleLockToRespondent}
        onSaveForm={handleManualSave}
        isSaving={isSavingForm}
        justSaved={justSaved}
        lastSavedTime={lastSavedTime}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main View Area */}
      <main className="pb-16">
        {activeTab === 'respondent' && (
          <FormRespondentView
            config={formConfig}
            onSubmit={handleSubmitForm}
            onBackToEditor={isRespondentMode ? undefined : () => setActiveTab('editor')}
            onSwitchToAdmin={handleSwitchToAdmin}
          />
        )}

        {activeTab === 'editor' && (
          <FormEditor
            config={formConfig}
            onChangeConfig={handleUpdateFormConfig}
            onPreviewForm={() => setActiveTab('respondent')}
            onSaveForm={handleManualSave}
            isSaving={isSavingForm}
            justSaved={justSaved}
            lastSavedTime={lastSavedTime}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            config={formConfig}
            responses={responses}
            onSyncToSheets={handleBatchSyncSheets}
            isSyncing={isSyncingSheets}
            onDeleteResponse={handleDeleteResponse}
          />
        )}

        {activeTab === 'theme' && (
          <ThemeCustomizer
            config={formConfig}
            onChangeConfig={handleUpdateFormConfig}
            onSaveForm={handleManualSave}
            isSaving={isSavingForm}
            justSaved={justSaved}
            lastSavedTime={lastSavedTime}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        {activeTab === 'integrations' && (
          <IntegrationSettings
            config={formConfig}
            onChangeConfig={handleUpdateFormConfig}
            accessToken={accessToken}
            onConnectGoogle={handleSignIn}
            webhookLogs={webhookLogs}
            onAddWebhookLog={(log) => setWebhookLogs((prev) => [log, ...prev])}
            onTriggerSyncSheets={handleBatchSyncSheets}
            isSyncingSheets={isSyncingSheets}
            onNotify={(title, description, type) =>
              setToastMessage({ title, description, type })
            }
          />
        )}
      </main>

      {/* Share Modal for Employees & Vercel Guide */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        formTitle={formConfig.title}
        isFirestoreConnected={isFirestoreConnected}
        onPreviewRespondentMode={handleLockToRespondent}
      />

      {/* Admin Unlock Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminUnlockSuccess}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-[#22251F] rounded-2xl shadow-2xl border border-[#E5E2D1] dark:border-[#3B3E32] p-4 animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3">
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              toastMessage.type === 'success'
                ? 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
                : toastMessage.type === 'error'
                ? 'bg-[#C97C5D]/15 text-[#C97C5D]'
                : 'bg-[#829273]/15 text-[#637254] dark:text-[#B5C4A6]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#3D4035] dark:text-[#E8E6DF]">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] text-[#737766] dark:text-[#A3A796] mt-0.5 leading-relaxed">
              {toastMessage.description}
            </p>
          </div>

          <button
            onClick={() => setToastMessage(null)}
            className="text-[#737766] hover:text-[#3D4035] dark:hover:text-[#E8E6DF] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
