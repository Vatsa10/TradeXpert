"use client";

import { Play } from "lucide-react";

import { ActionButton } from "@/components/app/ActionButton";
import { FormField, Panel, TextInput } from "@/components/system";

export interface DcfForm {
  currentFCF: string;
  sharesOutstanding: string;
  netDebt: string;
  beta: string;
  debtToEquity: string;
  growth1: string;
  growth2: string;
  currentPrice: string;
}

export type DcfField = keyof DcfForm;

const FIELDS: {
  key: DcfField;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: "currentFCF",
    label: "Current free cash flow",
    hint: "Latest annual FCF, absolute currency units",
    placeholder: "e.g. 25000000000",
  },
  {
    key: "sharesOutstanding",
    label: "Shares outstanding",
    hint: "Must be greater than zero",
    placeholder: "e.g. 4150000000",
  },
  {
    key: "netDebt",
    label: "Net debt",
    hint: "Total debt minus cash. Negative means net cash.",
    placeholder: "e.g. -120000000",
  },
  {
    key: "beta",
    label: "Beta",
    hint: "Clamped to 0.2–3.0 server-side. 1.0 is market-neutral.",
    placeholder: "1.0",
  },
  {
    key: "debtToEquity",
    label: "Debt / equity",
    hint: "0 uses cost of equity only as the discount rate",
    placeholder: "0",
  },
  {
    key: "currentPrice",
    label: "Current price (optional)",
    hint: "Enables upside/downside and colours the sensitivity grid",
    placeholder: "e.g. 1520",
  },
  {
    key: "growth1",
    label: "Growth years 1–5 (%)",
    hint: "India large-cap default ~12%",
    placeholder: "12",
  },
  {
    key: "growth2",
    label: "Growth years 6–10 (%)",
    hint: "India default ~6%, fading toward terminal",
    placeholder: "6",
  },
];

export function DcfAssumptions({
  form,
  onChange,
  onRun,
  running,
}: {
  form: DcfForm;
  onChange: (key: DcfField, value: string) => void;
  onRun: () => void;
  running: boolean;
}) {
  return (
    <Panel
      title="DCF assumptions"
      description="Auto-filled from reported statements where available. Every field is editable — India defaults are used for the macro constants (risk-free 7.0%, ERP 6.5%, terminal growth 4.0%, tax 25.17%)."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <FormField
            key={field.key}
            id={`dcf-${field.key}`}
            label={field.label}
            hint={field.hint}
          >
            {(props) => (
              <TextInput
                {...props}
                type="number"
                inputMode="decimal"
                value={form[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
          </FormField>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ActionButton
          variant="brand"
          onClick={onRun}
          loading={running}
          className="w-full sm:w-auto sm:px-6"
        >
          {!running && <Play aria-hidden />}
          {running ? "Running" : "Run DCF"}
        </ActionButton>
        <p className="text-xs text-ink-faint">
          Terminal growth must stay below the computed WACC or the model is undefined.
        </p>
      </div>
    </Panel>
  );
}
