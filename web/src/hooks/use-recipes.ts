import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, CreateRecipeDTO, UpdateRecipeDTO } from "@/lib/api";

export function useRecipes() {
    return useQuery({
        queryKey: ["recipes"],
        queryFn: getRecipes,
    });
}

export function useCreateRecipe() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
        },
    });
}

export function useUpdateRecipe() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateRecipeDTO }) => updateRecipe(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
        },
    });
}

export function useDeleteRecipe() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRecipe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
        },
    });
}
