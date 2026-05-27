import { connectToDatabase } from "@/database/mongoose";
import { UserModel } from "@/models/user";
import { verifyAuthSession } from "@/server/auth/session";
import { toAuthenticatedUser } from "@/server/auth/user-serializer";
import type { AuthenticatedUser } from "@/types/auth";

// This helper reads the secure session cookie, verifies it, and then loads the current user from MongoDB.
// It gives the rest of the backend one reusable way to resolve the active account.
export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await verifyAuthSession();

  if (!session) {
    return null;
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ firebaseUid: session.uid });

  if (!user) {
    return null;
  }

  return toAuthenticatedUser(user);
}