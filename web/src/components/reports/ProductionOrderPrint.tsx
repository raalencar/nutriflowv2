import React, { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductionOrderPrintProps {
    data: {
        id: string;
        recipeName: string;
        unitName: string;
        date: string;
        quantity: number;
        recipe?: {
            ingredients: Array<{
                productName?: string;
                grossQty: number;
                unit: string;
            }>;
        };
        ingredients?: Array<{
            productName: string;
            totalNeeded: number;
            unit: string;
        }>;
    } | null;
}

export const ProductionOrderPrint = forwardRef<HTMLDivElement, ProductionOrderPrintProps>(
    ({ data }, ref) => {
        if (!data) return null;

        const emissionDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
        const productionDate = format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR });

        // Calculate ingredients if not provided
        const ingredientsList = data.ingredients ||
            data.recipe?.ingredients.map(ing => ({
                productName: ing.productName || "Produto desconhecido",
                totalNeeded: ing.grossQty * data.quantity,
                unit: ing.unit
            })) || [];

        return (
            <div ref={ref} className="hidden print:block">
                <div className="p-8 bg-white text-black font-sans max-w-[210mm] mx-auto">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold">RD7 Soluções</h1>
                                <p className="text-sm text-gray-600">Sistema de Gestão de Produção</p>
                            </div>
                            <div className="text-right text-sm">
                                <p><strong>Emissão:</strong> {emissionDate}</p>
                                <p><strong>Unidade:</strong> {data.unitName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold uppercase tracking-wide">
                            ORDEM DE PRODUÇÃO #{data.id.slice(0, 8)}
                        </h2>
                    </div>

                    {/* Production Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-300 p-4">
                        <div>
                            <p className="text-sm text-gray-600">Receita:</p>
                            <p className="font-semibold text-lg">{data.recipeName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Data de Produção:</p>
                            <p className="font-semibold text-lg">{productionDate}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Quantidade Planejada:</p>
                            <p className="font-semibold text-lg">{data.quantity} porções</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Ingredientes:</p>
                            <p className="font-semibold text-lg">{ingredientsList.length} itens</p>
                        </div>
                    </div>

                    {/* Ingredients Table */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-3 uppercase">Lista de Insumos Necessários</h3>
                        <table className="w-full border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2 text-left w-12">✓</th>
                                    <th className="border border-gray-400 p-2 text-left">Produto</th>
                                    <th className="border border-gray-400 p-2 text-right w-32">Quantidade</th>
                                    <th className="border border-gray-400 p-2 text-center w-24">Unidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredientsList.length > 0 ? (
                                    ingredientsList.map((ing, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-400 p-2 text-center">
                                                <div className="w-5 h-5 border-2 border-gray-400 mx-auto"></div>
                                            </td>
                                            <td className="border border-gray-400 p-2">{ing.productName}</td>
                                            <td className="border border-gray-400 p-2 text-right font-mono">
                                                {Number(ing.totalNeeded).toFixed(3)}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center">{ing.unit}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="border border-gray-400 p-4 text-center text-gray-500">
                                            Nenhum ingrediente disponível
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Instructions Section */}
                    <div className="mb-8 border border-gray-300 p-4">
                        <h3 className="text-sm font-bold mb-2">OBSERVAÇÕES:</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                            <p>• Verificar disponibilidade de todos os insumos antes de iniciar.</p>
                            <p>• Marcar os itens na coluna de check conforme forem separados.</p>
                            <p>• Comunicar imediatamente qualquer divergência encontrada.</p>
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-12 pt-6 border-t border-gray-400">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm text-gray-600 mb-8">Separado por:</p>
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="text-xs text-center">Assinatura / Data</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-8">Conferido por:</p>
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="text-xs text-center">Assinatura / Data</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page Break Helper for multiple pages */}
                    <style>{`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          `}</style>
                </div>
            </div>
        );
    }
);

ProductionOrderPrint.displayName = "ProductionOrderPrint";
