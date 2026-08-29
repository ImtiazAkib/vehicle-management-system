import nodemailer from 'nodemailer';

import { env } from '@/env/server';

import { createLoggerWithContext } from '@/lib/logger';

import type { MailDriver, MailMessage } from './mail.types';
import type { Transporter } from 'nodemailer';

const log = createLoggerWithContext('mail.smtp');

/*
  Built once and reused. Nodemailer pools connections per transporter, so creating one per message would
  open a new TCP and TLS handshake for every order confirmation.

  Lazily, though: the module is imported wherever `lib/mail` is, including on requests that never send
  anything, and a transporter built at import time would connect on a page render that had no business
  talking to a mail server.
*/
let transporter: Transporter | null = null;

function resolveTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Implicit TLS on 465, STARTTLS upgrade on 587 — the port decides, as it does everywhere.
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASSWORD ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });

  return transporter;
}

/**
 * Sends over SMTP, which is what makes this work with anything — a provider's relay, an institutional
 * account, a departmental mail server — without a third-party API key. The interface is one method, so
 * swapping to an HTTP API later is a new file and one line in `index.ts`.
 */
export const smtpMail: MailDriver = {
  async send(message: MailMessage): Promise<boolean> {
    try {
      await resolveTransporter().sendMail({
        from: env.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return true;
    } catch (error) {
      /*
        Logged and reported, never thrown. An order that has already settled must not be undone because
        a mail server was briefly unreachable — the caller logs the false and keeps the paid order,
        which is a far better outcome than reversing a payment over a transient SMTP hiccup.

        The error alone is logged — not the recipient or the subject. The subject names an order id and
        the recipient is an address; over a run of transient failures those accumulate into a log of who
        bought what. The `err` is enough to diagnose an SMTP problem.
      */
      log.error({ err: error }, 'Sending mail failed');

      return false;
    }
  },
};
