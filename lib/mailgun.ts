import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { formatNaira } from '@/lib/utils';

// Initialize Mailgun client
function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return null;
  }

  const mailgun = new Mailgun(FormData);
  return {
    client: mailgun.client({
      username: 'api',
      key: apiKey,
      url: process.env.MAILGUN_HOST || 'https://api.mailgun.net',
    }),
    domain,
    from: process.env.MAILGUN_FROM || `Aroma De Luz <orders@${domain}>`,
  };
}

export interface OrderEmailData {
  reference: string;
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  items: Array<{
    name: string;
    qty?: number;
    quantity?: number;
    price_kobo: number;
  }>;
  totalKobo: number;
}

/**
 * Send luxury branded order confirmation email via Mailgun
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const mg = getMailgunClient();
  if (!mg) {
    console.warn('[Mailgun] Skipping email: MAILGUN_API_KEY or MAILGUN_DOMAIN not configured in environment.');
    return { success: false, reason: 'unconfigured' };
  }

  const itemsHtml = order.items
    .map((item) => {
      const quantity = item.qty || item.quantity || 1;
      const subtotal = formatNaira(item.price_kobo * quantity);
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #481e42; color: #fdfcf9; font-size: 14px;">
            <strong style="color: #c9a45c;">${item.name}</strong><br/>
            <span style="font-size: 12px; color: #c0b8bf;">Qty: ${quantity} &times; ${formatNaira(item.price_kobo)}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #481e42; text-align: right; color: #fdfcf9; font-size: 14px; font-weight: 600;">
            ${subtotal}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Aroma De Luz</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #1f0b1d; color: #fdfcf9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #2d1229; border: 1px solid #c9a45c33; border-radius: 12px; overflow: hidden; }
        .header { text-align: center; padding: 36px 20px; background: linear-gradient(180deg, #481e42 0%, #2d1229 100%); border-bottom: 1px solid #c9a45c40; }
        .logo-title { font-size: 26px; font-family: Georgia, serif; letter-spacing: 2px; color: #c9a45c; margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; }
        .logo-subtitle { font-size: 11px; letter-spacing: 4px; color: #e5c468; margin: 0; text-transform: uppercase; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; color: #fdfcf9; margin-bottom: 12px; font-family: Georgia, serif; }
        .lead-text { font-size: 14px; color: #d0c8cf; line-height: 1.6; margin-bottom: 24px; }
        .order-badge { background-color: #481e42; border-left: 3px solid #c9a45c; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; }
        .order-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .total-row { padding-top: 16px; display: flex; justify-content: space-between; font-size: 18px; color: #c9a45c; font-weight: bold; border-top: 2px solid #c9a45c; }
        .address-box { background-color: #200b1d; padding: 16px; border-radius: 8px; border: 1px solid #481e42; font-size: 13px; color: #d0c8cf; line-height: 1.6; }
        .footer { text-align: center; padding: 24px; font-size: 12px; color: #8a7a88; border-top: 1px solid #481e42; }
      </style>
    </head>
    <body style="background-color: #1a0818; padding: 30px 10px;">
      <div class="container">
        <div class="header">
          <h1 class="logo-title">Aroma De Luz</h1>
          <p class="logo-subtitle">All About Scent &bull; Lagos</p>
        </div>

        <div class="content">
          <h2 class="greeting">Thank you for your order, ${order.fullName}.</h2>
          <p class="lead-text">
            Your artisanal fragrance selection has been received. Our perfumers and candlemakers are preparing your package with luxury protective packaging and complimentary discovery vials.
          </p>

          <div class="order-badge">
            <p style="margin: 0; font-size: 13px; color: #c9a45c; font-weight: bold;">Order Reference: ${order.reference}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #c0b8bf;">Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <table class="order-table">
            <thead>
              <tr style="border-bottom: 1px solid #c9a45c60;">
                <th style="text-align: left; padding-bottom: 8px; color: #c9a45c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                <th style="text-align: right; padding-bottom: 8px; color: #c9a45c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table style="width: 100%; margin-top: 10px; margin-bottom: 24px;">
            <tr>
              <td style="font-size: 16px; font-weight: bold; color: #fdfcf9;">Total Paid</td>
              <td style="font-size: 20px; font-weight: bold; color: #c9a45c; text-align: right;">${formatNaira(order.totalKobo)}</td>
            </tr>
          </table>

          <div class="address-box">
            <strong style="color: #c9a45c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Delivery Details</strong>
            ${order.fullName}<br/>
            ${order.address}, ${order.city}<br/>
            ${order.state} State, Nigeria<br/>
            ${order.phone ? `Phone: ${order.phone}` : ''}
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;">Aroma De Luz &bull; Hand-Poured Soy Candles &amp; Haute Parfumerie</p>
          <p style="margin: 0;">Inquiries: concierge@aromadeluz.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await mg.client.messages.create(mg.domain, {
      from: mg.from,
      to: [order.email],
      subject: `Order Confirmation — ${order.reference} | Aroma De Luz`,
      html,
      text: `Thank you for your order, ${order.fullName}!\nReference: ${order.reference}\nTotal: ${formatNaira(order.totalKobo)}\n\nYour items:\n${order.items.map((i) => `- ${i.name} (x${i.qty || i.quantity || 1}): ${formatNaira(i.price_kobo * (i.qty || i.quantity || 1))}`).join('\n')}\n\nDelivery to: ${order.address}, ${order.city}, ${order.state}`,
    });

    console.log('[Mailgun] Order confirmation sent:', response.id);
    return { success: true, id: response.id };
  } catch (error) {
    console.error('[Mailgun] Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send concierge inquiry email via Mailgun
 */
export async function sendContactInquiryEmail(data: { name: string; email: string; subject: string; message: string }) {
  const mg = getMailgunClient();
  if (!mg) {
    console.warn('[Mailgun] Skipping contact email: Mailgun not configured.');
    return { success: false, reason: 'unconfigured' };
  }

  try {
    const response = await mg.client.messages.create(mg.domain, {
      from: mg.from,
      to: [process.env.CONCIERGE_EMAIL || mg.from],
      replyTo: data.email,
      subject: `[Concierge Inquiry] ${data.subject} — ${data.name}`,
      text: `Inquiry from: ${data.name} (${data.email})\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
    });

    return { success: true, id: response.id };
  } catch (error) {
    console.error('[Mailgun] Error sending contact email:', error);
    return { success: false, error };
  }
}

/**
 * Send luxury branded welcome email to newly registered users
 */
export async function sendWelcomeEmail(user: { email: string; fullName?: string }) {
  const mg = getMailgunClient();
  if (!mg) {
    console.warn('[Mailgun] Skipping welcome email: Mailgun not configured.');
    return { success: false, reason: 'unconfigured' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aroma-deluz.vercel.app';
  const name = user.fullName || 'Connoisseur';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Aroma De Luz</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #1a0818; color: #fdfcf9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #2d1229; border: 1px solid #c9a45c44; border-radius: 12px; overflow: hidden; }
        .header { text-align: center; padding: 40px 20px; background: linear-gradient(180deg, #481e42 0%, #2d1229 100%); border-bottom: 1px solid #c9a45c40; }
        .logo-title { font-size: 28px; font-family: Georgia, serif; letter-spacing: 3px; color: #c9a45c; margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; }
        .logo-subtitle { font-size: 11px; letter-spacing: 4px; color: #e5c468; margin: 0; text-transform: uppercase; }
        .content { padding: 36px 30px; }
        .greeting { font-size: 20px; color: #fdfcf9; margin-bottom: 16px; font-family: Georgia, serif; }
        .lead-text { font-size: 14px; color: #d0c8cf; line-height: 1.8; margin-bottom: 24px; }
        .highlight-card { background: linear-gradient(135deg, #3d1737 0%, #260e22 100%); border: 1px solid #c9a45c33; border-radius: 8px; padding: 22px; margin: 24px 0; text-align: center; }
        .highlight-title { font-family: Georgia, serif; font-size: 16px; color: #c9a45c; margin-bottom: 8px; }
        .highlight-body { font-size: 13px; color: #b8acb7; line-height: 1.6; }
        .btn { display: inline-block; background-color: #c9a45c; color: #1a0818; padding: 14px 32px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; border-radius: 6px; margin: 24px 0; }
        .footer { text-align: center; padding: 24px; font-size: 12px; color: #8a7a88; border-top: 1px solid #481e42; }
      </style>
    </head>
    <body style="background-color: #1a0818; padding: 30px 10px;">
      <div class="container">
        <div class="header">
          <h1 class="logo-title">Aroma De Luz</h1>
          <p class="logo-subtitle">All About Scent &bull; Lagos</p>
        </div>

        <div class="content">
          <p class="greeting">Bienvenue, ${name}</p>
          <p class="lead-text">
            We are delighted to welcome you to the world of <strong>Aroma De Luz</strong>. Your account has been officially created, granting you access to our private olfactory sanctuary.
          </p>
          <p class="lead-text">
            Every creation in our atelier is crafted with rare botanicals, hand-poured soy wax, and master perfumery traditions right in Lagos, Nigeria.
          </p>

          <div class="highlight-card">
            <div class="highlight-title">Your Exclusive Member Privileges</div>
            <div class="highlight-body">
              &bull; Persistent Saved Bag &amp; Scent Wishlist<br/>
              &bull; Complimentary White-Glove Discovery Packaging<br/>
              &bull; Early Access to Limited Seasonal Batches
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${siteUrl}/products" class="btn" style="color: #1a0818;">Discover The Collection</a>
          </div>

          <p style="font-size: 13px; color: #9c8e9b; margin-top: 32px; line-height: 1.6;">
            If you ever need guidance in selecting your signature note or curating a bespoke gift box, our concierge is always at your service.
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;">Aroma De Luz &bull; Hand-Poured Soy Candles &amp; Haute Parfumerie</p>
          <p style="margin: 0;">Inquiries: concierge@aromadeluz.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await mg.client.messages.create(mg.domain, {
      from: mg.from,
      to: [user.email],
      subject: `✨ Welcome to Aroma De Luz, ${name}`,
      html,
      text: `Bienvenue to Aroma De Luz, ${name}!\n\nWe are delighted to welcome you into our circle of connoisseurs. Explore hand-poured soy candles and haute parfumerie at: ${siteUrl}/products\n\nWarm regards,\nThe Aroma De Luz Maison`,
    });

    console.log('[Mailgun] Welcome email sent:', response.id);
    return { success: true, id: response.id };
  } catch (error) {
    console.error('[Mailgun] Error sending welcome email:', error);
    return { success: false, error };
  }
}

