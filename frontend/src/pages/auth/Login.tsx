import { useEffect, useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import styles from './Login.module.css'
import { useAuth } from '../../contexts/AuthContext'

function Login() {
    const { user , login } = useAuth()
    const navigate = useNavigate()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Error state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })
useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'public':
          navigate('/dashboard')
          break
        case 'institution_user':
        case 'institution_admin':
          navigate('/institution/dashboard')
          break
        case 'verifier':
          navigate('/verifier/dashboard')
          break
        case 'master_admin':
          navigate('/master-admin/dashboard')
          break
        default:
          navigate('/')
      }
    }
  }, [user, navigate])

  // Handle form submission
//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault()

//     // Reset errors
//     setErrors({ email: '', password: '' })

//     // Validation
//     let hasError = false
//     const newErrors = { email: '', password: '' }

//     if (!email) {
//       newErrors.email = 'Email is required'
//       hasError = true
//     } else if (!/\S+@\S+\.\S+/.test(email)) {
//       newErrors.email = 'Email is invalid'
//       hasError = true
//     }

//     if (!password) {
//       newErrors.password = 'Password is required'
//       hasError = true
//     } else if (password.length < 8) {
//       newErrors.password = 'Password must be at least 8 characters'
//       hasError = true
//     }

//     if (hasError) {
//       setErrors(newErrors)
//       return
//     }

//     // Simulate API call
//     setIsLoading(true)
//     setTimeout(() => {
//       console.log('Login:', { email, password, rememberMe })
//       alert('Login successful! (This is just a demo)')
//       setIsLoading(false)
//     }, 1500)
//   }
  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()

  // Reset errors
  setErrors({ email: '', password: '' })

  // Validation
  let hasError = false
  const newErrors = { email: '', password: '' }

  if (!email) {
    newErrors.email = 'Email is required'
    hasError = true
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    newErrors.email = 'Email is invalid'
    hasError = true
  }

  if (!password) {
    newErrors.password = 'Password is required'
    hasError = true
  } else if (password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters'
    hasError = true
  }

  if (hasError) {
    setErrors(newErrors)
    return
  }

  // Use auth context login
  setIsLoading(true)
  try {
    await login(email, password)
    // navigate('/dashboard')  // Redirect to dashboard after login
  } catch (error) {
    alert('Login failed')
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        {/* Logo/Title */}
        <div className={styles.header}>
          <h1 className={styles.title}>EPR Platform</h1>
          <p className={styles.subtitle}>Login to your account</p>
        </div>

        {/* Login Card */}
        <Card variant="elevated" padding="large">
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              fullWidth
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              fullWidth
            />

            {/* Remember Me & Forgot Password */}
            <div className={styles.options}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              isLoading={isLoading}
            >
              Login
            </Button>

            {/* Register Link */}
            <div className={styles.footer}>
              <span className={styles.footerText}>
                Don't have an account?{' '}
                <Link to="/register" className={styles.registerLink}>
                  Register here
                </Link>
              </span>
            </div>
          </form>
        </Card>

        {/* User Type Selection */}
        <div className={styles.userTypes}>
          <p className={styles.userTypesTitle}>Login as:</p>
          <div className={styles.userTypeButtons}>
            <Button variant="ghost" size="small">
              Public User
            </Button>
            <Button variant="ghost" size="small">
              Institution
            </Button>
            <Button variant="ghost" size="small">
              Verifier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login