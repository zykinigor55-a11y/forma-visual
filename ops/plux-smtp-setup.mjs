#!/usr/bin/env node
/**
 * PLUX Friends: secure Supabase SMTP setup with Brevo.
 * This script runs ONLY from a manually triggered GitHub Action.
 * Never paste SMTP keys into PLUX client code or repository files.
 *
 * Required GitHub Actions secrets:
 * SUPABASE_ACCESS_TOKEN, BREVO_SMTP_LOGIN, BREVO_SMTP_KEY, PLUX_SENDER_EMAIL
 * Brevo sender domain must already be verified.
 */
import assert from 'node:assert/strict';

const project = 'lxwqpoakdsbpshfyfqih';
const root = 'https://api.supabase.com/v1/projects';
const needed = ['SUPABASE_ACCESS_TOKEN','BREVO_SMTP_LOGIN','BREVO_SMTP_KEY','PLUX_SENDER_EMAIL'];
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function makeConfig(env) {
  const missing = needed.filter(k => !env[k] || !String(env[k]).trim());
  if (missing.length) {
    throw new Error('Missing GitHub Actions secrets: ' + missing.join(', ') +
      '. The Supabase SMTP configuration was NOT changed.');
  }
  const sender = String(env.PLUX_SENDER_EMAIL).trim();
  if (!validEmail(sender)) {
    throw new Error('PLUX_SENDER_EMAIL must be an email on your OWN Brevo-verified domain.');
  }
  const domain = sender.split('@')[1].toLowerCase();
  if (['gmail.com','yandex.ru','yandex.com','mail.ru','outlook.com','hotmail.com',
       'icloud.com','yahoo.com','ya.ru','list.ru','bk.ru','inbox.ru'].includes(domain)) {
    throw new Error('PLUX_SENDER_EMAIL must use your own verified domain, not a free mailbox.');
  }
  return {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_admin_email: sender,
    smtp_host: 'smtp-relay.brevo.com',
    smtp_port: '587',
    smtp_user: String(env.BREVO_SMTP_LOGIN).trim(),
    smtp_pass: String(env.BREVO_SMTP_KEY).trim(),
    smtp_sender_name: 'PLUX',
  };
}

function sanitizeError(detail) {
  let txt = String(detail || 'Unknown provider error').slice(0,2000);
  for (const value of [process.env.SUPABASE_ACCESS_TOKEN,process.env.BREVO_SMTP_KEY,process.env.BREVO_SMTP_LOGIN]) {
    if (value) txt = txt.replaceAll(value,'[REDACTED]');
  }
  return txt;
}

const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  const cfg = makeConfig({
    SUPABASE_ACCESS_TOKEN:'fake-supabase-token',
    BREVO_SMTP_LOGIN:'fake-login@smtp-brevo.com',
    BREVO_SMTP_KEY:'fake-brevo-key',
    PLUX_SENDER_EMAIL:'no-reply@plux.example',
  });
  assert.equal(cfg.smtp_host,'smtp-relay.brevo.com');
  assert.equal(cfg.smtp_port,'587');
  assert.equal(cfg.mailer_autoconfirm,false);
  assert.equal(cfg.smtp_sender_name,'PLUX');
  assert.throws(()=>makeConfig({}),/Missing GitHub Actions secrets/);
  assert.throws(()=>makeConfig({
    SUPABASE_ACCESS_TOKEN:'a',BREVO_SMTP_LOGIN:'b',BREVO_SMTP_KEY:'c',
    PLUX_SENDER_EMAIL:'plux@gmail.com'
  }),/not a free mailbox/);
  console.log('PLUX_SMTP_DRY_RUN_PASS: payload validated; no network request; no secrets printed.');
} else {
  const cfg = makeConfig(process.env);
  const response = await fetch(root+'/'+project+'/config/auth',{
    method:'PATCH',
    headers: {
      'Authorization':'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,
      'Content-Type':'application/json',
    },
    body: JSON.stringify(cfg),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const message = await response.text().catch(()=>null);
    throw new Error('Supabase SMTP configuration FAILED (HTTP '+response.status+'). '+sanitizeError(message));
  }
  console.log('PLUX_SMTP_CONFIGURED: Supabase accepted custom SMTP settings.');
  console.log('Next verify a real signup email and Brevo transactional email logs.');
}
