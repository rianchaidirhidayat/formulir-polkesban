// Google Workspace API Services for Google Sheets, Gmail, and Google Drive

export interface CreateSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const createGoogleSheet = async (
  title: string,
  headers: string[],
  accessToken: string
): Promise<CreateSheetResult> => {
  const body = {
    properties: {
      title: title || 'Respon Formulir',
    },
    sheets: [
      {
        properties: {
          title: 'Respon Masuk',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((header) => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.9, green: 0.95, blue: 0.95 },
                  },
                })),
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat spreadsheet (${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
};

export const appendRowToSheet = async (
  spreadsheetId: string,
  sheetName: string,
  rowValues: (string | number)[],
  accessToken: string
) => {
  const range = `${sheetName || 'Respon Masuk'}!A:Z`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menambahkan baris ke sheet (${response.status})`);
  }

  return await response.json();
};

export const appendRowToGoogleSheet = async (
  spreadsheetId: string,
  rowValues: (string | number)[],
  accessToken: string,
  sheetName: string = 'Respon Masuk'
) => {
  return appendRowToSheet(spreadsheetId, sheetName, rowValues, accessToken);
};

export const verifySheetAccess = async (spreadsheetId: string, accessToken: string) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Tidak dapat mengakses Google Spreadsheet ini.');
  }

  return await response.json();
};

// Base64URL helper for Gmail API
function base64UrlEncode(str: string): string {
  // Support UTF-8 encoding in browser
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  accessToken: string;
}

export const sendEmailViaGmail = async ({
  to,
  subject,
  htmlContent,
  accessToken,
}: SendEmailParams) => {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    '',
    htmlContent,
  ];

  const emailRaw = emailLines.join('\r\n');
  const encodedEmail = base64UrlEncode(emailRaw);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengirim email notifikasi (${response.status})`);
  }

  return await response.json();
};
