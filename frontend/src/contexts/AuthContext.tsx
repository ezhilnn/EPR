import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, AuthContextType } from '../types/user'

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    // For now, simulate login based on email
    
    let mockUser: User
    
    if (email.includes('admin@epr')) {
      mockUser = {
        id: '1',
        fullName: 'Master Admin',
        email: email,
        role: 'master_admin',
      }
    } else if (email.includes('instadmin@')) {
      mockUser = {
        id: '2',
        fullName: 'Institution Admin',
        email: email,
        role: 'institution_admin',
        organizationName: 'ABC Corporation',
      }
    } else if (email.includes('inst@')) {
      mockUser = {
        id: '3',
        fullName: 'Institution User',
        email: email,
        role: 'institution_user',
        organizationName: 'ABC Corporation',
      }
    } else if (email.includes('verifier@')) {
      mockUser = {
        id: '4',
        fullName: 'Verifier User',
        email: email,
        role: 'verifier',
        organizationName: 'XYZ Bank',
      }
    } else {
      mockUser = {
        id: '5',
        fullName: 'Public User',
        email: email,
        role: 'public',
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}