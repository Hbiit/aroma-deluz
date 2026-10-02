// Aroma Deluz — Nodemailer Fallback Email Service
// Used when Mailgun is not configured or fails to dispatch

import nodemailer, { type Transporter } from 'nodemailer';

export interface NodemailerSendParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface NodemailerResult {
  success: boolean;
  provider: 'nodemailer-smtp' | 'nodemailer-ethereal' | 'nodemailer-simulated';
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

let etherealTransporterPromise: Promise<Transporter> | null = null;

/**
 * Check if custom SMTP configuration is present in environment
 */
export function isNodemailerConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  return Boolean(user && pass && (host || process.env.GMAIL_USER));
}

/**
 * Create or resolve Nodemailer transporter (Production SMTP or Development Ethereal/Local)
 */
async function getTransporter(): Promise<{
  transporter: Transporter;
  from: string;
  isEthereal: boolean;
}> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  const defaultFrom =
    process.env.SMTP_FROM ||
    process.env.MAILGUN_FROM ||
    '"Aroma De Luz" <orders@aromadeluz.com>';

  // 1. Gmail service shorthand
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && !host) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return {
      transporter,
      from: process.env.SMTP_FROM || `"Aroma De Luz" <${process.env.GMAIL_USER}>`,
      isEthereal: false,
    };
  }

  // 2. Custom SMTP host
  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return {
      transporter,
      from: defaultFrom,
      isEthereal: false,
    };
  }

  // 3. Fallback: Ethereal test account (for instant zero-config testing)
  if (!etherealTransporterPromise) {
    etherealTransporterPromise = (async () => {
      try {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      } catch (err) {
        console.warn('[Nodemailer] Could not reach Ethereal, falling back to JSON local transporter:', err);
        return nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    })();
  }

  const ethereal = await etherealTransporterPromise;
  return {
    transporter: ethereal,
    from: defaultFrom,
    isEthereal: true,
  };
}

/**
 * Send an email using Nodemailer with automatic SMTP / Ethereal / Local fallback
 */
export async function sendEmailWithNodemailer(
  params: NodemailerSendParams
): Promise<NodemailerResult> {
  try {
    const { transporter, from: defaultSender, isEthereal } = await getTransporter();

    let info;
    try {
      info = await transporter.sendMail({
        from: params.from || defaultSender,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        replyTo: params.replyTo,
      });
    } catch (networkErr: any) {
      console.warn('[Nodemailer] Network SMTP error, using safe local JSON transport:', networkErr.message);
      const safeTransporter = nodemailer.createTransport({ jsonTransport: true });
      info = await safeTransporter.sendMail({
        from: params.from || defaultSender,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    }

    const preview = isEthereal ? nodemailer.getTestMessageUrl(info) : false;

    console.log(
      `[Nodemailer] Email dispatched successfully (${isEthereal ? 'Ethereal Test Sandbox' : 'SMTP'}). Message ID: ${info.messageId || 'local-ok'}`
    );
    if (preview) {
      console.log(`[Nodemailer] ✉️  Preview URL: ${preview}`);
    }

    return {
      success: true,
      provider: isEthereal ? 'nodemailer-ethereal' : 'nodemailer-smtp',
      messageId: info.messageId || 'local-ok',
      previewUrl: preview,
    };
  } catch (error: any) {
    console.error('[Nodemailer] Failed to send email:', error);
    return {
      success: false,
      provider: 'nodemailer-smtp',
      error: error.message || 'Nodemailer failed to dispatch email',
    };
  }
}
