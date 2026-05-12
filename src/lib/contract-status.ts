import type { Contract } from "@/types/domain";
import type { Payment } from "@/types/domain";

interface ResolveContractStatusInput {
  outstandingBalance: number;
  projectedInterestBalance: number;
  endDate: string;
  referenceDate?: Date;
}

export interface ContractPaymentProgress {
  projectedInterest: number;
  capitalPaid: number;
  interestPaid: number;
  outstandingBalance: number;
  remainingInterest: number;
}

export function parseDateOnlyLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  // Validate that calendar overflow did not happen.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function resolveContractStatus({
  outstandingBalance,
  projectedInterestBalance,
  endDate,
  referenceDate = new Date(),
}: ResolveContractStatusInput): Contract["status"] {
  if (outstandingBalance <= 0 && projectedInterestBalance <= 0) {
    return "Liquidado";
  }

  const end = parseDateOnlyLocal(endDate);
  if (!end) {
    return "Activo";
  }

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return today > end ? "Vencido" : "Activo";
}

export function getProjectedInterest(contract: Pick<Contract, "amount" | "totalProjected"> & Partial<Pick<Contract, "projectedInterest">>): number {
  if (typeof contract.projectedInterest === "number") {
    return Math.max(0, contract.projectedInterest);
  }
  return Math.max(0, contract.totalProjected - contract.amount);
}

export function getContractPaymentProgress(
  contract: Pick<Contract, "id" | "amount" | "totalProjected"> & Partial<Pick<Contract, "projectedInterest">>,
  payments: Payment[]
): ContractPaymentProgress {
  const projectedInterest = getProjectedInterest(contract);
  const contractPayments = payments.filter((payment) => payment.contractId === contract.id);
  const capitalPaid = contractPayments
    .filter((payment) => payment.type === "Capital")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const interestPaid = contractPayments
    .filter((payment) => payment.type === "Interés")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    projectedInterest,
    capitalPaid,
    interestPaid,
    outstandingBalance: Math.max(0, contract.amount - capitalPaid),
    remainingInterest: Math.max(0, projectedInterest - interestPaid),
  };
}
