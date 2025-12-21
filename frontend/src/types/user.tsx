// User role types
export type UserRole = 
  | 'public'              // Public user (individual)
  | 'institution_user'    // Regular institution employee
  | 'institution_admin'   // Institution administrator
  | 'verifier'            // Institutional verifier
  | 'master_admin'        // Platform super admin

// User interface
export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  organizationName?: string  // For institution users
  avatar?: string
}

// Auth context type
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}