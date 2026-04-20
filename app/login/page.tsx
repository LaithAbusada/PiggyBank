"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/login/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "OAuth sign-in failed");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Purple with Image */}
      <div className="hidden md:flex md:w-1/2 flex-col bg-[#9B7EA4] relative">
        {/* Tabs - positioned to touch the right edge (color boundary) */}
        <div className="relative z-10 flex flex-col items-end mt-32">
          <Link
            href="/login"
            className="bg-[#d4c2d9] px-16 py-4 rounded-l-full text-2xl font-extrabold tracking-wide text-black uppercase cursor-pointer"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-16 py-4 text-2xl font-extrabold tracking-wide text-[#d4c2d9] uppercase mt-2 mr-4 cursor-pointer"
          >
            Sign Up
          </Link>
        </div>

        {/* Piggy Bank Image */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/piggybank-money.png"
            alt="Piggy bank with money"
            width={500}
            height={500}
            sizes="(max-width: 768px) 0px, 500px"
            quality={80}
            className="object-contain"
            priority
            fetchPriority="high"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col bg-white px-8 md:w-1/2">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-6 px-4">
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black cursor-pointer">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-4xl font-extrabold italic text-black">
            PiggyBank
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md">
            {/* Icon */}
            <div className="flex justify-center mb-10">
              <Image
                src="/piggybank-icon.webp"
                alt="PiggyBank logo"
                width={80}
                height={56}
                priority
                fetchPriority="high"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex items-center gap-3 border-b border-gray-300 pb-2">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent text-lg text-black outline-none placeholder:text-gray-500"
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-3 border-b border-gray-300 pb-2">
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent text-lg text-black outline-none placeholder:text-gray-500"
                />
              </div>

              {/* Forgot Password + Login Button */}
              <div className="flex items-center justify-between mt-2">
                <a
                  href="#"
                  className="text-sm font-bold text-[#a483a2] hover:underline"
                >
                  Forgot Password?
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#a483a2] px-8 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#8e6f8c] disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>

            {/* Social Login */}
            <div className="mt-16 flex items-center justify-center gap-6">
              <span className="text-sm font-bold text-[#a483a2]">
                Or Login with
              </span>
              <button
                onClick={() => handleOAuth("oauth_apple")}
                className="flex items-center gap-1.5 text-sm font-bold text-black hover:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </button>
              <button
                onClick={() => handleOAuth("oauth_google")}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
