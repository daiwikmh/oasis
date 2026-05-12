"use client";

import { Send, QrCode, ArrowLeftRight, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type Action = {
  key: string;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "ghost";
};

interface QuickActionsProps {
  onSend: () => void;
  onReceive: () => void;
}

export function QuickActions({ onSend, onReceive }: QuickActionsProps) {
  const router = useRouter();
  const actions: Action[] = [
    { key: "send",    label: "Send",    Icon: Send,           onClick: onSend,    variant: "primary" },
    { key: "receive", label: "Receive", Icon: QrCode,         onClick: onReceive },
    { key: "swap",    label: "Swap",    Icon: ArrowLeftRight, onClick: () => router.push("/swap") },
    { key: "more",    label: "More",    Icon: MoreHorizontal, onClick: () => router.push("/profile") },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ key, label, Icon, onClick, variant }) => (
        <button
          key={key}
          onClick={onClick}
          className="flex flex-col items-center gap-1.5 group"
        >
          <span
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              variant === "primary"
                ? "bg-lime group-hover:bg-lime-strong"
                : "bg-surface group-hover:bg-canvas-alt"
            }`}
          >
            <Icon size={22} className="text-ink" />
          </span>
          <span className="text-xs text-muted">{label}</span>
        </button>
      ))}
    </div>
  );
}
