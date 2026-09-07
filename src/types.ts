export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkboxes'
  | 'linear_scale'
  | 'file_upload'
  | 'dropdown'
  | 'date'
  | 'signature'
  | 'nip';

export type ValidationType =
  | 'none'
  | 'email'
  | 'phone_id'
  | 'nim_nik'
  | 'nip'
  | 'number_range'
  | 'regex'
  | 'min_length'
  | 'max_length'
  | 'checkbox_count'
  | 'file_constraint';

export interface ValidationRule {
  required: boolean;
  type?: ValidationType;
  customRegex?: string;
  regexErrorMessage?: string;
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  minValue?: number;
  maxValue?: number;
  minCheckbox?: number;
  maxCheckbox?: number;
  maxFileSizeMb?: number; // e.g. 5 for 5MB
  allowedFileTypes?: ('pdf' | 'image' | 'doc' | 'sheet')[];
}

export interface ConditionalLogic {
  enabled: boolean;
  parentQuestionId?: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface LinearScaleConfig {
  min: number; // usually 1
  max: number; // usually 5 or 10
  minLabel: string; // e.g. "Sangat Kurang"
  maxLabel: string; // e.g. "Sangat Baik"
}

export interface NipAutofillConfig {
  nameQuestionId?: string;
  positionQuestionId?: string;
  unitQuestionId?: string;
  emailQuestionId?: string;
  phoneQuestionId?: string;
}

export interface Employee {
  id: string; // Unique, usually NIP
  nip: string; // 18-digit NIP
  nama: string;
  jabatan?: string;
  unitKerja?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options?: string[]; // for multiple_choice, checkboxes, dropdown
  validation: ValidationRule;
  conditionalLogic?: ConditionalLogic;
  linearScale?: LinearScaleConfig;
  nipAutofill?: NipAutofillConfig;
}

export type NavigationTab =
  | 'respondent'
  | 'editor'
  | 'analytics'
  | 'theme'
  | 'integrations';

export interface FormTheme {
  id: string;
  name: string;
  primaryColor: string; // Hex e.g. #0284c7
  primaryHover: string;
  accentColor: string;
  backgroundColor?: string;
  bannerImage: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  cardRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-none' | 'rounded-3xl';
  cardBorder: boolean;
}

export interface UploadedFileMeta {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  googleDriveLink?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string; // ISO string
  respondentName?: string;
  respondentEmail?: string;
  answers: Record<string, string | string[] | number | UploadedFileMeta>;
  googleSheetStatus: 'synced' | 'pending' | 'failed' | 'not_connected';
  emailNotificationStatus: 'sent' | 'pending' | 'failed' | 'disabled';
  webhookStatus: 'sent' | 'failed' | 'not_configured';
}

export interface FormConfig {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  theme: FormTheme;
  integrations: {
    googleSheets: {
      enabled: boolean;
      spreadsheetId?: string;
      spreadsheetUrl?: string;
      sheetName?: string;
      lastSyncedAt?: string;
    };
    emailNotifications: {
      enabled: boolean;
      adminEmail: string;
      notifyRespondent: boolean;
      subjectTemplate: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
      apiKey: string;
      lastTriggerStatus?: string;
    };
  };
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  url: string;
  payload: any;
  status: 'success' | 'failed';
  statusCode?: number;
  message?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'submission' | 'sync' | 'email' | 'webhook';
}
