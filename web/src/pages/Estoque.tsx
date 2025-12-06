import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpCircle, ArrowDownCircle, AlertTriangle, RefreshCw, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useStocks, useCreateMovement, useInventoryTransactions } from "@/hooks/use-operations";
import { useUnits } from "@/hooks/use-units";
import { useProducts } from "@/hooks/use-products";
import { InventoryTransactionDTO } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";

export default function Estoque() {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [transactionUnitFilter, setTransactionUnitFilter] = useState("all");

  const { data: units = [] } = useUnits();
  const { data: products = [] } = useProducts();

  // Conditionally fetch based on filter? Or filter client side?
  // API supports filtering. For "all", we pass undefined.
  const stocksQueryUnit = unitFilter === "all" ? undefined : unitFilter;
  const { data: stocks = [], isLoading: isLoadingStocks } = useStocks(stocksQueryUnit);

  const transactionsQueryUnit = transactionUnitFilter === "all" ? undefined : transactionUnitFilter;
  const { data: transactions = [], isLoading: isLoadingTransactions } = useInventoryTransactions(transactionsQueryUnit);

  const createMovement = useCreateMovement();
  const { toast } = useToast();

  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUST">("IN");

  // Movement Form State
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("");

  const filteredStocks = stocks.filter((item) => {
    // API filters by unit, but we might want client search on top
    const matchesSearch =
      (item.productName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (item.id || "").toLowerCase().includes(search.toLowerCase()); // SKU logic might need product join details
    return matchesSearch;
  });

  const lowStockItems = filteredStocks.filter((item) =>
    parseFloat(item.quantity) < parseFloat(item.minStock || '0')
  );

  const getStockStatus = (item: any) => {
    const qty = parseFloat(item.quantity);
    const min = parseFloat(item.minStock || '0');
    if (min === 0) return { label: "Normal", variant: "default" as const };
    const ratio = qty / min;
    if (ratio < 0.5) return { label: "Crítico", variant: "destructive" as const };
    if (ratio < 1) return { label: "Baixo", variant: "secondary" as const };
    return { label: "Normal", variant: "default" as const };
  };

  const handleMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !selectedProduct || !quantity) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const payload: InventoryTransactionDTO = {
      unitId: selectedUnit,
      productId: selectedProduct,
      type: movementType,
      quantity: parseFloat(quantity),
      reason: reason,
      cost: cost ? parseFloat(cost) : undefined
    };

    createMovement.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Movimentação registrada com sucesso!" });
        setIsMovementDialogOpen(false);
        // Reset form
        setQuantity("");
        setCost("");
        setReason("");
        // Keep unit/product potentially?
      },
      onError: (err: any) => {
        toast({ title: "Erro ao registrar movimentação", description: err.message, variant: "destructive" });
      }
    });
  };

  const openDialog = (type: "IN" | "OUT" | "ADJUST") => {
    setMovementType(type);
    setIsMovementDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Controle de posições e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <div className="hidden">Trigger handled by buttons</div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {movementType === "IN" && "Registrar Entrada"}
                  {movementType === "OUT" && "Registrar Saída"}
                  {movementType === "ADJUST" && "Ajuste de Inventário"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMovement} className="space-y-4">
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    disabled={movementType === 'OUT'} // Cost optional/irrelevant for manual OUT often? Or inferred.
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Input
                    placeholder="NF, motivo, etc."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMovement.isPending}>
                  {createMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <RoleGuard allowedRoles={['admin', 'manager']} mode="inline">
            <Button variant="outline" className="gap-2" onClick={() => openDialog("IN")}>
              <ArrowUpCircle className="h-4 w-4 text-chart-1" />
              Entrada
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={['admin', 'manager']} mode="inline">
            <Button variant="outline" className="gap-2" onClick={() => openDialog("OUT")}>
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
              Saída
            </Button>
          </RoleGuard>
          <RoleGuard allowedRoles={['admin', 'manager']} mode="inline">
            <Button variant="outline" className="gap-2" onClick={() => openDialog("ADJUST")}>
              <RefreshCw className="h-4 w-4" />
              Ajuste
            </Button>
          </RoleGuard>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{lowStockItems.length} item(s) com estoque abaixo do mínimo</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Posições</TabsTrigger>
          <TabsTrigger value="transactions">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todas as Unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Unidades</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStocks ? (
                <div className="text-center py-4">Carregando estoque...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Mín.</TableHead>
                        <TableHead className="text-right">Custo Médio</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStocks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">Nenhum registro encontrado.</TableCell>
                        </TableRow>
                      ) : (
                        filteredStocks.map((item) => {
                          const status = getStockStatus(item);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <div>{item.productName}</div>
                                <div className="text-xs text-muted-foreground">{item.productUnit}</div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {parseFloat(item.quantity).toFixed(3)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {item.minStock}
                              </TableCell>
                              <TableCell className="text-right">R$ {(parseFloat(item.avgCost || '0')).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-end">
                <Select value={transactionUnitFilter} onValueChange={setTransactionUnitFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todas as Unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Unidades</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="text-center py-4">Carregando histórico...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead>Obs.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Nenhuma movimentação encontrada.</TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {t.date ? format(new Date(t.date), "dd/MM/yyyy HH:mm") : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  t.type === "IN" ? "default" :
                                    t.type === "OUT" ? "secondary" : "outline"
                                }
                              >
                                {t.type === "IN" ? "Entrada" : t.type === "OUT" ? "Saída" : "Ajuste"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{t.productName}</TableCell>
                            <TableCell className="text-muted-foreground">{t.unitName}</TableCell>
                            <TableCell className="text-right">
                              <span className={t.type === 'IN' ? "text-chart-1" : "text-destructive"}>
                                {t.type === 'IN' ? "+" : "-"}{parseFloat(t.quantity).toFixed(3)} {t.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {t.cost ? `R$ ${parseFloat(t.cost).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{t.reason}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
