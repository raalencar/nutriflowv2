import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, UnitFormValues } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Building2, MapPin, FileText, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MealOffer } from "@/types";

interface UnitFormProps {
    defaultValues?: Partial<UnitFormValues>;
    onSubmit: (data: UnitFormValues) => void;
    isSubmitting?: boolean;
    editMode?: boolean;
    mealOffers?: MealOffer[];
}

export function UnitForm({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    editMode = false,
    mealOffers = [],
}: UnitFormProps) {
    const form = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: defaultValues || {
            name: "",
            type: "spoke",
            address: "",
            fullAddress: "",
            phone: "",
            manager: "",
            contractNumber: "",
            contractManager: "",
            mealOffers: [],
            latitude: "",
            longitude: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="geral" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="geral" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Geral
                        </TabsTrigger>
                        <TabsTrigger value="endereco" className="gap-2">
                            <MapPin className="h-4 w-4" />
                            Endereço
                        </TabsTrigger>
                        <TabsTrigger value="contrato" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Contrato
                        </TabsTrigger>
                    </TabsList>

                    {/* Aba Geral */}
                    <TabsContent value="geral" className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Unidade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Cozinha Central" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="hub">Hub (Matriz)</SelectItem>
                                                <SelectItem value="spoke">Spoke (Filial)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 0000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="manager"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Responsável</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do responsável" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    {/* Aba Endereço */}
                    <TabsContent value="endereco" className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço Resumido</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Rua das Flores, 123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fullAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Endereço completo com número, complemento, CEP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Latitude</FormLabel>
                                        <FormControl>
                                            <Input placeholder="-23.550520" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Longitude</FormLabel>
                                        <FormControl>
                                            <Input placeholder="-46.633308" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* Aba Contrato */}
                    <TabsContent value="contrato" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contractNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número do Contrato</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 2024/001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contractManager"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gestor do Contrato</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do gestor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="mealOffers"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Ofertas Contratadas</FormLabel>
                                    {mealOffers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Nenhuma oferta cadastrada. Cadastre ofertas primeiro.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {mealOffers.map((offer) => (
                                                <FormField
                                                    key={offer.id}
                                                    control={form.control}
                                                    name="mealOffers"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(offer.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), offer.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== offer.id
                                                                                )
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal">
                                                                {offer.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editMode ? "Salvar Alterações" : "Cadastrar Unidade"}
                </Button>
            </form>
        </Form>
    );
}
