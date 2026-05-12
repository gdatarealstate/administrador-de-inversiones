import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye } from "lucide-react";
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
import { getContractPaymentProgress } from "@/lib/contract-status";
import { createContract, listContracts } from "@/services/contracts";
import { listInvestors } from "@/services/investors";
import { listPayments } from "@/services/payments";
import { formatCurrency, formatPercent, formatDate } from "@/lib/financial";

export default function Contratos() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [contractPdf, setContractPdf] = useState<File | null>(null);
  const [contractPdfError, setContractPdfError] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [proyectoInmobiliario, setProyectoInmobiliario] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [rateType, setRateType] = useState<"simple" | "compuesta">("simple");
  const [termMonths, setTermMonths] = useState("");
  const [startDate, setStartDate] = useState("");
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: listContracts,
  });

  const { data: investors = [] } = useQuery({
    queryKey: ["investors"],
    queryFn: listInvestors,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: listPayments,
  });

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowNewDialog(false);
      setInvestorId("");
      setProduct("");
      setAmount("");
      setProyectoInmobiliario("");
      setAnnualRate("");
      setRateType("simple");
      setTermMonths("");
      setStartDate("");
      setContractPdf(null);
      setContractPdfError("");
    },
  });

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.investorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusClass = (s: string) => {
    switch (s) {
      case "Activo": return "status-active";
      case "Liquidado": return "bg-muted text-muted-foreground text-xs rounded-full px-2.5 py-0.5 inline-flex items-center font-medium";
      case "Vencido": return "status-expired";
      default: return "";
    }
  };

  const handleDialogChange = (open: boolean) => {
    setShowNewDialog(open);
    if (!open) {
      setContractPdf(null);
      setContractPdfError("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="module-title">Contratos</h1>
          <p className="module-subtitle">
            Administración de Contratos de Inversión
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Contrato de Inversión</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Inversionista</Label>
                <SearchableSelect
                  value={investorId}
                  onValueChange={setInvestorId}
                  placeholder="Seleccionar inversionista"
                  searchPlaceholder="Buscar inversionista..."
                  emptyMessage="Sin inversionistas encontrados."
                  options={investors.map((investor) => ({
                    value: investor.id,
                    label: investor.name,
                    searchText: `${investor.id} ${investor.rfc ?? ""} ${investor.email ?? ""}`,
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Producto Financiero</Label>
                  <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagaré a Tasa Fija">Pagaré a Tasa Fija</SelectItem>
                      <SelectItem value="Crédito Simple">Crédito Simple</SelectItem>
                      <SelectItem value="Participación de Capital">Participación de Capital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto Invertido</Label>
                  <Input type="number" placeholder="$0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Proyecto Inmobiliario</Label>
                <Select value={proyectoInmobiliario} onValueChange={setProyectoInmobiliario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clouthier 476">Clouthier 476</SelectItem>
                    <SelectItem value="Fedor Dostoievski">Fedor Dostoievski</SelectItem>
                    <SelectItem value="Nasú Bucerías">Nasú Bucerías</SelectItem>
                    <SelectItem value="Torret Providencia">Torret Providencia</SelectItem>
                    <SelectItem value="Triada Country">Triada Country</SelectItem>
                    <SelectItem value="Victoria Providencia">Victoria Providencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tasa Anual (%)</Label>
                  <Input type="number" placeholder="12.00" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Tasa</Label>
                  <Select value={rateType} onValueChange={(value) => setRateType(value as "simple" | "compuesta")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="compuesta">Compuesta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plazo (meses)</Label>
                  <Input type="number" placeholder="12" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-pdf">Contrato Físico (obligatorio)</Label>
                <Input
                  id="contract-pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setContractPdf(null);
                      return;
                    }
                    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                    if (!isPdf) {
                      setContractPdf(null);
                      setContractPdfError("Solo se permiten archivos en formato PDF.");
                      return;
                    }
                    setContractPdf(file);
                    setContractPdfError("");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Formato permitido: PDF.
                </p>
                {contractPdfError && (
                  <p className="text-xs text-destructive">{contractPdfError}</p>
                )}
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => {
                  if (!contractPdf) {
                    setContractPdfError("Debes adjuntar el contrato físico en PDF.");
                    return;
                  }
                  const selectedInvestor = investors.find((item) => item.id === investorId);
                  if (!selectedInvestor) {
                    return;
                  }
                  createMutation.mutate({
                    investorId,
                    investorName: selectedInvestor.name,
                    proyectoInmobiliario,
                    product,
                    amount: Number(amount),
                    annualRate: Number(annualRate),
                    rateType,
                    termMonths: Number(termMonths),
                    startDate,
                    contractPdf,
                  });
                }}
                disabled={
                  createMutation.isPending ||
                  !contractPdf ||
                  !investorId ||
                  !product ||
                  !amount ||
                  !proyectoInmobiliario ||
                  !annualRate ||
                  !termMonths ||
                  !startDate
                }
              >
                Crear Contrato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o inversionista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Liquidado">Liquidado</SelectItem>
            <SelectItem value="Vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>Contrato</th>
              <th>Inversionista</th>
              <th>Proyecto Inmobiliario</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Tasa</th>
              <th>Saldo Insoluto</th>
              <th>Int. Mensual</th>
              <th>Int. Proyectado</th>
              <th>Int. Remanente</th>
              <th>Inicio</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={14} className="text-center py-6 text-sm text-muted-foreground">
                  Cargando contratos...
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const progress = getContractPaymentProgress(c, payments);
              return (
              <tr key={c.id}>
                <td className="font-medium mono text-xs">{c.id}</td>
                <td className="text-sm">{c.investorName}</td>
                <td className="text-sm">{c.proyectoInmobiliario}</td>
                <td className="text-sm">{c.product}</td>
                <td className="mono text-sm">{formatCurrency(c.amount)}</td>
                <td className="mono text-sm">
                  {formatPercent(c.annualRate)}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({c.rateType === "simple" ? "S" : "C"})
                  </span>
                </td>
                <td className="mono text-sm font-medium">
                  {formatCurrency(c.outstandingBalance)}
                </td>
                <td className="mono text-sm">
                  {formatCurrency(c.monthlyInterest)}
                </td>
                <td className="mono text-sm">
                  {formatCurrency(progress.projectedInterest)}
                </td>
                <td className="mono text-sm">
                  {formatCurrency(progress.remainingInterest)}
                </td>
                <td className="text-sm">{formatDate(c.startDate)}</td>
                <td className="text-sm">{formatDate(c.endDate)}</td>
                <td>
                  <span className={statusClass(c.status)}>{c.status}</span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {c.contractPdfUrl ? (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Visualizar contrato">
                        <a href={c.contractPdfUrl} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Contrato no disponible"
                        disabled
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
