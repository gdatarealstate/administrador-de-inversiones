import { getContractPaymentProgress } from "@/lib/contract-status";
import { listContracts } from "@/services/contracts";
import { listInvestors } from "@/services/investors";
import { listPayments } from "@/services/payments";
import type {
  Contract,
  DashboardKPI,
  MonthlyFlowPoint,
  NamedDistribution,
  PortfolioGrowthPoint,
} from "@/types/domain";

export interface DashboardData {
  kpi: DashboardKPI;
  monthlyFlowData: MonthlyFlowPoint[];
  portfolioGrowthData: PortfolioGrowthPoint[];
  projectDistribution: NamedDistribution[];
  investorDistribution: NamedDistribution[];
  upcomingContracts: Contract[];
}

function monthLabels() {
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
}

function buildMonthlyFlow(contracts: Contract[], payments: Awaited<ReturnType<typeof listPayments>>) {
  const labels = monthLabels();
  const flow = labels.map((month) => ({ month, ingresos: 0, egresos: 0 }));
  payments.forEach((payment) => {
    const month = new Date(payment.date).getMonth();
    if (month >= 0 && month < 12) {
      flow[month].ingresos += payment.amount;
    }
  });

  // Egresos estimados por intereses mensuales de contratos activos.
  contracts
    .filter((contract) => contract.status === "Activo")
    .forEach((contract) => {
      const month = new Date(contract.startDate).getMonth();
      if (month >= 0 && month < 12) {
        flow[month].egresos += contract.monthlyInterest;
      }
    });

  return flow;
}

function buildPortfolioGrowth(contracts: Contract[]): PortfolioGrowthPoint[] {
  const labels = monthLabels();
  let running = 0;
  return labels.map((month, index) => {
    contracts
      .filter((c) => new Date(c.startDate).getMonth() === index)
      .forEach((c) => {
        running += c.amount;
      });

    return { month, cartera: running };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const [investors, contracts, payments] = await Promise.all([
    listInvestors(),
    listContracts(),
    listPayments(),
  ]);

  const activeContracts = contracts.filter((contract) => contract.status === "Activo");
  const totalActiveCapital = activeContracts.reduce((sum, contract) => sum + contract.outstandingBalance, 0);
  const accruedInterest = payments
    .filter((payment) => payment.type === "Interés")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const weightedRateDenominator = activeContracts.reduce((sum, contract) => sum + contract.amount, 0);
  const weightedRate =
    weightedRateDenominator > 0
      ? activeContracts.reduce((sum, contract) => sum + contract.annualRate * contract.amount, 0) /
        weightedRateDenominator
      : 0;
  const monthlyProjectedFlow = activeContracts.reduce((sum, contract) => sum + contract.monthlyInterest, 0);
  const pendingProjectedInterest = contracts.reduce(
    (sum, contract) => sum + getContractPaymentProgress(contract, payments).remainingInterest,
    0
  );
  const upcomingMaturities = contracts.filter((contract) => {
    const endDate = new Date(contract.endDate).getTime();
    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    return endDate >= now && endDate <= now + ninetyDays;
  }).length;

  const expiredContracts = contracts.filter((contract) => contract.status === "Vencido");
  const totalExpiredDebt = expiredContracts.reduce((sum, contract) => sum + contract.outstandingBalance, 0);
  const expiredContractsCount = expiredContracts.length;

  const projectMap = new Map<string, { value: number; count: number }>();
  contracts.forEach((contract) => {
    const current = projectMap.get(contract.proyectoInmobiliario) ?? { value: 0, count: 0 };
    current.value += contract.outstandingBalance;
    current.count += 1;
    projectMap.set(contract.proyectoInmobiliario, current);
  });

  const projectDistribution: NamedDistribution[] = [...projectMap.entries()].map(([name, values]) => ({
    name,
    value: values.value,
    count: values.count,
  }));

  const investorDistribution: NamedDistribution[] = investors.map((investor) => ({
    name: investor.name,
    value: investor.totalInvested,
  }));

  const upcomingContracts = contracts
    .filter((c) => c.status === "Activo" || c.status === "Vencido")
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  return {
    kpi: {
      totalActiveCapital,
      accruedInterest,
      weightedRate,
      monthlyProjectedFlow,
      pendingProjectedInterest,
      upcomingMaturities,
      totalExpiredDebt,
      expiredContractsCount,
    },
    monthlyFlowData: buildMonthlyFlow(contracts, payments),
    portfolioGrowthData: buildPortfolioGrowth(contracts),
    projectDistribution,
    investorDistribution,
    upcomingContracts,
  };
}
