import { connectToDatabase } from "@/database/mongoose";
import { UserModel } from "@/models/user";
import type { AuthenticatedUser, VerifiedFirebaseToken } from "@/types/auth";

type SyncUserInput = {
  token: VerifiedFirebaseToken;
  displayName?: string | null;
};

function toAuthenticatedUser(user: Awaited<ReturnType<typeof UserModel.findOne>>): AuthenticatedUser {
  if (!user) {
    throw new Error("User could not be loaded");
  }

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

// The sync flow keeps one account per phone number: we look up the phone first, then create a new user only if none exists.
// This lets existing users log in directly after OTP verification while new users complete name capture once and then get an account automatically.
export async function syncFirebaseUser({ token, displayName }: SyncUserInput): Promise<{ user: AuthenticatedUser; isNewUser: boolean }> {
  await connectToDatabase();

  const normalizedPhone = token.phoneNumber?.trim() ?? null;
  const firebaseUid = token.uid.trim();

  if (!normalizedPhone && !token.email) {
    throw new Error("A verified Firebase token must contain a phone number or email");
  }

  const lookupConditions: Array<Record<string, unknown>> = [];

  if (normalizedPhone) {
    lookupConditions.push({ phoneNumber: normalizedPhone });
  }

  lookupConditions.push({ firebaseUid });

  if (token.email) {
    lookupConditions.push({ email: token.email.toLowerCase() });
  }

  const existingUser = await UserModel.findOne({
    $or: lookupConditions,
  });

  if (existingUser) {
    existingUser.firebaseUid = firebaseUid;
    existingUser.authProvider = token.provider;
    existingUser.lastLoginAt = new Date();

    if (normalizedPhone && !existingUser.phoneNumber) {
      existingUser.phoneNumber = normalizedPhone;
      existingUser.isPhoneVerified = true;
    }

    if (token.email && !existingUser.email) {
      existingUser.email = token.email.toLowerCase();
    }

    if (token.name && !existingUser.name) {
      existingUser.name = token.name;
    }

    if (token.picture && !existingUser.image) {
      existingUser.image = token.picture;
    }

    await existingUser.save();

    return {
      user: toAuthenticatedUser(existingUser),
      isNewUser: false,
    };
  }

  const name = displayName?.trim() || token.name?.trim() || "Customer";

  const createdUser = await UserModel.create({
    name,
    email: token.email?.toLowerCase() ?? `${firebaseUid}@placeholder.local`,
    image: token.picture ?? "",
    phoneNumber: normalizedPhone ?? undefined,
    firebaseUid,
    authProvider: token.provider,
    isPhoneVerified: Boolean(normalizedPhone),
    isEmailVerified: Boolean(token.email),
    lastLoginAt: new Date(),
  });

  return {
    user: toAuthenticatedUser(createdUser),
    isNewUser: true,
  };
}