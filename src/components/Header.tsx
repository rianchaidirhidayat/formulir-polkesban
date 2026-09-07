import React from 'react';
import {
  FileText,
  Eye,
  BarChart3,
  Sliders,
  Palette,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  LogIn,
  LogOut,
  ExternalLink,
  Share2,
  Database,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { NavigationTab } from '../types';

export type ActiveTab = NavigationTab | 'editor' | 'respondent' | 'analytics' | 'integrasi' | 'theme';

interface HeaderProps {
  activeTab: any;
  setActiveTab?: (tab: any) => void;
  onSelectTab?: (tab: any) => void;
  darkMode?: boolean;
  isDarkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  onToggleDarkMode?: () => void;
  user: User | null;
  hasAccessToken?: boolean;
  onLogin?: () => void;
  onSignIn?: () => void;
  onLogout?: () => void;
  onSignOut?: () => void;
  unreadCount?: number;
  responseCount?: number;
  onOpenNotifications?: () => void;
  formTitle?: string;
  isFirestoreConnected?: boolean;
  onShareForm?: () => void;
  isRespondentMode?: boolean;
  onSwitchToAdmin?: () => void;
  onLockToRespondent?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  darkMode,
  isDarkMode,
  setDarkMode,
  onToggleDarkMode,
  user,
  hasAccessToken = true,
  onLogin,
  onSignIn,
  onLogout,
  onSignOut,
  unreadCount = 0,
  responseCount = 0,
  onOpenNotifications,
  formTitle = 'Survei Kepuasan Layanan & Registrasi Terpadu',
  isFirestoreConnected = true,
  onShareForm,
  isRespondentMode = false,
  onSwitchToAdmin,
  onLockToRespondent,
}) => {
  const currentDarkMode = isDarkMode !== undefined ? isDarkMode : Boolean(darkMode);
  const handleToggleDark = () => {
    if (onToggleDarkMode) onToggleDarkMode();
    else if (setDarkMode) setDarkMode(!currentDarkMode);
  };

  const handleTabChange = (tab: any) => {
    if (onSelectTab) onSelectTab(tab);
    else if (setActiveTab) setActiveTab(tab);
  };

  const handleAuthAction = () => {
    if (onSignIn) onSignIn();
    else if (onLogin) onLogin();
  };

  const handleLogoutAction = () => {
    if (onSignOut) onSignOut();
    else if (onLogout) onLogout();
  };

  const displayCount = unreadCount || responseCount || 0;

  return (
    <header className="sticky top-0 z-40 bg-[#FDFCF8]/95 dark:bg-[#1A1C18]/95 backdrop-blur-md border-b border-[#E5E2D1] dark:border-[#3B3E32] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Form Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#829273] flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
              F
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#3D4035] dark:text-[#E8E6DF] truncate text-base sm:text-lg tracking-tight">
                  FormPro AI
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#829273]/10 text-[#637254] dark:bg-[#829273]/25 dark:text-[#B5C4A6]">
                  Natural Tones
                </span>
              </div>
              <p className="text-xs text-[#737766] dark:text-[#A3A796] truncate max-w-[200px] sm:max-w-xs">
                {formTitle}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {!isRespondentMode ? (
            <nav className="hidden md:flex items-center gap-1 bg-[#F4F2E9] dark:bg-[#22251F] p-1 rounded-xl border border-[#E5E2D1] dark:border-[#3B3E32]">
              <button
                onClick={() => handleTabChange('editor')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-[#1A1C18] text-[#829273] dark:text-[#A7B998] shadow-sm'
                    : 'text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Builder
              </button>

              <button
                onClick={() => handleTabChange('respondent')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'respondent'
                    ? 'bg-white dark:bg-[#1A1C18] text-[#829273] dark:text-[#A7B998] shadow-sm'
                    : 'text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Isi Formulir
              </button>

              <button
                onClick={() => handleTabChange('analytics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white dark:bg-[#1A1C18] text-[#829273] dark:text-[#A7B998] shadow-sm'
                    : 'text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics
              </button>

              <button
                onClick={() => handleTabChange(activeTab === 'integrasi' ? 'integrasi' : 'integrations')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'integrasi' || activeTab === 'integrations'
                    ? 'bg-white dark:bg-[#1A1C18] text-[#829273] dark:text-[#A7B998] shadow-sm'
                    : 'text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Integrasi
              </button>

              <button
                onClick={() => handleTabChange('theme')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'theme'
                    ? 'bg-white dark:bg-[#1A1C18] text-[#829273] dark:text-[#A7B998] shadow-sm'
                    : 'text-[#737766] dark:text-[#A3A796] hover:text-[#3D4035] dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Themes
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/25 text-xs font-semibold text-[#637254] dark:text-[#B5C4A6]">
              <Eye className="w-3.5 h-3.5" />
              <span>Portal Pengisian Formulir Pegawai</span>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Firebase Cloud Live Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isFirestoreConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
              title={
                isFirestoreConnected
                  ? 'Terhubung dengan Database Cloud Firestore. Respon & konfigurasi tersinkronisasi otomatis secara real-time.'
                  : 'Menghubungkan ke Firebase Firestore...'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <Database className="w-3 h-3" />
              <span className="hidden xl:inline">
                {isFirestoreConnected ? 'Firestore Real-time' : 'Menghubungkan...'}
              </span>
            </div>

            {/* Share Form Button (Only in Admin Mode) */}
            {!isRespondentMode && onShareForm && (
              <button
                type="button"
                onClick={onShareForm}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#829273] hover:bg-[#728263] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Bagikan formulir ini ke seluruh pegawai"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
            )}

            {/* Lock / Switch to Respondent Mode Button (Only in Admin Mode) */}
            {!isRespondentMode && onLockToRespondent && (
              <button
                type="button"
                onClick={onLockToRespondent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Kunci tampilan ke Mode Responden (seperti tampilan pegawai)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden lg:inline">Mode Responden</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={handleToggleDark}
              className="p-2 rounded-xl text-[#737766] hover:text-[#3D4035] dark:text-[#A3A796] dark:hover:text-[#E8E6DF] hover:bg-[#F4F2E9] dark:hover:bg-[#242820] transition-colors"
              title={currentDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            >
              {currentDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell (Only in Admin Mode) */}
            {!isRespondentMode && onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-[#737766] hover:text-[#3D4035] dark:text-[#A3A796] dark:hover:text-[#E8E6DF] hover:bg-[#F4F2E9] dark:hover:bg-[#242820] transition-colors"
                title="Notifikasi Real-Time"
              >
                <Bell className="w-4 h-4" />
                {displayCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C97C5D] text-[10px] font-bold text-white ring-2 ring-[#FDFCF8] dark:ring-[#1A1C18]">
                    {displayCount > 9 ? '9+' : displayCount}
                  </span>
                )}
              </button>
            )}

            {/* Google Account Auth Button (Only in Admin Mode) */}
            {!isRespondentMode ? (
              user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-[#E5E2D1] dark:border-[#3B3E32]">
                  <div className="flex items-center gap-2 bg-[#829273]/10 dark:bg-[#829273]/20 border border-[#829273]/30 rounded-full py-1 px-2.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google Account'}
                        className="w-6 h-6 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#829273] text-white text-xs flex items-center justify-center font-bold">
                        {user.email?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-semibold text-[#3D4035] dark:text-[#E8E6DF] truncate max-w-[120px]">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-[#637254] dark:text-[#B5C4A6] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Terhubung
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogoutAction}
                    className="p-1.5 text-[#737766] hover:text-[#C97C5D] rounded-lg hover:bg-[#F4F2E9] dark:hover:bg-[#242820]"
                    title="Putuskan sambungan Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAuthAction}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#242820] hover:bg-[#F9F8F4] dark:hover:bg-[#2A2D25] text-[#3D4035] dark:text-[#E8E6DF] border border-[#E5E2D1] dark:border-[#3B3E32] rounded-xl text-xs sm:text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-[#829273]"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Hubungkan Google</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Hidden in Respondent Mode) */}
        {!isRespondentMode && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-[#E5E2D1] dark:border-[#3B3E32] text-xs font-medium">
            <button
              onClick={() => handleTabChange('editor')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'editor' ? 'text-[#829273] dark:text-[#A7B998] font-bold' : 'text-[#737766]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Builder
            </button>
            <button
              onClick={() => handleTabChange('respondent')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'respondent' ? 'text-[#829273] dark:text-[#A7B998] font-bold' : 'text-[#737766]'
              }`}
            >
              <Eye className="w-4 h-4" />
              Isi Form
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'analytics' ? 'text-[#829273] dark:text-[#A7B998] font-bold' : 'text-[#737766]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => handleTabChange(activeTab === 'integrasi' ? 'integrasi' : 'integrations')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'integrasi' || activeTab === 'integrations'
                  ? 'text-[#829273] dark:text-[#A7B998] font-bold'
                  : 'text-[#737766]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Integrasi
            </button>
            <button
              onClick={() => handleTabChange('theme')}
              className={`flex flex-col items-center gap-1 ${
                activeTab === 'theme' ? 'text-[#829273] dark:text-[#A7B998] font-bold' : 'text-[#737766]'
              }`}
            >
              <Palette className="w-4 h-4" />
              Themes
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

