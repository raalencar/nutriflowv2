import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  DollarSign,
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
} from "recharts";

const cmvData = [
  { name: "Jan", cmv: 28.5 },
  { name: "Fev", cmv: 29.2 },
  { name: "Mar", cmv: 27.8 },
  { name: "Abr", cmv: 26.5 },
  { name: "Mai", cmv: 25.9 },
  { name: "Jun", cmv: 24.8 },
];

const unitsPerformance = [
  { name: "Unidade 1", valor: 45000 },
  { name: "Unidade 2", valor: 38000 },
  { name: "Unidade 3", valor: 52000 },
  { name: "Unidade 4", valor: 41000 },
  { name: "Unidade 5", valor: 47000 },
];

const stats = [
  {
    title: "Unidades Ativas",
    value: "20",
    change: "+2",
    trend: "up",
    icon: Building2,
  },
  {
    title: "SKUs Cadastrados",
    value: "1.248",
    change: "+45",
    trend: "up",
    icon: Package,
  },
  {
    title: "CMV Médio",
    value: "24.8%",
    change: "-3.2%",
    trend: "down",
    icon: DollarSign,
  },
  {
    title: "Itens em Alerta",
    value: "12",
    change: "+3",
    trend: "warning",
    icon: AlertTriangle,
  },
];

const lowStockItems = [
  { name: "Arroz Agulhinha", unit: "Unidade 3", qty: "5kg", min: "20kg" },
  { name: "Óleo de Soja", unit: "Unidade 1", qty: "3L", min: "15L" },
  { name: "Frango Peito", unit: "Unidade 5", qty: "8kg", min: "25kg" },
  { name: "Tomate", unit: "Unidade 2", qty: "2kg", min: "10kg" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das operações de todas as unidades
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-chart-1" />
                    )}
                    {stat.trend === "down" && (
                      <TrendingDown className="h-4 w-4 text-chart-1" />
                    )}
                    {stat.trend === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={
                        stat.trend === "warning"
                          ? "text-sm text-destructive"
                          : "text-sm text-chart-1"
                      }
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do CMV (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cmvData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cmv"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Unidade (R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitsPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Itens com Estoque Baixo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Produto
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Unidade
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Estoque Atual
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Estoque Mínimo
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-sm text-destructive font-medium">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {item.min}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
