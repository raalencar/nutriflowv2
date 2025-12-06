import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getStocks, createMovement, getInventoryTransactions,
    getProductionPlans, createProductionPlan, completeProductionPlan, deleteProductionPlan,
    getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
    InventoryTransactionDTO, CreateProductionPlanDTO, CreatePurchaseOrderDTO
} from "@/lib/api";

// Inventory Hooks
export function useStocks(unitId?: string) {
    return useQuery({
        queryKey: ["stocks", unitId],
        queryFn: () => getStocks(unitId),
        enabled: true // Always fetch, or depend on unitId if strictly required
    });
}

export function useCreateMovement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createMovement,
        onSuccess: () => {
            // Invalidate stocks to refresh list
            queryClient.invalidateQueries({ queryKey: ["stocks"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        }
    });
}

export function useInventoryTransactions(unitId?: string) {
    return useQuery({
        queryKey: ["inventory-transactions", unitId],
        queryFn: () => getInventoryTransactions(unitId),
    });
}

// Production Hooks
export function useProductionPlans(unitId?: string) {
    return useQuery({
        queryKey: ["production-plans", unitId],
        queryFn: () => getProductionPlans(unitId),
    });
}

export function useCreateProductionPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProductionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
        }
    });
}

export function useCompleteProductionPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: completeProductionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
            // Also invalidate stocks because completion changes stock
            queryClient.invalidateQueries({ queryKey: ["stocks"] });
        }
    });
}

export function useDeleteProductionPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProductionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["production-plans"] });
        }
    });
}

// Purchase Hooks
export function usePurchaseOrders(unitId?: string) {
    return useQuery({
        queryKey: ["purchase-orders", unitId],
        queryFn: () => getPurchaseOrders(unitId),
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        }
    });
}

export function useReceivePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: receivePurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            // Also invalidate stocks
            queryClient.invalidateQueries({ queryKey: ["stocks"] });
        }
    });
}
