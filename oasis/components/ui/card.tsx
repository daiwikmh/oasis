import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "cream" | "dark" | "lime" | "white";

const toneStyles: Record<Tone, string> = {
  cream: "bg-surface text-ink",
  dark: "bg-ink text-inverse",
  lime: "bg-lime text-ink",
  white: "bg-white text-ink",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = "cream", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl p-5", toneStyles[tone], className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold leading-none", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-3", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";
