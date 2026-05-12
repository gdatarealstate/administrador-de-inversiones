export interface Investor {
  id: string;
  name: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
  type: "Persona Física" | "Persona Moral";
  createdAt: string;
  totalInvested: number;
  activeContracts: number;
}

export interface Contract {
  id: string;
  investorId: string;
  investorName: string;
  proyectoInmobiliario: string;
  product: string;
  amount: number;
  annualRate: number;
  rateType: "simple" | "compuesta";
  termMonths: number;
  startDate: string;
  endDate: string;
  outstandingBalance: number;
  monthlyInterest: number;
  projectedInterest: number;
  totalProjected: number;
  contractPdfUrl?: string;
  status: "Activo" | "Liquidado" | "Vencido";
}

export interface Payment {
  id: string;
  contractId: string;
  investorName: string;
  date: string;
  amount: number;
  method: "Transferencia" | "Cheque" | "Efectivo" | "Depósito";
  type: "Interés" | "Capital";
  balanceBefore: number;
  balanceAfter: number;
  comprobanteUrl: string;
  reciboUrl: string;
}

export interface DashboardKPI {
  totalActiveCapital: number;
  accruedInterest: number;
  weightedRate: number;
  monthlyProjectedFlow: number;
  interestProvision: number;
  upcomingMaturities: number;
  totalExpiredDebt: number;
  expiredContractsCount: number;
}

export interface NamedDistribution {
  name: string;
  value: number;
  count?: number;
}

export interface MonthlyFlowPoint {
  month: string;
  ingresos: number;
  egresos: number;
}

export interface PortfolioGrowthPoint {
  month: string;
  cartera: number;
}
