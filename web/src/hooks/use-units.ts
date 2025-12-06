import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnits, createUnit, updateUnit, deleteUnit, CreateUnitDTO, UpdateUnitDTO } from "@/lib/api";

export function useUnits() {
    return useQuery({
        queryKey: ["units"],
        queryFn: getUnits,
    });
}

export function useCreateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}

export function useUpdateUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUnitDTO }) => updateUnit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}

export function useDeleteUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
}
