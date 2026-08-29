import bcrypt from 'bcryptjs';

import { env } from '@/env/server';
import { ServiceCenterProfile } from '@/models/service-center-profile.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { User } from '@/models/user.model';
import { UserDto, userFromEntity } from '@/types';

import { ABSENT_PASSWORD_HASH } from '@/constants/auth.const';
import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { createLoggerWithContext } from '@/lib/logger';
import { buildAlreadyRegisteredEmail, buildPasswordResetEmail, buildVerificationEmail, mail } from '@/lib/mail';
import type { MailMessage } from '@/lib/mail';
import { connectToDatabase } from '@/lib/mongodb';
import { EmptyResult, SingleResult, createError, emptyFailureWithError, emptySuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { RegistrationOutput } from '@/lib/schemas';
import { buildAbsoluteUrl } from '@/lib/utils';

import { generateVerificationToken, hashToken } from './token.hash';

import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('auth.service');

const AUTH = CODES.AUTH.USERS;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;
const DATABASE = CODES.DATABASE.USERS;

/*
  How long a verification or reset link stays good — a day. Long enough that a message sitting overnight
  still works, short enough that a link forwarded or logged long ago does not; and it is the number the
  email promises, so the two are kept together here.
*/
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Spend the same time refusing an address that has no account as one that has.
 *
 * @param candidate - The password as typed.
 *
 * @returns Always false — the point is what it costs, not what it says.
 */
async function compareAgainstAbsentPassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, ABSENT_PASSWORD_HASH);
}

export class AuthService {
  /**
   * Check an email and password, and report why they were refused.
   *
   * **The order matters.** The password is verified first, so account state — unverified, deactivated — is
   * only ever disclosed to somebody who has already proved they own the account. Reversing it would turn
   * this form into a way to ask "does this address have an account here".
   *
   * @param identifier - Email address, as typed.
   * @param password - Password as typed.
   *
   * @returns The user on success, or a failure carrying the reason.
   */
  public async verifyCredentials(identifier: string, password: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const identity = identifier.trim().toLowerCase();

      const user = await User.findOne({ email: identity }).select('+password');

      /*
        The comparison runs whether or not there is an account to compare against — returning early on a
        missing account would skip the ~200ms bcrypt spends, and a refusal that arrives sooner is a
        stopwatch answer to "does this address exist".
      */
      const matches = user ? await user.comparePassword(password) : await compareAgainstAbsentPassword(password);

      if (!user || !matches) {
        return this.invalidCredentials();
      }

      if (!user.isActive) {
        return singleFailure(createError(AUTH.ACCOUNT_DEACTIVATED.CODE, AUTH.ACCOUNT_DEACTIVATED.MESSAGE));
      }

      if (!user.emailVerified) {
        return singleFailure(createError(AUTH.EMAIL_NOT_VERIFIED.CODE, AUTH.EMAIL_NOT_VERIFIED.MESSAGE));
      }

      if (!user.isApproved) {
        return singleFailure(createError(AUTH.ACCOUNT_NOT_APPROVED.CODE, AUTH.ACCOUNT_NOT_APPROVED.MESSAGE));
      }

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      // The identifier is somebody's email address and is never logged.
      log.error({ err: error }, 'Credential verification failed');

      return singleFailure(createError(AUTH.SIGN_IN_FAILED.CODE, AUTH.SIGN_IN_FAILED.MESSAGE));
    }
  }

  /**
   * Register a business account — owner, service center or supplier — and mail the link that proves its
   * address.
   *
   * The role comes from a closed literal, `isApproved` is set true (a business account is usable once its
   * address is proven; a service center and supplier still cannot transact until an administrator verifies
   * their profile), and `emailVerified` is false until the link is followed. None is a free-form field.
   *
   * A service center and a supplier also get their profile row, unverified. The answer is the same whether
   * or not the address is already taken — a taken one is mailed an "you already have an account" message
   * rather than a second live link — so registration cannot be read as a probe for which addresses exist.
   *
   * @param input - Validated registration for one of the three business roles.
   *
   * @returns Empty success on both the created and the already-taken branch; a failure only when the write
   *   refused.
   */
  public async register(input: RegistrationOutput): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const email = input.email.trim().toLowerCase();

      const existing = await User.findOne({ email }).lean<UserEntity | null>();

      if (existing) {
        await this.sendQuietly(buildAlreadyRegisteredEmail({ to: existing.email, name: existing.name }), 'already-registered');

        return emptySuccess();
      }

      const { raw, hash } = generateVerificationToken();

      const user = await User.create({
        name: input.name,
        email,
        // Handed over in plaintext and hashed by the model's pre-save hook, so this method cannot forget to.
        password: input.password,
        role: input.role,
        isApproved: true,
        emailVerified: false,
        phone: input.phone,
        emailVerificationTokenHash: hash,
        emailVerificationExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
      });

      if (input.role === USER_ROLES.SERVICE_CENTER) {
        await ServiceCenterProfile.create({
          user: user._id,
          centerName: input.centerName,
          address: input.address,
          city: input.city,
          phone: input.phone,
          isVerified: false,
        });
      } else if (input.role === USER_ROLES.SUPPLIER) {
        await SupplierProfile.create({
          user: user._id,
          businessName: input.businessName,
          address: input.address,
          city: input.city,
          phone: input.phone,
          isVerified: false,
        });
      }

      await this.sendQuietly(buildVerificationEmail({ to: user.email, name: user.name, verifyUrl: this.buildVerifyUrl(raw) }), 'verification');

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Registration failed');

      return emptyFailureWithError(createError(BUSINESS.REGISTRATION_FAILED.CODE, BUSINESS.REGISTRATION_FAILED.MESSAGE));
    }
  }

  /**
   * Prove an address from the token in its link. Looked up by hash — the raw is never stored — and cleared
   * on success, which is what makes the link single-use.
   *
   * @param token - Raw token from the link.
   *
   * @returns The verified account, or a failure naming the link's problem.
   */
  public async verifyEmail(token: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ emailVerificationTokenHash: hashToken(token) }).select(
        '+emailVerificationTokenHash +emailVerificationExpiresAt'
      );

      if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
        return this.invalidOrExpiredToken();
      }

      user.set({
        emailVerified: true,
        emailVerificationTokenHash: undefined,
        emailVerificationExpiresAt: undefined,
      });

      await user.save();

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Email verification failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Send a fresh verification link to an address that still needs one. Returns the same empty success
   * whatever is true of the address, and only an existing, still-unverified account actually mails.
   *
   * @param email - Address as typed.
   *
   * @returns Empty success, always.
   */
  public async resendVerification(email: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: email.trim().toLowerCase() });

      if (user && !user.emailVerified) {
        const { raw, hash } = generateVerificationToken();

        user.set({
          emailVerificationTokenHash: hash,
          emailVerificationExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
        });

        await user.save();

        await this.sendQuietly(buildVerificationEmail({ to: user.email, name: user.name, verifyUrl: this.buildVerifyUrl(raw) }), 'verification');
      }

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Resending a verification link failed');

      return emptySuccess();
    }
  }

  /**
   * Mail a password-reset link to an address that has an active account. Returns the same neutral success
   * whatever is true of the address, so the request page is not a probe.
   *
   * @param email - Address as typed.
   *
   * @returns Empty success, always.
   */
  public async issuePasswordReset(email: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: email.trim().toLowerCase() });

      if (user && user.isActive) {
        const { raw, hash } = generateVerificationToken();

        user.set({
          passwordResetTokenHash: hash,
          passwordResetExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
        });

        await user.save();

        await this.sendQuietly(buildPasswordResetEmail({ to: user.email, name: user.name, resetUrl: this.buildResetUrl(raw) }), 'password-reset');
      }

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Issuing a password reset failed');

      return emptySuccess();
    }
  }

  /**
   * Set a new password from a reset token. The token is single-use — cleared as the password is written —
   * so a link that leaks afterwards opens nothing.
   *
   * @param token - Raw reset token from the link.
   * @param newPassword - The new password, already length-validated by the schema.
   *
   * @returns Empty success, or a failure naming the link's problem.
   */
  public async resetPassword(token: string, newPassword: string): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ passwordResetTokenHash: hashToken(token) }).select(
        '+passwordResetTokenHash +passwordResetExpiresAt +password'
      );

      if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
        return emptyFailureWithError(createError(VALIDATION.INVALID_OR_EXPIRED_TOKEN.CODE, VALIDATION.INVALID_OR_EXPIRED_TOKEN.MESSAGE));
      }

      // The pre-save hook hashes the new password; the reset fields are cleared so the link is spent.
      user.set({
        password: newPassword,
        passwordResetTokenHash: undefined,
        passwordResetExpiresAt: undefined,
      });

      await user.save();

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Password reset failed');

      return emptyFailureWithError(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  private buildVerifyUrl(raw: string): string {
    return buildAbsoluteUrl(env.APP_BASE_URL, `${ROUTES.VERIFY_EMAIL.HREF}?token=${raw}`);
  }

  private buildResetUrl(raw: string): string {
    return buildAbsoluteUrl(env.APP_BASE_URL, `${ROUTES.RESET_PASSWORD.HREF}?token=${raw}`);
  }

  private async sendQuietly(message: MailMessage, kind: string): Promise<void> {
    try {
      const sent = await mail.send(message);

      if (!sent) {
        log.warn({ kind }, 'Account email was not sent');
      }
    } catch (error) {
      log.error({ err: error, kind }, 'Sending an account email threw');
    }
  }

  private invalidCredentials(): SingleResult<UserDto> {
    return singleFailure(createError(AUTH.INVALID_CREDENTIALS.CODE, AUTH.INVALID_CREDENTIALS.MESSAGE));
  }

  private invalidOrExpiredToken(): SingleResult<UserDto> {
    return singleFailure(createError(VALIDATION.INVALID_OR_EXPIRED_TOKEN.CODE, VALIDATION.INVALID_OR_EXPIRED_TOKEN.MESSAGE));
  }
}
