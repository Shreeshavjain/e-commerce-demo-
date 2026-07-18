import { AuthScene } from "@/components/auth/auth-scene";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <AuthScene
        title="A clean, refresh-safe auth foundation for the storefront"
        description="Phone OTP is handled in Firebase, verified on the backend, and stored as a secure cookie session that the frontend restores automatically on every load."
      />
    </main>
  );
}
