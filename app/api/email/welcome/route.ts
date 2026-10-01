import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/mailgun';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await sendWelcomeEmail({ email, fullName });

    return NextResponse.json({
      success: result.success,
      details: result,
    });
  } catch (error: any) {
    console.error('Welcome email API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch welcome email' }, { status: 500 });
  }
}
