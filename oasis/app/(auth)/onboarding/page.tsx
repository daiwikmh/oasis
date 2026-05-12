"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Banknote, ArrowLeftRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Wallet,
    title: "Banking on stablecoin",
    body: "Spend, earn, and track PUSD anywhere — without the volatility.",
  },
  {
    Icon: Banknote,
    title: "Get paid in PUSD",
    body: "Receive payroll in stablecoin. No volatility, no waiting.",
  },
  {
    Icon: ArrowLeftRight,
    title: "Send, swap, and more",
    body: "All from one app. Self-custody. Every transaction is final.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="w-full max-w-md flex flex-col items-center text-center gap-8 py-12">
      <div className="bg-lime rounded-3xl w-64 h-64 flex items-center justify-center">
        <slide.Icon size={96} strokeWidth={1.5} className="text-ink" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-ink">{slide.title}</h1>
        <p className="text-muted text-base">{slide.body}</p>
      </div>
      <div className="flex gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${i === idx ? "bg-ink w-6" : "bg-ink/30 w-2"}`}
          />
        ))}
      </div>
      <div className="w-full flex flex-col gap-2">
        <Button
          onClick={() => {
            if (!isLast) {
              setIdx(idx + 1);
              return;
            }
            if (typeof window !== "undefined") {
              localStorage.setItem("oasis-onboarded", "1");
            }
            router.replace("/dashboard");
          }}
          className="w-full"
        >
          {isLast ? "Get started" : "Next"}
        </Button>
        {!isLast && (
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("oasis-onboarded", "1");
              }
              router.replace("/dashboard");
            }}
            className="text-muted text-sm py-2 hover:text-ink"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
