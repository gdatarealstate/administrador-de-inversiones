import { useState } from "react";
import { Plus, Search, Filter, Mail, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import type { Investor } from "@/types/domain";
import { createInvestor, listInvestors, updateInvestor } from "@/services/investors";
import { formatCurrency } from "@/lib/financial";

export default function Inversionistas() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [name, setName] = useState("");
  const [rfc, setRfc] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"Persona Física" | "Persona Moral">("Persona Física");
  const queryClient = useQueryClient();

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: listInvestors,
  });

  const createMutation = useMutation({
    mutationFn: createInvestor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowNewDialog(false);
      setName("");
      setRfc("");
      setPhone("");
      setEmail("");
      setAddress("");
      setType("Persona Física");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateInvestor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setShowEditDialog(false);
      setEditingInvestor(null);
      setName("");
      setRfc("");
      setPhone("");
      setEmail("");
      setAddress("");
      setType("Persona Física");
    },
  });

  const setFormFromInvestor = (inv: Investor) => {
    setName(inv.name);
    setRfc(inv.rfc);
    setPhone(inv.phone);
    setEmail(inv.email);
    setAddress(inv.address);
    setType(inv.type);
  };

  const openEditDialog = (inv: Investor) => {
    setEditingInvestor(inv);
    setFormFromInvestor(inv);
    setShowEditDialog(true);
  };

  const filtered = investors.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.rfc.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || inv.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="module-title">Inversionistas</h1>
          <p className="module-subtitle">
            Gestión Integral del Directorio de Inversionistas
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Inversionista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Alta de Inversionista</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre / Razón Social</Label>
                  <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input placeholder="XXXX000000XX0" value={rfc} onChange={(e) => setRfc(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="+52 55 0000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input placeholder="Dirección completa" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(value) => setType(value as "Persona Física" | "Persona Moral")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persona Física">Persona Física</SelectItem>
                    <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() =>
                  createMutation.mutate({
                    name,
                    rfc,
                    phone,
                    email,
                    address,
                    type,
                  })
                }
                disabled={
                  createMutation.isPending ||
                  !name.trim() ||
                  !rfc.trim() ||
                  !phone.trim() ||
                  !email.trim() ||
                  !address.trim()
                }
              >
                Registrar Inversionista
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setEditingInvestor(null);
              setName("");
              setRfc("");
              setPhone("");
              setEmail("");
              setAddress("");
              setType("Persona Física");
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Inversionista</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre / Razón Social</Label>
                  <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input placeholder="XXXX000000XX0" value={rfc} onChange={(e) => setRfc(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="+52 55 0000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input placeholder="Dirección completa" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(value) => setType(value as "Persona Física" | "Persona Moral")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persona Física">Persona Física</SelectItem>
                    <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => {
                  if (!editingInvestor) return;
                  updateMutation.mutate({
                    id: editingInvestor.id,
                    previousName: editingInvestor.name,
                    name,
                    rfc,
                    phone,
                    email,
                    address,
                    type,
                  });
                }}
                disabled={
                  updateMutation.isPending ||
                  !editingInvestor ||
                  !name.trim() ||
                  !rfc.trim() ||
                  !phone.trim() ||
                  !email.trim() ||
                  !address.trim()
                }
              >
                Guardar Cambios
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
            placeholder="Buscar por nombre, RFC o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="Persona Física">Persona Física</SelectItem>
            <SelectItem value="Persona Moral">Persona Moral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>ID</th>
              <th>Nombre / Razón Social</th>
              <th>RFC</th>
              <th>Tipo</th>
              <th>Inversión Total</th>
              <th>Contratos</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                  Cargando inversionistas...
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium mono text-xs">{inv.id}</td>
                <td>
                  <div>
                    <p className="font-medium text-sm">{inv.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {inv.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="mono text-xs">{inv.rfc}</td>
                <td>
                  <Badge variant="outline" className="text-xs font-normal">
                    {inv.type}
                  </Badge>
                </td>
                <td className="mono text-sm font-medium">
                  {formatCurrency(inv.totalInvested)}
                </td>
                <td className="text-center">{inv.activeContracts}</td>
                <td className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Editar inversionista"
                    onClick={() => openEditDialog(inv)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
