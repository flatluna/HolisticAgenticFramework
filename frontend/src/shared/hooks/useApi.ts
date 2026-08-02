import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import apiClient from '../api-client/apiClient'

export const useApiGet = <T,>(
  key: string | string[],
  url: string,
  options?: UseQueryOptions<T>
) => {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await apiClient.get<T>(url)
      return response.data
    },
    ...options,
  })
}

export const useApiPost = <T, V>(
  url: string,
  options?: UseMutationOptions<T, unknown, V>
) => {
  return useMutation<T, unknown, V>({
    mutationFn: async (data: V) => {
      const response = await apiClient.post<T>(url, data)
      return response.data
    },
    ...options,
  })
}
