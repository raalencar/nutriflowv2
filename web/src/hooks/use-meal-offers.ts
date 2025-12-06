import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealOffers, createMealOffer, updateMealOffer, deleteMealOffer, MealOffer, CreateMealOfferDTO, UpdateMealOfferDTO } from '@/lib/api';

export function useMealOffers() {
    return useQuery({
        queryKey: ['mealOffers'],
        queryFn: getMealOffers,
    });
}

export function useCreateMealOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMealOfferDTO) => createMealOffer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mealOffers'] });
        },
    });
}

export function useUpdateMealOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMealOfferDTO }) => updateMealOffer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mealOffers'] });
        },
    });
}

export function useDeleteMealOffer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMealOffer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mealOffers'] });
        },
    });
}
