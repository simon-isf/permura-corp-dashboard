import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService, UserWithCompany, CreateUserData, UpdateUserData } from '@/services/usersService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export const useUsers = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth()

  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery<UserWithCompany[]>({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
    enabled: isAuthenticated && isSuperAdmin, // Only super admins can fetch users
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    users: users || [],
    loading: isLoading,
    error,
    refetch
  }
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (userData: CreateUserData) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: "Success",
        description: "User created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UpdateUserData }) => 
      usersService.updateUser(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: "Success",
        description: "User updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  })
}
