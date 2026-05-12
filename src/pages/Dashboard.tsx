import {
  DollarSign,
  TrendingUp,
  Percent,
  ArrowUpDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/KPICard";
import { getDashboardData } from "@/services/dashboard";
import { formatCurrency, formatPercent, formatDate } from "@/lib/financial";

const COLORS = [
  "hsl(222, 60%, 22%)",
  "hsl(42, 92%, 50%)",
  "hsl(152, 60%, 40%)",
  "hsl(210, 90%, 52%)",
];

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "MXN",
  }).format(value);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
  });

  const kpi = data?.kpi ?? {
    totalActiveCapital: 0,
    accruedInterest: 0,
    weightedRate: 0,
    monthlyProjectedFlow: 0,
    interestProvision: 0,
    upcomingMaturities: 0,
    totalExpiredDebt: 0,
    expiredContractsCount: 0,
  };
  const monthlyFlowData = data?.monthlyFlowData ?? [];
  const portfolioGrowthData = data?.portfolioGrowthData ?? [];
  const projectDistribution = data?.projectDistribution ?? [];
  const investorDistribution = data?.investorDistribution ?? [];
  const upcomingContracts = data?.upcomingContracts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="module-title">Dashboard Financiero</h1>
        <p className="module-subtitle">
          Visión Integral del Portafolio de Inversiones
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
        <KPICard
          title="Capital Total Activo"
          value={formatCurrency(kpi.totalActiveCapital)}
          icon={DollarSign}
          accentColor="default"
          trend={{ value: "+2.3%", positive: true }}
        />
        <KPICard
          title="Intereses Devengados"
          value={formatCurrency(kpi.accruedInterest)}
          icon={TrendingUp}
          accentColor="accent"
          trend={{ value: "+5.1%", positive: true }}
        />
        <KPICard
          title="Tasa Prom. Ponderada"
          value={formatPercent(kpi.weightedRate)}
          icon={Percent}
          accentColor="info"
        />
        <KPICard
          title="Flujo Proyectado/Mes"
          value={formatCurrency(kpi.monthlyProjectedFlow)}
          icon={ArrowUpDown}
          accentColor="success"
        />
        <KPICard
          title="Provisión Intereses"
          value={formatCurrency(kpi.interestProvision)}
          icon={Clock}
          accentColor="accent"
        />
        <KPICard
          title="Deuda Total Vencida"
          value={formatCurrency(kpi.totalExpiredDebt)}
          icon={AlertTriangle}
          accentColor="destructive"
          className="h-full min-h-[132px] xl:min-h-[128px]"
        />
        <div className="h-full md:col-start-1 md:row-start-4 lg:col-start-2 lg:row-start-3 xl:col-start-5 xl:row-start-2">
          <KPICard
            title="Próx. Vencimientos"
            value={String(kpi.upcomingMaturities)}
            subtitle="en los próximos 90 días"
            icon={AlertTriangle}
            accentColor="destructive"
            className="h-full min-h-[152px] xl:min-h-[160px]"
          />
        </div>
        <div className="h-full md:col-start-2 md:row-start-4 lg:col-start-3 lg:row-start-3 xl:col-start-6 xl:row-start-2">
          <KPICard
            title="Contratos Vencidos"
            value={String(kpi.expiredContractsCount)}
            icon={AlertTriangle}
            accentColor="destructive"
            className="h-full min-h-[132px] xl:min-h-[128px]"
          />
        </div>
      </div>
      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando dashboard...</div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Growth */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold mb-4">Crecimiento de Cartera</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={portfolioGrowthData}>
              <defs>
                <linearGradient id="colorCartera" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(222, 60%, 22%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(222, 60%, 22%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area
                type="monotone"
                dataKey="cartera"
                stroke="hsl(222, 60%, 22%)"
                strokeWidth={2}
                fill="url(#colorCartera)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Flow */}
        <div className="kpi-card">
          <h3 className="text-sm font-semibold mb-4">Flujo Mensual Proyectado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="ingresos" fill="hsl(222, 60%, 22%)" radius={[4, 4, 0, 0]} name="Ingresos" />
              <Bar dataKey="egresos" fill="hsl(42, 92%, 50%)" radius={[4, 4, 0, 0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution */}
        <div className="kpi-card flex flex-col">
          <h3 className="text-sm font-semibold mb-4">Distribución por Proyecto</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {projectDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Maturities */}
        <div className="kpi-card flex flex-col">
          <h3 className="text-sm font-semibold mb-4">Próximos Vencimientos</h3>
          <div className="h-[280px] space-y-3 overflow-y-auto pr-1">
            {upcomingContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{contract.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.investorName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium mono">
                    {formatCurrency(contract.outstandingBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investor Distribution */}
        <div className="kpi-card flex flex-col">
          <h3 className="text-sm font-semibold mb-4">Distribución por Inversionista</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={investorDistribution}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" />
                <XAxis type="number" tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  stroke="hsl(220, 9%, 46%)"
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar
                  dataKey="value"
                  fill="hsl(222, 60%, 22%)"
                  radius={[0, 4, 4, 0]}
                  name="Monto invertido"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
