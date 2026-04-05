"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; description: string }> = {
    OAuthCallback: {
      title: "Authentication Failed",
      description: "There was a problem completing the sign-in process. Please try again.",
    },
    OAuthSignin: {
      title: "Sign-In Error",
      description: "Could not initiate the sign-in process. Please check your connection and try again.",
    },
    OAuthAccountNotLinked: {
      title: "Account Not Linked",
      description: "This email is already associated with another account. Please sign in with the original provider.",
    },
    default: {
      title: "Authentication Error",
      description: "An unexpected error occurred during authentication. Please try again or contact support.",
    },
  };

  const errorInfo = errorMessages[error || "default"] || errorMessages.default;

  return (
    <main className="min-h-screen luxury-bg relative overflow-hidden flex items-center justify-center">
      <div className="luxury-overlay absolute inset-0 z-0" />
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100/50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h1
            className="text-2xl mb-3 text-[var(--color-dark-brown)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {errorInfo.title}
          </h1>

          <p className="text-sm text-[var(--color-medium-brown)] mb-6 leading-relaxed">
            {errorInfo.description}
          </p>

          {error && (
            <p className="text-xs text-[var(--color-light-brown)] mb-6 px-4 py-2 bg-[var(--color-warm-beige)]/30 rounded-lg">
              Error code: {error}
            </p>
          )}

          <Link
            href="/"
            className="btn-luxury inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <p className="text-center mt-6 text-xs text-white/30 tracking-widest uppercase">
          Profilio Analytics
        </p>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen luxury-bg flex items-center justify-center">
        <div className="luxury-overlay absolute inset-0" />
        <div className="relative z-10 w-12 h-12 border-2 border-[var(--color-gold-light)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
