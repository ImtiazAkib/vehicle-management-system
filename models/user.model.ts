import bcrypt from 'bcryptjs';
import mongoose, { Model, Schema, Types } from 'mongoose';

import { UserRole } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

const PASSWORD_SALT_ROUNDS = 12;

export type UserAttributes = {
  name: string;
  email: string;
  /** bcrypt hash at rest. select:false. */
  password: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  pendingEmail?: string;
  pendingEmailTokenHash?: string;
  pendingEmailExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserEntity = UserAttributes & { _id: Types.ObjectId };

type UserMethods = { comparePassword(candidate: string): Promise<boolean> };
type UserModel = Model<UserAttributes, object, UserMethods>;

const userSchema = new Schema<UserAttributes, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: Object.values(USER_ROLES) },
    isApproved: { type: Boolean, required: true, default: false },
    isActive: { type: Boolean, required: true, default: true },
    emailVerified: { type: Boolean, required: true, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date },
    pendingEmail: { type: String, lowercase: true, trim: true, maxlength: 255 },
    pendingEmailTokenHash: { type: String, select: false },
    pendingEmailExpiresAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date },
    phone: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUNDS);
});

userSchema.method('comparePassword', async function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
});

// Exactly one super administrator — enforced by a partial unique index, not a service check.
userSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: USER_ROLES.SUPER_ADMIN } });

export const User = (mongoose.models.User as UserModel) ?? mongoose.model<UserAttributes, UserModel>('User', userSchema);
