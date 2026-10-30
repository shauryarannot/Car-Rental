import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export const useCars = () =>
  useQuery({ queryKey: ['cars'], queryFn: () => api.listCars(), staleTime: 60_000 })

export const useCar = (id: number) =>
  useQuery({ queryKey: ['car', id], queryFn: () => api.getCar(id), staleTime: 30_000, enabled: Number.isFinite(id) })

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: () => api.listCategories(), staleTime: 10 * 60_000 })

export const useCoupons = () =>
  useQuery({ queryKey: ['coupons'], queryFn: () => api.listCoupons(), staleTime: 10 * 60_000 })

export const useCustomers = () =>
  useQuery({ queryKey: ['customers'], queryFn: () => api.listCustomers(), staleTime: 5 * 60_000 })
