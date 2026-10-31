import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useAuth } from '@/app/auth'

export const useCars = () => {
  const { user } = useAuth()
  return useQuery({ queryKey: ['cars'], queryFn: () => api.listCars(), staleTime: 60_000, enabled: !!user })
}

export const useCar = (id: number) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['car', id],
    queryFn: () => api.getCar(id),
    staleTime: 30_000,
    enabled: !!user && Number.isFinite(id),
  })
}

export const useCategories = () => {
  const { user } = useAuth()
  return useQuery({ queryKey: ['categories'], queryFn: () => api.listCategories(), staleTime: 10 * 60_000, enabled: !!user })
}

export const useCoupons = () => {
  const { user } = useAuth()
  return useQuery({ queryKey: ['coupons'], queryFn: () => api.listCoupons(), staleTime: 10 * 60_000, enabled: !!user })
}

export const useCustomers = () => {
  const { isAdmin } = useAuth()
  return useQuery({ queryKey: ['customers'], queryFn: () => api.listCustomers(), staleTime: 5 * 60_000, enabled: isAdmin })
}

export const useAllBookings = () => {
  const { isAdmin } = useAuth()
  return useQuery({ queryKey: ['all-bookings'], queryFn: () => api.listBookings(), staleTime: 30_000, enabled: isAdmin })
}
