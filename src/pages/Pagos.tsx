import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Receipt, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { getContractPaymentProgress, getProjectedInterest } from "@/lib/contract-status";
import { listContracts } from "@/services/contracts";
import { createPayment, listPayments } from "@/services/payments";
import { formatCurrency, formatCurrencyFull, formatDate } from "@/lib/financial";

export default function Pagos() {
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [contractId, setContractId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"Transferencia" | "Cheque" | "Efectivo" | "Depósito">("Transferencia");
  const [type, setType] = useState<"Interés" | "Capital">("Interés");
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: listPayments,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: listContracts,
  });

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowNewDialog(false);
      setPaymentProof(null);
      setProofError("");
      setContractId("");
      setPaymentDate("");
      setAmount("");
      setMethod("Transferencia");
      setType("Interés");
    },
  });

  const paymentsWithBalances = useMemo(() => {
    const contractsById = new Map(contracts.map((contract) => [contract.id, contract]));
    const sortedPayments = [...payments].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dateDiff !== 0 ? dateDiff : a.id.localeCompare(b.id);
    });
    const runningBalances = new Map<string, { Capital: number; Interés: number }>();

    return sortedPayments.map((payment) => {
      const contract = contractsById.get(payment.contractId);
      const initialCapital = contract?.amount ?? payment.balanceBefore;
      const initialInterest = contract ? getProjectedInterest(contract) : payment.balanceBefore;
      const contractBalances = runningBalances.get(payment.contractId) ?? {
        Capital: initialCapital,
        Interés: initialInterest,
      };
      const balanceBefore = contractBalances[payment.type];
      const balanceAfter = Math.max(0, balanceBefore - payment.amount);
      contractBalances[payment.type] = balanceAfter;
      runningBalances.set(payment.contractId, contractBalances);

      return {
        ...payment,
        balanceBefore,
        balanceAfter,
      };
    });
  }, [contracts, payments]);

  const filteredWithBalances = paymentsWithBalances.filter(
    (p) =>
      p.contractId.toLowerCase().includes(search.toLowerCase()) ||
      p.investorName.toLowerCase().includes(search.toLowerCase())
  );

  const methodColor = (m: string) => {
    switch (m) {
      case "Transferencia": return "bg-info/10 text-info";
      case "Cheque": return "bg-accent/10 text-accent-foreground";
      case "Efectivo": return "bg-success/10 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDialogChange = (open: boolean) => {
    setShowNewDialog(open);
    if (!open) {
      setPaymentProof(null);
      setProofError("");
    }
  };

  const handleRegisterPayment = () => {
    if (!paymentProof) {
      setProofError("Debes adjuntar un comprobante en PDF o imagen.");
      return;
    }
    const selectedContract = contracts.find((item) => item.id === contractId);
    if (!selectedContract || !paymentDate || !amount) {
      return;
    }

    const progress = getContractPaymentProgress(selectedContract, payments);
    const balanceBefore = type === "Capital" ? progress.outstandingBalance : progress.remainingInterest;
    const paymentAmount = Number(amount);

    setProofError("");
    createMutation.mutate({
      contractId,
      investorName: selectedContract.investorName,
      date: paymentDate,
      amount: paymentAmount,
      method,
      type,
      balanceBefore,
      balanceAfter: Math.max(0, balanceBefore - paymentAmount),
      paymentProof,
    });
  };

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="module-title">Registro de Pagos</h1>
          <p className="module-subtitle">
            Control de Pagos y Generación de Recibos
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo Pago</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Contrato</Label>
                <SearchableSelect
                  value={contractId}
                  onValueChange={setContractId}
                  placeholder="Seleccionar contrato"
                  searchPlaceholder="Buscar por contrato o inversionista..."
                  emptyMessage="Sin contratos encontrados."
                  options={contracts
                    .filter((c) => c.status === "Activo")
                    .map((c) => ({
                      value: c.id,
                      label: `${c.id} — ${c.investorName}`,
                      searchText: `${c.id} ${c.investorName} ${c.product ?? ""} ${c.proyectoInmobiliario ?? ""}`,
                    }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Pago</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input type="number" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medio de Pago</Label>
                  <Select value={method} onValueChange={(value) => setMethod(value as "Transferencia" | "Cheque" | "Efectivo" | "Depósito")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Medio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Depósito">Depósito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(value) => setType(value as "Interés" | "Capital")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Interés">Interés</SelectItem>
                      <SelectItem value="Capital">Capital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-proof">Comprobante de Pago (obligatorio)</Label>
                <Input
                  id="payment-proof"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPaymentProof(file);
                    if (file) {
                      setProofError("");
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PDF, JPG, PNG, WEBP.
                </p>
                {proofError && (
                  <p className="text-xs text-destructive">{proofError}</p>
                )}
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleRegisterPayment}
                disabled={!paymentProof || !contractId || !paymentDate || !amount || createMutation.isPending}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Registrar y Generar Recibo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por contrato o inversionista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>Recibo</th>
              <th>Contrato</th>
              <th>Inversionista</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Medio</th>
              <th>Tipo</th>
              <th>Saldo Antes</th>
              <th>Saldo Después</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="text-center py-6 text-sm text-muted-foreground">
                  Cargando pagos...
                </td>
              </tr>
            )}
            {filteredWithBalances.map((p) => (
              <tr key={p.id}>
                <td className="font-medium mono text-xs">{p.id}</td>
                <td className="mono text-xs">{p.contractId}</td>
                <td className="text-sm">{p.investorName}</td>
                <td className="text-sm">{formatDate(p.date)}</td>
                <td className="mono text-sm font-medium">
                  {formatCurrencyFull(p.amount)}
                </td>
                <td>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${methodColor(p.method)}`}>
                    {p.method}
                  </span>
                </td>
                <td>
                  <Badge variant="outline" className="text-xs">
                    {p.type}
                  </Badge>
                </td>
                <td className="mono text-sm">
                  {formatCurrency(p.balanceBefore)}
                </td>
                <td className="mono text-sm font-medium">
                  {formatCurrency(p.balanceAfter)}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Visualizar comprobante">
                      <a href={p.comprobanteUrl} target="_blank" rel="noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Visualizar recibo">
                      <a href={p.reciboUrl} target="_blank" rel="noreferrer">
                        <Receipt className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
