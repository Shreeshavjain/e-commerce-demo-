import type { AuthenticatedUser } from "@/types/auth";
import type { User } from "@/models/user";

type SerializableUser = Pick<User, "name" | "email" | "phoneNumber" | "image" | "role" | "isEmailVerified" | "isPhoneVerified"> & {
  _id: { toString(): string };
};

// Serializing the database model into a small auth payload keeps APIs lean and avoids leaking internal user fields.
export function toAuthenticatedUser(user: SerializableUser): AuthenticatedUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    image: user.image ?? "",
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  };
}