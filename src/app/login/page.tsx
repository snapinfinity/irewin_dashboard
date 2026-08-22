"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Briefcase, Building2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth/useAuth";
import type { SignInFailureReason } from "@/lib/auth/AuthProvider";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.89c2.28-2.1 3.56-5.2 3.56-8.74z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3c-1.08.73-2.46 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.11C3.23 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.3c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3V6.59H1.25A11.98 11.98 0 000 12c0 1.93.46 3.76 1.25 5.41z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.3 0 3.23 2.7 1.25 6.59l4.02 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: Briefcase, label: "Publish and manage job listings in one place" },
  { icon: Tag, label: "Organize openings by category and subcategory" },
  { icon: Building2, label: "Keep every company profile and logo up to date" },
];

const credentialsSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type CredentialsValues = z.infer<typeof credentialsSchema>;

const resetSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
type ResetValues = z.infer<typeof resetSchema>;

export default function LoginPage() {
  const { user, isAdmin, loading, signInWithGoogle, signInWithEmailPassword, sendPasswordReset } = useAuth();
  const [signingInGoogle, setSigningInGoogle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<SignInFailureReason | null>(null);
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const credentialsForm = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, user, isAdmin, router]);

  async function handleGoogleSignIn() {
    setSigningInGoogle(true);
    setFailure(null);
    try {
      const { authorized, reason } = await signInWithGoogle();
      if (!authorized) {
        setFailure(reason ?? "not-admin");
      } else {
        router.replace("/admin");
      }
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setSigningInGoogle(false);
    }
  }

  async function handleCredentialsSignIn(values: CredentialsValues) {
    setSubmitting(true);
    setFailure(null);
    try {
      const { authorized, reason } = await signInWithEmailPassword(values.email, values.password);
      if (!authorized) {
        setFailure(reason ?? "not-admin");
      } else {
        router.replace("/admin");
      }
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetRequest(values: ResetValues) {
    setSubmitting(true);
    try {
      await sendPasswordReset(values.email);
      setResetSent(true);
    } catch {
      toast.error("Couldn't send reset email. Check the address and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 10%, rgba(255,255,255,0.16), transparent), radial-gradient(50% 45% at 90% 90%, rgba(255,255,255,0.14), transparent)",
          }}
        />
        <div className="relative flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
            <Briefcase className="size-4" />
          </div>
          IREWIN
        </div>

        <div className="relative flex flex-col gap-8">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Manage every job listing from one clean dashboard.
          </h1>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <feature.icon className="size-4" />
                </div>
                <span className="text-sm text-primary-foreground/90">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          &copy; {new Date().getFullYear()} IREWIN. Admin access only.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden">
              <Briefcase className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Reset your password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in with an authorized account to manage job listings."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {failure === "not-admin" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Not authorized</AlertTitle>
              <AlertDescription>
                This account is not registered as an admin. Contact an existing
                admin to be added.
              </AlertDescription>
            </Alert>
          )}

          {failure === "rules-blocked" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Firestore rules are blocking sign-in</AlertTitle>
              <AlertDescription>
                You signed in successfully, but Firestore refused to return your
                admin record. This usually means the project&apos;s security
                rules haven&apos;t been deployed yet — deploy{" "}
                <code>firestore.rules</code> and try again.
              </AlertDescription>
            </Alert>
          )}

          {mode === "signin" ? (
            <div className="flex flex-col gap-4">
              <Form {...credentialsForm}>
                <form
                  onSubmit={credentialsForm.handleSubmit(handleCredentialsSignIn)}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={credentialsForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={credentialsForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => {
                              setFailure(null);
                              setMode("reset");
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Sign in
                  </Button>
                </form>
              </Form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                onClick={handleGoogleSignIn}
                disabled={signingInGoogle}
                variant="outline"
                size="lg"
                className="w-full gap-2.5 bg-card"
              >
                {signingInGoogle ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                Sign in with Google
              </Button>
            </div>
          ) : resetSent ? (
            <div className="flex flex-col gap-4">
              <Alert>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  If an account exists for that address, a password reset link is on its way.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  setMode("signin");
                  setResetSent(false);
                  resetForm.reset();
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetRequest)} className="flex flex-col gap-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Send reset link
                </Button>
                <Button type="button" variant="ghost" size="lg" className="w-full" onClick={() => setMode("signin")}>
                  Back to sign in
                </Button>
              </form>
            </Form>
          )}
        </div>
      </section>
    </main>
  );
}
