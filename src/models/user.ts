import { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { getModel } from "@/database/model";
import { authProviders, type UserRole, userRoles } from "@/models/constants";
import { addressSchema, type Address } from "@/models/shared";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    image: { type: String, default: "", trim: true },
    // Phone numbers should be stored in a normalized format such as E.164 so one phone number maps to one account.
    phoneNumber: { type: String, trim: true, unique: true, sparse: true, index: true },
    firebaseUid: { type: String, trim: true, unique: true, sparse: true, index: true },
    googleId: { type: String, trim: true, index: true, sparse: true },
    // The provider shows how the account was created or last linked: Google or OTP.
    authProvider: { type: String, enum: authProviders, default: "otp" },
    // OTP and Google users can both still have a verified account state.
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    // Roles let the same user model support customers, staff, admins, and future super-admin access.
    role: { type: String, enum: userRoles, default: "customer" },
    // Wishlist data lives here so the customer account can support saved items without another collection.
    wishlistProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    // Saved addresses make checkout faster and are reusable for future order placement flows.
    savedAddresses: { type: [addressSchema], default: [] },
    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export type User = InferSchemaType<typeof userSchema> & {
  role: UserRole;
  savedAddresses: Address[];
};

export type UserDocument = HydratedDocument<User>;

export const UserModel = getModel<User>("User", userSchema);