import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm text-muted mb-2">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-surface text-ink px-4 py-3.5 text-base outline-none border transition-colors",
            "placeholder:text-muted",
            "focus:border-ink focus:ring-2 focus:ring-ink/10",
            error ? "border-danger" : "border-transparent",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className="text-danger text-xs mt-1">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
