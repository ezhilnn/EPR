import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  User, 
  LogOut, 
  Settings, 
  FileText, 
  Search, 
  LayoutDashboard,
  Users,
  Shield,
  DollarSign,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'
import styles from './Header.module.css'

function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowUserMenu(false)
  }

  // Navigation items based on role
  const getNavigationItems = () => {
    if (!user) return []

    switch (user.role) {
      case 'public':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
          { label: 'Verify Bill', icon: <Search size={18} />, path: '/verify' },
          { label: 'History', icon: <FileText size={18} />, path: '/history' },
          { label: 'Credits', icon: <DollarSign size={18} />, path: '/credits' },
        ]

      case 'institution_user':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/institution/dashboard' },
          { label: 'Generate Bill', icon: <FileText size={18} />, path: '/institution/generate' },
          { label: 'My Bills', icon: <FileText size={18} />, path: '/institution/bills' },
        ]

      case 'institution_admin':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/institution/admin/dashboard' },
          { label: 'Generate Bill', icon: <FileText size={18} />, path: '/institution/generate' },
          { label: 'All Bills', icon: <FileText size={18} />, path: '/institution/admin/bills' },
          { label: 'Manage Users', icon: <Users size={18} />, path: '/institution/admin/users' },
          { label: 'Settings', icon: <Settings size={18} />, path: '/institution/admin/settings' },
        ]

      case 'verifier':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/verifier/dashboard' },
          { label: 'Verify Bill', icon: <Search size={18} />, path: '/verifier/verify' },
          { label: 'Bulk Verify', icon: <FileText size={18} />, path: '/verifier/bulk-verify' },
          { label: 'History', icon: <FileText size={18} />, path: '/verifier/history' },
        ]

      case 'master_admin':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/master-admin/dashboard' },
          { label: 'Institutions', icon: <Users size={18} />, path: '/master-admin/institutions' },
          { label: 'Users', icon: <Users size={18} />, path: '/master-admin/users' },
          { label: 'Bills', icon: <FileText size={18} />, path: '/master-admin/bills' },
          { label: 'Security', icon: <Shield size={18} />, path: '/master-admin/security' },
        ]

      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  // User menu items (dropdown)
  const getUserMenuItems = () => {
    if (!user) return []

    const commonItems = [
      { label: 'Profile', icon: <User size={16} />, action: () => navigate('/settings') },
      { label: 'Settings', icon: <Settings size={16} />, action: () => navigate('/settings') },
      { label: 'Logout', icon: <LogOut size={16} />, action: handleLogout },
    ]

    return commonItems
  }

  const userMenuItems = getUserMenuItems()

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <Shield size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>EPR Platform</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className={styles.nav}>
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={styles.navLink}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side */}
        <div className={styles.rightSection}>
          {isAuthenticated ? (
            <>
              {/* User Menu */}
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  className={styles.userButton}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className={styles.userAvatar}>
                    {user?.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.fullName}</span>
                    <span className={styles.userRole}>
                      {user?.role.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown size={18} />
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className={styles.dropdown}>
                    {user?.organizationName && (
                      <div className={styles.orgName}>
                        {user.organizationName}
                      </div>
                    )}
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        className={styles.dropdownItem}
                        onClick={() => {
                          item.action()
                          setShowUserMenu(false)
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className={styles.mobileMenuButton}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            /* Not logged in - show Login/Register */
            <div className={styles.authButtons}>
              <Button
                variant="ghost"
                size="small"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && showMobileMenu && (
        <div className={styles.mobileNav}>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={styles.mobileNavLink}
              onClick={() => setShowMobileMenu(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

export default Header