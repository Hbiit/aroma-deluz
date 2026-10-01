#!/usr/bin/env node
/**
 * Aroma De Luz — Automated Integrations Setup
 * 
 * Automates:
 * 1. Validating Google OAuth and Mailgun credentials
 * 2. Updating .env.local with fresh credentials
 * 3. Pushing variables directly to Vercel production
 * 4. Dispatching a live test email via Mailgun
 * 
 * Usage:
 *   node scripts/automate-integrations.mjs \
 *     --mailgunApiKey="key-..." \
 *     --mailgunDomain="mg.aromadeluz.com" \
 *     --mailgunFrom="Aroma De Luz <orders@aromadeluz.com>" \
 *     --googleClientId="..." \
 *     --googleClientSecret="..." \
 *     --testEmail="customer@example.com"
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

console.log('✨ Aroma De Luz — Automated Integrations Setup\n');

// 1. Read current .env.local
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Helper to get or replace key in .env.local
function setEnvVar(key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
}

// Helper to get variable from existing envContent
function getEnvVar(key) {
  const match = envContent.match(new RegExp(`^${key}=["']?(.*?)["']?$`, 'm'));
  return match ? match[1].trim() : undefined;
}

// 2. Parse command line arguments or environment
const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
  const [k, ...v] = arg.split('=');
  if (k) params[k.replace(/^--/, '')] = v.join('=');
});

const googleClientId = params.googleClientId || process.env.GOOGLE_CLIENT_ID || getEnvVar('GOOGLE_CLIENT_ID');
const googleClientSecret = params.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || getEnvVar('GOOGLE_CLIENT_SECRET');
const mailgunApiKey = params.mailgunApiKey || process.env.MAILGUN_API_KEY || getEnvVar('MAILGUN_API_KEY');
const mailgunDomain = params.mailgunDomain || process.env.MAILGUN_DOMAIN || getEnvVar('MAILGUN_DOMAIN');
const mailgunFrom = params.mailgunFrom || process.env.MAILGUN_FROM || getEnvVar('MAILGUN_FROM') || 'Aroma De Luz <orders@mg.aromadeluz.com>';
const testEmail = params.testEmail || params.email;

console.log('📋 Validating parameters:');
console.log(`- Google Client ID: ${googleClientId ? '✓ Provided' : '✗ Not provided'}`);
console.log(`- Google Client Secret: ${googleClientSecret ? '✓ Provided' : '✗ Not provided'}`);
console.log(`- Mailgun API Key: ${mailgunApiKey ? '✓ Provided' : '✗ Not provided'}`);
console.log(`- Mailgun Domain: ${mailgunDomain ? '✓ Provided' : '✗ Not provided'}`);
console.log(`- Mailgun From: ${mailgunFrom}`);
if (testEmail) {
  console.log(`- Test Email Target: ${testEmail}`);
}
console.log('');

// 3. Update .env.local
let updated = false;

if (mailgunApiKey) {
  setEnvVar('MAILGUN_API_KEY', mailgunApiKey);
  updated = true;
}
if (mailgunDomain) {
  setEnvVar('MAILGUN_DOMAIN', mailgunDomain);
  updated = true;
}
if (mailgunFrom) {
  setEnvVar('MAILGUN_FROM', `"${mailgunFrom}"`);
  updated = true;
}
if (googleClientId) {
  setEnvVar('GOOGLE_CLIENT_ID', googleClientId);
  updated = true;
}
if (googleClientSecret) {
  setEnvVar('GOOGLE_CLIENT_SECRET', googleClientSecret);
  updated = true;
}

if (updated) {
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log('✓ Updated .env.local with supplied credentials.');
}

// 4. Push to Vercel Production
function pushVercelVar(name, value) {
  if (!value) return;
  try {
    execSync(`npx vercel env rm ${name} production -y`, { stdio: 'ignore' });
  } catch {}
  try {
    execSync(`npx vercel env add ${name} production`, {
      input: value,
      stdio: ['pipe', 'inherit', 'ignore'],
    });
    console.log(`✓ Vercel production: ${name} synced.`);
  } catch (e) {
    console.log(`! Note: Could not auto-sync ${name} to Vercel (${e.message}). You can add it in the Vercel dashboard.`);
  }
}

const shouldPushVercel = params.vercel === 'true' || params.vercel === '';
if (shouldPushVercel) {
  console.log('\n🚀 Syncing environment variables to Vercel Production...');
  if (mailgunApiKey) pushVercelVar('MAILGUN_API_KEY', mailgunApiKey);
  if (mailgunDomain) pushVercelVar('MAILGUN_DOMAIN', mailgunDomain);
  if (mailgunFrom) pushVercelVar('MAILGUN_FROM', mailgunFrom);
  if (googleClientId) pushVercelVar('GOOGLE_CLIENT_ID', googleClientId);
  if (googleClientSecret) pushVercelVar('GOOGLE_CLIENT_SECRET', googleClientSecret);
} else {
  console.log('\n💡 Tip: To sync variables directly to Vercel production via CLI, run with --vercel=true');
  console.log('Or add them in the Vercel Dashboard: Settings → Environment Variables.');
}

// 5. Dispatch Live Test Email via Mailgun
if (testEmail && mailgunApiKey && mailgunDomain) {
  console.log(`\n📬 Dispatching live test email to: ${testEmail}...`);
  try {
    const mg = new Mailgun(FormData);
    const client = mg.client({
      username: 'api',
      key: mailgunApiKey,
      url: process.env.MAILGUN_HOST || 'https://api.mailgun.net',
    });

    const sendRes = await client.messages.create(mailgunDomain, {
      from: mailgunFrom,
      to: [testEmail],
      subject: '✨ Aroma De Luz — Luxury Order Confirmation Test',
      html: `
        <div style="font-family: Georgia, serif; background-color: #2d1229; color: #fdfcf9; padding: 40px; border-radius: 12px; max-width: 550px; margin: 0 auto; border: 1px solid #c9a45c;">
          <h1 style="color: #c9a45c; text-align: center; letter-spacing: 2px; text-transform: uppercase;">Aroma De Luz</h1>
          <p style="text-align: center; color: #e5c468; letter-spacing: 3px; font-size: 12px;">All About Scent &bull; Lagos</p>
          <hr style="border: 0; border-top: 1px solid #c9a45c40; margin: 24px 0;" />
          <p style="font-size: 16px;">Dear Connoisseur,</p>
          <p style="color: #d0c8cf; font-size: 14px; line-height: 1.6;">
            Your Mailgun email integration for <strong>Aroma De Luz</strong> has been successfully configured and verified.
          </p>
          <div style="background-color: #481e42; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 3px solid #c9a45c;">
            <p style="margin: 0; font-size: 13px; color: #fdfcf9;"><strong>Domain:</strong> ${mailgunDomain}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #fdfcf9;"><strong>Sender:</strong> ${mailgunFrom}</p>
          </div>
          <p style="color: #c9a45c; font-size: 13px; text-align: center;">Crafted with artisanal distinction in Lagos, Nigeria.</p>
        </div>
      `,
    });

    console.log(`✓ Test email successfully queued/dispatched! (ID: ${sendRes.id || 'sent'})`);
  } catch (err) {
    console.error(`✗ Failed to dispatch test email:`, err.message);
  }
}

console.log('\n✅ Setup process complete!');
