"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginWithEmail } from "@/lib/privy/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, "6-digit code") });

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });

  async function onEmailSubmit({ email }: EmailForm) {
    setSubmitting(true);
    setServerError(null);
    try {
      await sendCode({ email });
      setEmail(email);
      setStep("code");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCodeSubmit({ code }: CodeForm) {
    setSubmitting(true);
    setServerError(null);
    try {
      await loginWithCode({ code });
      const onboarded = typeof window !== "undefined" && localStorage.getItem("oasis-onboarded") === "1";
      router.replace(onboarded ? "/dashboard" : "/onboarding");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-ink">Welcome to Oasis</h1>
        <p className="text-muted text-sm">
          {step === "email" ? "We'll email you a 6-digit code." : `Sent to ${email}`}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />
          {serverError && <p className="text-danger text-xs">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Continue"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="------"
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-[0.5em]"
            error={codeForm.formState.errors.code?.message}
            {...codeForm.register("code")}
          />
          {serverError && <p className="text-danger text-xs">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Verifying..." : "Verify"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-muted text-sm py-2 hover:text-ink"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
