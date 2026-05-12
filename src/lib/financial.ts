export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateSimpleInterest(
  principal: number,
  annualRate: number,
  days: number
): number {
  return (principal * (annualRate / 100) * days) / 365;
}

export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  return principal * Math.pow(1 + monthlyRate, months) - principal;
}

export function calculateMonthlyInterest(
  principal: number,
  annualRate: number,
  rateType: "simple" | "compuesta"
): number {
  if (rateType === "simple") {
    return (principal * (annualRate / 100)) / 12;
  }
  const monthlyRate = annualRate / 100 / 12;
  return principal * monthlyRate;
}

export function generatePaymentSchedule(
  amount: number,
  annualRate: number,
  termMonths: number,
  rateType: "simple" | "compuesta",
  startDate: string
) {
  const schedule = [];
  let balance = amount;
  const start = new Date(startDate);

  for (let i = 1; i <= termMonths; i++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + i);

    const interest = calculateMonthlyInterest(balance, annualRate, rateType);
    const principalPayment = amount / termMonths;
    const totalPayment = principalPayment + interest;

    balance -= principalPayment;

    schedule.push({
      period: i,
      date: paymentDate.toISOString().split("T")[0],
      interest: Math.round(interest),
      principal: Math.round(principalPayment),
      total: Math.round(totalPayment),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  return schedule;
}
