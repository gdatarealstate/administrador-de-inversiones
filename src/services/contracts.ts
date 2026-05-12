import { collection, doc, getDocs, increment, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getContractPaymentProgress, resolveContractStatus } from "@/lib/contract-status";
import { calculateMonthlyInterest } from "@/lib/financial";
import { listPayments } from "@/services/payments";
import type { Contract } from "@/types/domain";

const contractsCollection = collection(db, "contracts");

export async function listContracts(): Promise<Contract[]> {
  const [snapshot, payments] = await Promise.all([getDocs(contractsCollection), listPayments()]);
  return snapshot.docs.map((entry) => {
    const storedContract = entry.data() as Contract;
    const progress = getContractPaymentProgress(storedContract, payments);
    return {
      ...storedContract,
      projectedInterest: progress.projectedInterest,
      totalProjected: storedContract.amount + progress.projectedInterest,
      outstandingBalance: progress.outstandingBalance,
      status: resolveContractStatus({
        outstandingBalance: progress.outstandingBalance,
        projectedInterestBalance: progress.remainingInterest,
        endDate: storedContract.endDate,
      }),
    };
  });
}

export interface CreateContractInput {
  investorId: string;
  investorName: string;
  proyectoInmobiliario: string;
  product: string;
  amount: number;
  annualRate: number;
  rateType: Contract["rateType"];
  termMonths: number;
  startDate: string;
  contractPdf: File;
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const id = `CTR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + input.termMonths);

  const monthlyInterest = Math.round(
    calculateMonthlyInterest(input.amount, input.annualRate, input.rateType)
  );
  const projectedInterest = Math.round(monthlyInterest * input.termMonths);
  const totalProjected = Math.round(input.amount + projectedInterest);
  const contractPdfRef = ref(storage, `contratos-fisicos/${id}.pdf`);
  await uploadBytes(contractPdfRef, input.contractPdf);
  const contractPdfUrl = await getDownloadURL(contractPdfRef);

  const contract: Contract = {
    id,
    investorId: input.investorId,
    investorName: input.investorName,
    proyectoInmobiliario: input.proyectoInmobiliario,
    product: input.product,
    amount: input.amount,
    annualRate: input.annualRate,
    rateType: input.rateType,
    termMonths: input.termMonths,
    startDate: input.startDate,
    endDate: end.toISOString().split("T")[0],
    outstandingBalance: input.amount,
    monthlyInterest,
    projectedInterest,
    totalProjected,
    contractPdfUrl,
    status: "Activo",
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "contracts", id), contract);
  batch.update(doc(db, "investors", input.investorId), {
    totalInvested: increment(input.amount),
    activeContracts: increment(1),
  });
  await batch.commit();
  return contract;
}
