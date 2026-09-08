"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface FormFieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

export interface FormFieldProps {
  label: React.ReactNode;
  /**
   * Render prop. Receives the wired-up id and aria attributes — spread them
   * onto your input/select so label, hint and error are announced correctly.
   */
  children: (props: FormFieldControlProps) => React.ReactNode;
  /** Explicit id. One is generated when omitted. */
  id?: string;
  hint?: React.ReactNode;
  /** When set, replaces the hint and marks the control invalid. */
  error?: React.ReactNode;
  required?: boolean;
  /** Right-aligned affordance next to the label, e.g. a unit toggle. */
  labelAction?: React.ReactNode;
  className?: string;
}

/**
 * Label + control + hint + error, wired for accessibility.
 *
 * The child is a render prop so any control (native input, shadcn Select, a
 * custom combobox) can receive the generated id without this wrapper needing
 * to know what it is.
 */
export function FormField({
  label,
  children,
  id,
  hint,
  error,
  required,
  labelAction,
  className,
}: FormFieldProps) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs font-medium text-ink-secondary">
          {label}
          {required && (
            <span className="ml-0.5 text-negative" aria-hidden>
              *
            </span>
          )}
        </label>
        {labelAction}
      </div>

      {children({
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}

      {error ? (
        <p id={errorId} className="text-xs text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Bare input styled to the system. Optional — any control works inside
 * FormField — but this keeps single-line text/number fields consistent.
 */
export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(function TextInput({ className, type, ...rest }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "app-focus h-9 w-full rounded-md border border-hairline-strong bg-surface-sunken px-3 text-sm text-ink",
        "placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200 aria-[invalid=true]:border-negative",
        type === "number" && "tnum",
        className
      )}
      {...rest}
    />
  );
});
