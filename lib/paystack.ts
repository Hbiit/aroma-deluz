// Aroma Deluz — Paystack Integration Service
// Standard NGN payments (kobo integers) with server-side verification and webhook support

import crypto from 'crypto';
import dns from 'dns';

try {
  dns.setDefaultResultOrder?.('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

export interface PaystackInitializeParams {
  email: string;
  amountKobo: number; // In kobo (e.g. ₦150,000 = 15000000)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitializeResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

export interface PaystackVerificationResult {
  success: boolean;
  data?: {
    status: 'success' | 'failed' | 'abandoned' | string;
    reference: string;
    amount: number;
    currency: string;
    channel?: string;
    paid_at?: string;
    customer?: {
      email: string;
      customer_code?: string;
    };
    metadata?: Record<string, any>;
    gateway_response?: string;
  };
  error?: string;
}

/**
 * Check if Paystack secret key is configured in environment
 */
export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(key && key.trim() !== '');
}

/**
 * Initialize a Paystack hosted payment transaction
 * https://paystack.com/docs/api/transaction/#initialize
 */
export async function initializePaystackTransaction(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      error: 'PAYSTACK_SECRET_KEY is not configured in environment',
    };
  }

  try {
    const payload = {
      email: params.email,
      amount: Math.round(params.amountKobo),
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: 'NGN',
      metadata: {
        ...params.metadata,
        custom_fields: [
          {
            display_name: 'Store',
            variable_name: 'store',
            value: 'Aroma De Luz',
          },
          ...(params.metadata?.custom_fields || []),
        ],
      },
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      console.error('[Paystack Init Error]:', data);
      return {
        success: false,
        error: data.message || `Paystack initialization failed (${res.status})`,
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error: any) {
    console.error('[Paystack Init Exception]:', error);
    return {
      success: false,
      error: error.message || 'Network error while contacting Paystack',
    };
  }
}

/**
 * Verify a Paystack transaction server-side
 * https://paystack.com/docs/api/transaction/#verify
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerificationResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      error: 'PAYSTACK_SECRET_KEY is not configured in environment',
    };
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();

    if (!res.ok || !data.status) {
      console.error('[Paystack Verify Error]:', data);
      return {
        success: false,
        error: data.message || `Paystack verification failed (${res.status})`,
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error('[Paystack Verify Exception]:', error);
    return {
      success: false,
      error: error.message || 'Network error while verifying with Paystack',
    };
  }
}

/**
 * Validate Paystack Webhook signature (HMAC SHA512)
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !signatureHeader) return false;

  const hash = crypto
    .createHmac('sha512', secretKey.trim())
    .update(rawBody)
    .digest('hex');

  return hash === signatureHeader;
}
