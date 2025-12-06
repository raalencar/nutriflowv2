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
import { Plus, Search, Truck, CheckCircle, Clock, Eye, FileText, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePurchaseOrders, useCreatePurchaseOrder, useReceivePurchaseOrder } from "@/hooks/use-operations";
import { useUnits } from "@/hooks/use-units";
import { useProducts } from "@/hooks/use-products";
import { CreatePurchaseOrderDTO } from "@/lib/api";
import { format } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const statusConfig: Record<string, { label: string; icon: any; color: "secondary" | "default" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", icon: FileText, color: "secondary" },
  ordered: { label: "Pedido", icon: Truck, color: "default" },
  received: { label: "Recebido", icon: CheckCircle, color: "outline" },
};

const suppliers = [
  "Distribuidora ABC",
  "Hortifruti São Paulo",
  "Frigorífico Central",
  "Atacadão",
  "Cereais Brasil",
];

// Zod Schema for Order Form
const orderItemSchema = z.object({
  productId: z.string().min(1, "Selecione o produto"),
  quantity: z.coerce.number().positive("Qtd positiva"),
  cost: z.coerce.number().positive("Custo positivo"),
});

const orderSchema = z.object({
  unitId: z.string().min(1, "Selecione a unidade"),
  supplier: z.string().min(1, "Selecione o fornecedor"),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos 1 item"),
  status: z.enum(["draft", "ordered"]).default("ordered"), // Simplified: always ordered?
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function Compras() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null); // Details View
  const { toast } = useToast();

  const { data: units = [] } = useUnits();
  const { data: products = [] } = useProducts();
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const createOrder = useCreatePurchaseOrder();
  const receiveOrder = useReceivePurchaseOrder();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [{ productId: "", quantity: 1, cost: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Calculate total for the form on the fly?
  // We can watch fields.
  const watchItems = form.watch("items");
  const formTotal = watchItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.cost || 0), 0);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.supplier || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.id || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = (data: OrderFormValues) => {
    const payload: CreatePurchaseOrderDTO = {
      unitId: data.unitId,
      supplier: data.supplier,
      items: data.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        cost: i.cost
      }))
      // API calculates totalValue based on items
    };

    createOrder.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Pedido criado com sucesso!" });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Erro ao criar pedido", variant: "destructive" });
      }
    });
  };

  const handleReceive = (id: string) => {
    receiveOrder.mutate(id, {
      onSuccess: () => {
        toast({ title: "Pedido recebido!", description: "Estoque atualizado com sucesso." });
        setSelectedOrder(null); // Close details if open
      },
      onError: (err: any) => {
        toast({ title: "Erro ao receber", description: err.message, variant: "destructive" });
      }
    });
  };

  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || id;

  const stats = [
    { label: "Pendentes", value: orders.filter(o => o.status === "ordered").length, color: "text-primary" }, // 'ordered' shows as "Pedido/Trânsito"
    { label: "Recebidos", value: orders.filter(o => o.status === "received").length, color: "text-chart-1" },
    { label: "Total Gasto", value: `R$ ${orders.reduce((acc, o) => acc + parseFloat(o.totalValue || '0'), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "text-chart-1" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-muted-foreground">Gestão de pedidos e fornecedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Novo Pedido de Compra</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidade Solicitante</Label>
                  <Select onValueChange={(val) => form.setValue("unitId", val)} defaultValue={form.getValues("unitId")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.unitId && <p className="text-red-500 text-xs">{form.formState.errors.unitId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select onValueChange={(val) => form.setValue("supplier", val)} defaultValue={form.getValues("supplier")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.supplier && <p className="text-red-500 text-xs">{form.formState.errors.supplier.message}</p>}
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                <div className="flex justify-between items-center mb-2">
                  <Label>Itens do Pedido</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1, cost: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Produto</Label>
                      <Select onValueChange={(val) => form.setValue(`items.${index}.productId`, val)} defaultValue={field.productId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qtd</Label>
                      <Input type="number" step="0.001" {...form.register(`items.${index}.quantity`)} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Custo Total</Label>
                      <Input type="number" step="0.01" {...form.register(`items.${index}.cost`)} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit.</Label>
                      <div className="text-sm py-2 px-1 text-muted-foreground">
                        {(watchItems[index]?.quantity > 0 && watchItems[index]?.cost > 0)
                          ? (watchItems[index].cost / watchItems[index].quantity).toFixed(2)
                          : '-'}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {form.formState.errors.items && <p className="text-red-500 text-xs">{form.formState.errors.items.message}</p>}

                <div className="text-right font-bold mt-2">
                  Total Estimado: R$ {formTotal.toFixed(2)}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pedido
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="ordered">Pedido</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando pedidos...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Nenhum pedido encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const status = statusConfig[order.status] || statusConfig['ordered'];
                      return (
                        <TableRow key={order.id}>
                          <TableCell>{order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy") : '-'}</TableCell>
                          <TableCell className="font-medium">{order.supplier}</TableCell>
                          <TableCell className="text-muted-foreground">{getUnitName(order.unitId)}</TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {parseFloat(order.totalValue || '0').toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.color as any}>
                              <status.icon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {/* In future, if GET included items, we could show details. For now just Receive action */}
                              {(order.status === "ordered" || order.status === "draft") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Receber Pedido"
                                  onClick={() => handleReceive(order.id)}
                                  disabled={receiveOrder.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 text-chart-1" />
                                </Button>
                              )}
                            </div>
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

      {/* Details Dialog - Omitted for now as GET /purchases doesn't return items in list view and I didn't add GET /purchases/:id */}
    </div>
  );
}
