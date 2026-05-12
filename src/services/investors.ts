import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Investor } from "@/types/domain";

const investorsCollection = collection(db, "investors");
const contractsCollection = collection(db, "contracts");
const paymentsCollection = collection(db, "payments");

export async function listInvestors(): Promise<Investor[]> {
  const snapshot = await getDocs(investorsCollection);
  return snapshot.docs.map((entry) => entry.data() as Investor);
}

export interface CreateInvestorInput {
  name: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
  type: Investor["type"];
}

export async function createInvestor(input: CreateInvestorInput): Promise<Investor> {
  const id = `INV-${Date.now()}`;
  const investor: Investor = {
    id,
    name: input.name,
    rfc: input.rfc,
    phone: input.phone,
    email: input.email,
    address: input.address,
    type: input.type,
    createdAt: new Date().toISOString().split("T")[0],
    totalInvested: 0,
    activeContracts: 0,
  };

  await setDoc(doc(db, "investors", id), investor);
  return investor;
}

export interface UpdateInvestorInput {
  id: string;
  previousName: string;
  name: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
  type: Investor["type"];
}

export async function updateInvestor(input: UpdateInvestorInput): Promise<void> {
  const batch = writeBatch(db);
  const investorRef = doc(db, "investors", input.id);

  batch.update(investorRef, {
    name: input.name,
    rfc: input.rfc,
    phone: input.phone,
    email: input.email,
    address: input.address,
    type: input.type,
  });

  const [contractsSnapshot, paymentsSnapshot] = await Promise.all([
    getDocs(query(contractsCollection, where("investorId", "==", input.id))),
    getDocs(query(paymentsCollection, where("investorName", "==", input.previousName))),
  ]);

  contractsSnapshot.forEach((contractDoc) => {
    batch.update(contractDoc.ref, { investorName: input.name });
  });

  paymentsSnapshot.forEach((paymentDoc) => {
    batch.update(paymentDoc.ref, { investorName: input.name });
  });

  await batch.commit();
}
