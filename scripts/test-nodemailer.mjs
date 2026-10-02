#!/usr/bin/env node
/**
 * Aroma De Luz — Nodemailer & Gmail Verification Test
 * 
 * Usage:
 *   node scripts/test-nodemailer.mjs [recipient-email]
 *   node scripts/test-nodemailer.mjs [app-password] [recipient-email]
 *   npm run test:nodemailer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dns from 'dns';

// Ensure resilient DNS resolution on Windows
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

// Parse command line arguments
let appPassArg = undefined;
let recipient = process.argv[2];

if (recipient && recipient.replace(/\s+/g, '').length === 16 && !recipient.includes('@')) {
  appPassArg = recipient;
  recipient = process.argv[3];
}

const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'testerdefault8@gmail.com';
const gmailPass = appPassArg || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
recipient = recipient || process.env.TEST_EMAIL || 'adeboi38@gmail.com';

console.log('═'.repeat(60));
console.log('  ✦ AROMA DE LUZ — NODEMAILER (GMAIL) DISPATCH TEST ✦');
console.log('═'.repeat(60));
console.log(`📤 Sender Account:    ${gmailUser}`);
console.log(`📬 Target Recipient:  ${recipient}`);

if (gmailPass) {
  const cleanPass = gmailPass.replace(/\s+/g, '');
  console.log(`🔑 App Password:     ${cleanPass.slice(0, 4)} **** **** ${cleanPass.slice(-4)}\n`);
} else {
  console.log(`⚠️  App Password:     (None set in .env.local yet — will attempt Ethereal sandbox)\n`);
}

async function runTest() {
  const senderFrom = process.env.SMTP_FROM || `"Aroma De Luz" <${gmailUser}>`;
  const subject = `✨ Luxury Scent Order Confirmation — AROMA-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

  const html = `
    <div style="font-family: 'Georgia', serif; background-color: #1a0818; padding: 30px 10px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #2d1229; border: 1px solid #c9a45c44; border-radius: 12px; overflow: hidden;">
        <div style="text-align: center; padding: 32px 20px; background: linear-gradient(180deg, #481e42 0%, #2d1229 100%); border-bottom: 1px solid #c9a45c40;">
          <h1 style="color: #c9a45c; margin: 0; font-size: 26px; letter-spacing: 3px; text-transform: uppercase;">Aroma De Luz</h1>
          <p style="color: #e5c468; margin: 4px 0 0; font-size: 11px; letter-spacing: 4px; text-transform: uppercase;">Haute Parfumerie &amp; Hand-Poured Soy Candles</p>
        </div>
        <div style="padding: 30px 24px; color: #fdfcf9;">
          <p style="font-size: 18px; margin-top: 0;">Dear Connoisseur,</p>
          <p style="font-size: 14px; line-height: 1.7; color: #d0c8cf;">
            This test email confirms that your store's <strong>Nodemailer integration</strong> is successfully authenticated and delivering emails directly from <strong>${gmailUser}</strong>!
          </p>
          <div style="background-color: #3d1737; border-left: 3px solid #c9a45c; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #c9a45c; font-weight: bold;">Verified Provider: Nodemailer (Gmail SMTP Relay)</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #b8acb7;">Status: Authenticated &bull; High-Deliverability TLS</p>
          </div>
          <p style="font-size: 12px; color: #8a7a88; text-align: center; margin-top: 24px;">
            Aroma De Luz Atelier &bull; Lagos, Nigeria &bull; concierge@aromadeluz.com
          </p>
        </div>
      </div>
    </div>
  `;

  let transporter;
  let isEthereal = false;

  if (gmailPass) {
    const cleanPass = gmailPass.replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log(`Connecting to Google SMTP (smtp.gmail.com:465) as ${gmailUser}...`);
    try {
      await transporter.verify();
      console.log('✓ Google SMTP authentication successful!\n');
    } catch (authErr) {
      console.error(`✗ Google SMTP authentication failed:`, authErr.message);
      console.log('\n👉 Instructions to create a Google App Password for testerdefault8@gmail.com:');
      console.log('   1. Sign in to your Google Account (testerdefault8@gmail.com)');
      console.log('   2. Visit: https://myaccount.google.com/apppasswords');
      console.log('      (Note: 2-Step Verification must be enabled on the Google Account)');
      console.log('   3. Set App Name to: "Aroma Deluz"');
      console.log('   4. Click "Create" and copy the 16-character password (e.g. abcd efgh ijkl mnop)');
      console.log('   5. Add to .env.local:');
      console.log('      GMAIL_APP_PASSWORD=your-16-character-password');
      console.log('      GMAIL_USER=testerdefault8@gmail.com\n');
      console.log('═'.repeat(60) + '\n');
      return;
    }
  } else {
    console.log('No GMAIL_APP_PASSWORD found in .env.local.');
    console.log('Creating ephemeral Ethereal test inbox sandbox for preview...\n');
    const testAccount = await nodemailer.createTestAccount();
    isEthereal = true;
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      tls: { rejectUnauthorized: false },
    });
  }

  try {
    const info = await transporter.sendMail({
      from: senderFrom,
      to: recipient,
      subject,
      html,
      text: 'Aroma De Luz Nodemailer test email.',
    });

    console.log('─'.repeat(60));
    console.log('🎉 EMAIL DISPATCHED SUCCESSFULLY VIA NODEMAILER!');
    console.log(`   From:        ${senderFrom}`);
    console.log(`   To:          ${recipient}`);
    console.log(`   Message ID:  ${info.messageId}`);

    if (isEthereal) {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log(`\n✉️  View preview in browser:`);
      console.log(`   ${preview}`);
    } else {
      console.log(`\n📬 Check your inbox at ${recipient}!`);
    }
    console.log('═'.repeat(60) + '\n');
  } catch (sendErr) {
    console.error('✗ Failed to dispatch email:', sendErr.message);
  }
}

runTest();
