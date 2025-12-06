import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeFormValues, employeeSchema } from "@/lib/schemas";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { User } from "@/types";
import { useUnits } from "@/hooks/use-units";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/constants";

interface EmployeeFormProps {
    userToEdit?: User | null;
    onSubmit: (data: EmployeeFormValues) => void;
    isLoading: boolean;
    onCancel: () => void;
}

const WEEKDAYS = [
    { id: 1, label: "Seg" },
    { id: 2, label: "Ter" },
    { id: 3, label: "Qua" },
    { id: 4, label: "Qui" },
    { id: 5, label: "Sex" },
    { id: 6, label: "Sáb" },
    { id: 0, label: "Dom" },
];

export function EmployeeForm({ userToEdit, onSubmit, isLoading, onCancel }: EmployeeFormProps) {
    const { user: currentUser } = useAuth();
    const { data: units = [] } = useUnits();

    // Determine default values
    const defaultValues: Partial<EmployeeFormValues> = userToEdit ? {
        // Personal
        name: userToEdit.name || "",
        email: userToEdit.email,
        cpf: userToEdit.cpf || "",
        rg: userToEdit.rg || "",
        birthDate: userToEdit.birthDate || "",
        phone: userToEdit.phone || "",
        pis: userToEdit.pis || "",

        // Address
        addressZip: userToEdit.addressZip || "",
        addressStreet: userToEdit.addressStreet || "",
        addressNumber: userToEdit.addressNumber || "",
        addressComp: userToEdit.addressComp || "",
        addressDistrict: userToEdit.addressDistrict || "",
        addressCity: userToEdit.addressCity || "",
        addressState: userToEdit.addressState || "",

        // Contract
        role: userToEdit.role as any,
        unitId: userToEdit.unitId || "",
        admissionDate: userToEdit.admissionDate || "",
        hourlyRate: userToEdit.hourlyRate?.toString() || "",
        workSchedule: userToEdit.workSchedule || {
            type: "standard",
            workDays: [1, 2, 3, 4, 5]
        },
    } : {
        name: "",
        email: "",
        role: "operator",
        unitId: "",
        workSchedule: { type: "standard", workDays: [1, 2, 3, 4, 5] }
    };

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues,
    });

    const isManager = currentUser?.role === 'manager';

    // Auto-set unit for manager
    useEffect(() => {
        if (!userToEdit && isManager && currentUser?.unitId) {
            form.setValue("unitId", currentUser.unitId);
        }
    }, [userToEdit, isManager, currentUser, form]);

    const scheduleType = form.watch("workSchedule.type");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                        <TabsTrigger value="address">Endereço</TabsTrigger>
                        <TabsTrigger value="contract">Contrato & Acesso</TabsTrigger>
                    </TabsList>

                    {/* Dados Pessoais */}
                    <TabsContent value="personal" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo *</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl><Input {...field} disabled={!!userToEdit} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="cpf"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rg"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RG</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Nasc.</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pis"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PIS</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* Endereço */}
                    <TabsContent value="address" className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="addressZip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CEP</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="addressStreet"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logradouro</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="addressNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="addressComp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="addressDistrict"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bairro</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="addressCity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="addressState"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>UF</FormLabel>
                                        <FormControl><Input {...field} maxLength={2} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* Contrato & Acesso */}
                    <TabsContent value="contract" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cargo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROLES.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch("role") !== 'admin' && (
                                <FormField
                                    control={form.control}
                                    name="unitId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unidade Principal</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isManager && !!currentUser?.unitId}
                                            >
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {units.map((unit) => (
                                                        <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="admissionDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Admissão</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="hourlyRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Hora (R$)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border pt-4 mt-4">
                            <h3 className="font-semibold mb-3">Jornada de Trabalho</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <FormField
                                    control={form.control}
                                    name="workSchedule.type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="standard">Padrão</SelectItem>
                                                    <SelectItem value="12x36">12x36</SelectItem>
                                                    <SelectItem value="flexible">Flexível</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {scheduleType === 'standard' && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="workSchedule.startTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Entrada</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="workSchedule.endTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Saída</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </div>

                            {scheduleType === 'standard' && (
                                <FormField
                                    control={form.control}
                                    name="workSchedule.workDays"
                                    render={() => (
                                        <FormItem>
                                            <div className="mb-2"><FormLabel>Dias da Semana</FormLabel></div>
                                            <div className="flex flex-wrap gap-4">
                                                {WEEKDAYS.map((day) => (
                                                    <FormField
                                                        key={day.id}
                                                        control={form.control}
                                                        name="workSchedule.workDays"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={day.id}
                                                                    className="flex flex-row items-center space-x-2 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(day.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), day.id])
                                                                                    : field.onChange(
                                                                                        field.value?.filter(
                                                                                            (value) => value !== day.id
                                                                                        )
                                                                                    )
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">
                                                                        {day.label}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Colaborador
                    </Button>
                </div>
            </form>
        </Form>
    );
}
