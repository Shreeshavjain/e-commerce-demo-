import { AuthScene } from "@/components/auth/auth-scene";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <AuthScene
        autoOpenModal
        compact
        title="Sign in to continue"
        description="Open the phone OTP modal, verify the code with Firebase, and let the backend create the session cookie for you."
      />
    </main>
  );
}