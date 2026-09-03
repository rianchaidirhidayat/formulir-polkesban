import { WebhookLog } from '../types';

export const triggerWebhook = async (
  url: string,
  apiKey: string,
  payload: any
): Promise<WebhookLog> => {
  const logId = 'log-' + Date.now();
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Form-Secret-Key': apiKey || 'default-secret',
        'User-Agent': 'Poltekkes-GoogleFormsClone/2.0',
      },
      body: JSON.stringify(payload),
    });

    const isSuccess = response.ok;
    return {
      id: logId,
      timestamp,
      url,
      payload,
      status: isSuccess ? 'success' : 'failed',
      statusCode: response.status,
      message: isSuccess
        ? 'Data respon berhasil diteruskan ke webhook eksternal'
        : `Server merespon dengan status ${response.status}`,
    };
  } catch (error: any) {
    return {
      id: logId,
      timestamp,
      url,
      payload,
      status: 'failed',
      message: error?.message || 'Gagal terhubung ke endpoint webhook (Network/CORS error)',
    };
  }
};
