import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const testEmail = body.email || process.env.TEST_EMAIL || 'client@aromadeluz.com';

    const result = await sendOrderConfirmationEmail({
      reference: 'AROMA-TEST-' + Math.floor(1000 + Math.random() * 9000),
      fullName: body.name || 'Valued Connoisseur',
      email: testEmail,
      phone: '+234 800 000 0000',
      address: 'Plot 12, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      items: [
        {
          name: 'Velvet Rose & Smoked Oud Soy Candle',
          quantity: 1,
          price_kobo: 3800000,
        },
        {
          name: 'L’Amour Éternel Extrait de Parfum',
          quantity: 1,
          price_kobo: 9500000,
        },
      ],
      totalKobo: 13300000,
    });

    return NextResponse.json({
      success: result.success,
      details: result,
      configured: {
        hasApiKey: !!process.env.MAILGUN_API_KEY,
        hasDomain: !!process.env.MAILGUN_DOMAIN,
        from: process.env.MAILGUN_FROM || 'default',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const hasBrevo = Boolean(process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY);
  const hasMailgun = Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
  const hasSmtp = Boolean(
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  );

  return NextResponse.json({
    status: 'Email test endpoint ready. Send POST with { email: "your-email@example.com" } to dispatch a test email.',
    providers: {
      brevo: {
        configured: hasBrevo,
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'orders@aromadeluz.com',
      },
      mailgun: {
        configured: hasMailgun,
        domain: process.env.MAILGUN_DOMAIN || null,
      },
      nodemailerFallback: {
        configured: hasSmtp,
        mode: hasSmtp ? 'production-smtp' : 'ephemeral-ethereal-test',
      },
    },
  });
}
