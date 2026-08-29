import { APP_DATA } from '@/constants/app-data.const';

import type { MailMessage } from './mail.types';

/**
 * Wrap a body in the one piece of chrome every message shares.
 *
 * Inline styles and a table-free layout on purpose: an email client is not a browser, and a stylesheet it
 * strips leaves the message unreadable. Plain enough to survive one.
 */
function wrap(heading: string, body: string): string {
  return [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#191c2b;max-width:34rem">',
    `<h1 style="font-size:1.25rem;margin:0 0 1rem">${heading}</h1>`,
    body,
    `<p style="margin:2rem 0 0;font-size:0.8rem;color:#666c85">${APP_DATA.NAME}</p>`,
    '</div>',
  ].join('');
}

/**
 * Escape text destined for an HTML body. The name is whatever somebody typed into a form, so every
 * interpolated value is escaped rather than trusted — "it is only an email" is how injection gets a
 * foothold, and this message lands in the recipient's own inbox.
 */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type VerificationInput = {
  to: string;
  name: string;
  verifyUrl: string;
};

/**
 * The one message registration sends: prove the address. It carries the link and a plain reason to follow
 * it. The closing line is for the other reader — somebody whose address was typed into a stranger's
 * registration by mistake — for whom ignoring the message is genuinely enough.
 */
export function buildVerificationEmail({ to, name, verifyUrl }: VerificationInput): MailMessage {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verifyUrl);

  return {
    to,
    subject: `Confirm your email address — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      'Confirm this address to finish creating your account. Once it is confirmed you can sign in.',
      '',
      verifyUrl,
      '',
      'The link works once and expires in a day. If you did not create an account, ignore this message — nothing was created in your name that can be used.',
    ].join('\n'),
    html: wrap(
      'Confirm your email address',
      [
        `<p>Hello ${safeName},</p>`,
        '<p>Confirm this address to finish creating your account. Once it is confirmed you can sign in.</p>',
        `<p><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none">Confirm my address</a></p>`,
        `<p style="font-size:0.85rem;color:#666c85">Or paste this into your browser:<br>${safeUrl}</p>`,
        '<p style="font-size:0.85rem;color:#666c85">The link works once and expires in a day. If you did not create an account, ignore this message.</p>',
      ].join('')
    ),
  };
}

type AlreadyRegisteredInput = {
  to: string;
  name: string;
};

/**
 * What a taken address gets instead of a second verification link. Registration answers "check your inbox"
 * whether or not the address is already an account, so nobody can probe which addresses are registered —
 * and this is the inbox message the existing owner finds. It carries no token and no link that grants
 * anything.
 */
export function buildAlreadyRegisteredEmail({ to, name }: AlreadyRegisteredInput): MailMessage {
  const safeName = escapeHtml(name);

  return {
    to,
    subject: `You already have an account — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      `Someone just tried to create a ${APP_DATA.SHORT_NAME} account with this email address, but you already have one.`,
      '',
      'If that was you, there is nothing to do — just sign in. If you have forgotten your password, reset it from the sign-in page.',
      '',
      'If it was not you, you can safely ignore this message. Your account has not changed, and no new account was created.',
    ].join('\n'),
    html: wrap(
      'You already have an account',
      [
        `<p>Hello ${safeName},</p>`,
        `<p>Someone just tried to create a ${APP_DATA.SHORT_NAME} account with this email address, but you already have one.</p>`,
        '<p>If that was you, there is nothing to do — just sign in. If you have forgotten your password, reset it from the sign-in page.</p>',
        '<p style="font-size:0.85rem;color:#666c85">If it was not you, you can safely ignore this message. Your account has not changed.</p>',
      ].join('')
    ),
  };
}

type PasswordResetInput = {
  to: string;
  name: string;
  resetUrl: string;
};

/**
 * The link that lets somebody set a new password. Sent only to an address that has an account, and the
 * request page answers the same "check your inbox" whether or not it does, so the message is not a probe.
 * Following it does nothing until a new password is submitted with it.
 */
export function buildPasswordResetEmail({ to, name, resetUrl }: PasswordResetInput): MailMessage {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  return {
    to,
    subject: `Reset your password — ${APP_DATA.SHORT_NAME}`,
    text: [
      `Hello ${name},`,
      '',
      'Use this link to set a new password for your account:',
      '',
      resetUrl,
      '',
      'The link works once and expires in a day. If you did not ask to reset your password, ignore this message — your password will not change.',
    ].join('\n'),
    html: wrap(
      'Reset your password',
      [
        `<p>Hello ${safeName},</p>`,
        '<p>Use this link to set a new password for your account.</p>',
        `<p><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none">Set a new password</a></p>`,
        `<p style="font-size:0.85rem;color:#666c85">Or paste this into your browser:<br>${safeUrl}</p>`,
        '<p style="font-size:0.85rem;color:#666c85">The link works once and expires in a day. If you did not ask to reset your password, ignore this message.</p>',
      ].join('')
    ),
  };
}
