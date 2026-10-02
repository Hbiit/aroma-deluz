// Aroma Deluz — Brevo (formerly Sendinblue) Transactional Email Service
// Supports both Brevo v3 REST API (ultra-fast & firewall-immune) and Brevo SMTP

import dns from 'dns';

try {
  dns.setDefaultResultOrder?.('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

export interface BrevoSendParams {
  to: string | Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  text?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: { email: string; name?: string };
}

export interface BrevoResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if Brevo is configured in environment
 */
export function isBrevoConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY ||
      (process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY) ||
      (process.env.SMTP_HOST === 'smtp-relay.brevo.com' && process.env.SMTP_PASS)
  );
}

/**
 * Send transactional email via Brevo REST API v3
 * https://developers.brevo.com/reference/sendtransacemail
 */
export async function sendEmailWithBrevo(params: BrevoSendParams): Promise<BrevoResult> {
  const apiKey =
    process.env.BREVO_API_KEY ||
    process.env.BREVO_SMTP_KEY ||
    (process.env.SMTP_HOST === 'smtp-relay.brevo.com' ? process.env.SMTP_PASS : undefined);

  if (!apiKey) {
    return {
      success: false,
      error: 'BREVO_API_KEY is not configured in environment',
    };
  }

  // Format recipients
  let recipients: Array<{ email: string; name?: string }> = [];
  if (typeof params.to === 'string') {
    recipients = [{ email: params.to }];
  } else if (Array.isArray(params.to)) {
    recipients = params.to.map((item) =>
      typeof item === 'string' ? { email: item } : item
    );
  }

  // Parse sender
  const defaultFrom =
    process.env.BREVO_SENDER_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.MAILGUN_FROM ||
    'orders@aromadeluz.com';

  let senderEmail = params.senderEmail || defaultFrom;
  let senderName = params.senderName || 'Aroma De Luz';

  const match = defaultFrom.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  if (match) {
    if (match[1]) senderName = match[1].trim();
    if (match[2]) senderEmail = match[2].trim();
  }

  const payload: any = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: recipients,
    subject: params.subject,
    htmlContent: params.html,
  };

  if (params.text) {
    payload.textContent = params.text;
  }

  if (params.replyTo) {
    payload.replyTo = params.replyTo;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Brevo API Error]:', data);
      return {
        success: false,
        error: data.message || `Brevo request failed with HTTP ${res.status}`,
      };
    }

    console.log('[Brevo] Email dispatched successfully. Message ID:', data.messageId);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (err: any) {
    console.error('[Brevo Exception]:', err);
    return {
      success: false,
      error: err.message || 'Network error while contacting Brevo API',
    };
  }
}
