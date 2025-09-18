import { supabaseClient, Profile, UserRole } from '@/lib/supabase'

export interface UserWithCompany extends Profile {
  company_name?: string | null
}

export interface CreateUserData {
  email: string
  password: string
  role: UserRole
  company_id?: string
}

export interface UpdateUserData {
  role?: UserRole
  company_id?: string
}

class UsersService {
  async getUsers(): Promise<UserWithCompany[]> {
    try {
      const { data, error } = await supabaseClient.functions.invoke('admin-users', {
        method: 'GET'
      })

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getUsers:', error)
      throw error
    }
  }

  async createUser(userData: CreateUserData): Promise<Profile> {
    try {
      const { data, error } = await supabaseClient.functions.invoke('admin-users', {
        method: 'POST',
        body: userData
      })

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createUser:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: UpdateUserData): Promise<Profile> {
    try {
      const { data, error } = await supabaseClient.functions.invoke(`admin-users?id=${userId}`, {
        method: 'PUT',
        body: updates
      })

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateUser:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabaseClient.functions.invoke(`admin-users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Error deleting user:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteUser:', error)
      throw error
    }
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // This would require a separate edge function for password reset
      // For now, we'll implement this as a placeholder
      console.log('Password reset functionality to be implemented')
      throw new Error('Password reset functionality not yet implemented')
    } catch (error) {
      console.error('Error in resetUserPassword:', error)
      throw error
    }
  }
}

export const usersService = new UsersService()
