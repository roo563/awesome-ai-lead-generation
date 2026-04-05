"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen luxury-bg flex items-center justify-center">
        <div className="luxury-overlay absolute inset-0" />
        <div className="relative z-10">
          <div className="w-12 h-12 border-2 border-[var(--color-gold-light)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen luxury-bg relative overflow-hidden">
      {/* Overlay */}
      <div className="luxury-overlay absolute inset-0 z-0" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 opacity-30">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          className="animate-pulse"
          style={{ animationDuration: "4s" }}
        >
          <path
            d="M100 20 C120 60, 180 80, 140 120 C100 160, 60 140, 80 100 C100 60, 40 40, 100 20Z"
            stroke="rgba(196,162,101,0.6)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M100 30 C130 50, 170 90, 130 130 C90 170, 50 130, 70 90 C90 50, 70 30, 100 30Z"
            stroke="rgba(196,162,101,0.4)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo / Brand */}
        <div className="mb-6">
          <span
            className="text-sm tracking-[0.3em] uppercase text-[var(--color-gold-light)] font-medium"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Profilio
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl text-center text-white leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          Your Business
          <br />
          <span className="italic">Analytics Hub</span>
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-px bg-[var(--color-gold-light)] opacity-60" />
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold-light)] opacity-40" />
          <div className="w-16 h-px bg-[var(--color-gold-light)] opacity-60" />
        </div>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-white/80 text-center max-w-lg mb-12"
          style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
        >
          Transform your Google Business Profile into a powerful, automated
          analytics dashboard.
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-luxury group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Features hint */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
          {[
            {
              title: "Live Analytics",
              desc: "Real-time metrics from your Google Business Profile",
            },
            {
              title: "Smart Charts",
              desc: "Beautiful visualizations powered by Nivo & Frappe",
            },
            {
              title: "Actionable Insights",
              desc: "Turn data into decisions with automated reports",
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <h3
                className="text-white/90 text-sm font-medium mb-2 tracking-wide"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-white/50 text-xs leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom brand */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <p
            className="text-white/30 text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Profilio Analytics
          </p>
        </div>
      </div>
    </main>
  );
}
