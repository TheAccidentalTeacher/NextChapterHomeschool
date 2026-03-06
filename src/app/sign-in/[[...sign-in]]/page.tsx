// ============================================
// Sign-In Page — Clerk authentication
// If user is already signed in, auto-redirects
// to /dashboard (middleware handles role routing).
// ============================================

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage() {
  // If already authenticated, skip sign-in and go to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-stone-900 border border-stone-700",
          },
        }}
      />
    </main>
  );
}
