#!/usr/bin/env node
/**
 * Aroma De Luz — Brevo Integration Verification Test
 * 
 * Usage:
 *   node scripts/test-brevo.mjs [recipient-email]
 *   node scripts/test-brevo.mjs xkeysib-xxxxxxxx [recipient-email]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Ensure resilient DNS resolution on Windows environments
try {
  dns.setDefaultResultOrder?.('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

// Load .env.local
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && process.env[k.trim()] === undefined) {
      let val = v.join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[k.trim()] = val;
    }
  });
}

// Check arguments
let apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
let recipient = process.argv[2];

if (recipient && (recipient.startsWith('xkeysib-') || recipient.startsWith('xsmtpsib-'))) {
  apiKey = recipient;
  recipient = process.argv[3];
}

recipient = recipient || process.env.TEST_EMAIL || 'client@aromadeluz.com';

console.log('═'.repeat(60));
console.log('  ✦ AROMA DE LUZ — BREVO TRANSACTIONAL EMAIL TEST ✦');
console.log('═'.repeat(60) + '\n');

if (!apiKey || apiKey.trim() === '') {
  console.log('⚠️  BREVO_API_KEY is not yet defined in .env.local\n');
  console.log('👉 To activate Brevo, add your key to .env.local:');
  console.log('   BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  console.log('   BREVO_SENDER_EMAIL=your-verified-email@example.com\n');
  console.log('   OR test directly in CLI:');
  console.log('   node scripts/test-brevo.mjs xkeysib-xxxxxxxx recipient@example.com\n');
  console.log('═'.repeat(60) + '\n');
  process.exit(0);
}

const maskedKey = apiKey.slice(0, 10) + '...' + apiKey.slice(-4);
console.log(`🔑 Using Brevo Key: ${maskedKey}`);
console.log(`📬 Target Recipient: ${recipient}\n`);

async function testBrevo() {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'orders@aromadeluz.com';
  const senderName = 'Aroma De Luz';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: recipient,
        name: 'Valued Connoisseur',
      },
    ],
    subject: `✨ Brevo Verification — Order Confirmed | Aroma De Luz`,
    htmlContent: `
      <div style="font-family: Georgia, serif; background-color: #241441; color: #fdfbf7; padding: 32px; border-radius: 12px; border: 1px solid #c9a45c60; max-width: 540px; margin: 0 auto;">
        <h1 style="color: #c9a45c; text-align: center; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Aroma De Luz</h1>
        <p style="color: #e3c77f; text-align: center; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 0;">Haute Parfumerie &amp; Hand-Poured Candles</p>
        <hr style="border: none; border-top: 1px solid #c9a45c40; margin: 24px 0;" />
        <p style="font-size: 16px; color: #fdfbf7;">Dear Connoisseur,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #d6cfd8;">
          Your <strong>Brevo transactional email integration</strong> for Aroma De Luz has been successfully verified!
        </p>
        <div style="background-color: #3b2367; padding: 16px; border-radius: 8px; border-left: 4px solid #c9a45c; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #c9a45c; font-weight: bold;">Provider: Brevo Transactional REST API v3</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #fdfbf7;">Status: Active &amp; Verified</p>
        </div>
        <p style="font-size: 12px; color: #9f96a3; text-align: center; margin-top: 24px;">
          White-Glove Customer Care: concierge@aromadeluz.com
        </p>
      </div>
    `,
    textContent: 'Aroma De Luz Brevo transactional email test passed successfully.',
  };

  try {
    console.log('Sending transactional email via Brevo REST API (https://api.brevo.com/v3/smtp/email)...');
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.messageId) {
      console.log('\n' + '─'.repeat(60));
      console.log('🎉 BREVO TRANSACTIONAL EMAIL DISPATCHED SUCCESSFULLY!');
      console.log(`   Message ID: ${data.messageId}`);
      console.log(`   Delivered to: ${recipient}`);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.log('\n' + '─'.repeat(60));
      console.log(`✗ Brevo API returned error (${res.status}):`);
      console.log(`  ${data.message || JSON.stringify(data)}`);
      if (data.code === 'unauthorized') {
        console.log('  👉 Please verify that your BREVO_API_KEY is active in your Brevo Dashboard (SMTP & API tab).');
      }
      console.log('═'.repeat(60) + '\n');
    }
  } catch (err) {
    console.error('✗ Network error connecting to Brevo:', err);
  }
}

testBrevo();
