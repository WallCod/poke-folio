import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type PlanId = 'free' | 'treinador' | 'mestre';
export type PlanStatus = 'active' | 'overdue' | 'suspended';
export type Role = 'user' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  plan: PlanId;
  planStatus: PlanStatus;
  planExpiry: Date | null;
  cards: number;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [2, 'Nome deve ter ao menos 2 caracteres'],
      maxlength: [80, 'Nome muito longo'],
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter ao menos 6 caracteres'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'treinador', 'mestre'],
      default: 'free',
    },
    planStatus: {
      type: String,
      enum: ['active', 'overdue', 'suspended'],
      default: 'active',
    },
    planExpiry: {
      type: Date,
      default: null,
    },
    cards: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash antes de salvar
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
