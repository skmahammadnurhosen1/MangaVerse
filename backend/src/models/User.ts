import { Schema, model, Document } from 'mongoose';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Do not return by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);
