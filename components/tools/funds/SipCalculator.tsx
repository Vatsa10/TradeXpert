"use client";

import { ActionButton } from "@/components/app/ActionButton";
import {
  FormField,
  Money,
  NumberValue,
  Panel,
  Percent,
  StatCard,
  StatGrid,
  TextInput,
} from "@/components/system";

export interface SipResult {
  totalInvested: number;
  units: number;
  currentValue: number;
  absoluteReturnPct: number;
  installments: number;
}

export function SipCalculator({
  amount,
  months,
  setAmount,
  setMonths,
  onSubmit,
  loading,
  result,
}: {
  amount: string;
  months: string;
  setAmount: (value: string) => void;
  setMonths: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  result: SipResult | null;
}) {
  return (
    <Panel
      title="SIP calculator"
      description="Modelled against this scheme's actual NAV history."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField id="sip-amount" label="Monthly amount (₹)" className="flex-1">
          {(props) => (
            <TextInput
              {...props}
              type="number"
              min={1}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
        </FormField>

        <FormField id="sip-months" label="Duration (months)" className="flex-1">
          {(props) => (
            <TextInput
              {...props}
              type="number"
              min={1}
              step={1}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          )}
        </FormField>

        <ActionButton type="submit" variant="brand" loading={loading} className="sm:w-auto">
          Calculate
        </ActionButton>
      </form>

      {result && (
        <StatGrid columns={3} className="mt-5">
          <StatCard
            index={0}
            label="Invested"
            value={<Money value={result.totalInvested} currency="INR" digits={0} />}
            hint={`${result.installments} installments`}
          />
          <StatCard
            index={1}
            label="Current value"
            value={<Money value={result.currentValue} currency="INR" digits={0} />}
            hint={
              <>
                <NumberValue value={result.units} digits={3} /> units
              </>
            }
          />
          <StatCard
            index={2}
            label="Absolute return"
            value={<Percent value={result.absoluteReturnPct} colored signed />}
            hint={
              <>
                <Money
                  value={result.currentValue - result.totalInvested}
                  currency="INR"
                  digits={0}
                  colored
                  signed
                />{" "}
                gain
              </>
            }
          />
        </StatGrid>
      )}
    </Panel>
  );
}
