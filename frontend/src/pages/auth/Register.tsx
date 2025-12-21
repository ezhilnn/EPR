import { useState, type FormEvent } from 'react'
import { Mail, User, Phone, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import styles from './Register.module.css'

// User type options
const userTypes = [
  { value: 'public', label: 'Public User', description: 'Individual verification' },
  { value: 'institution', label: 'Institution', description: 'Generate bills' },
  { value: 'verifier', label: 'Institutional Verifier', description: 'Verify bills (KYC required)' },
]

function Register() {
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'public',
    agreeToTerms: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Error state
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: '',
  })

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return strength
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const getPasswordStrengthLabel = () => {
    if (formData.password.length === 0) return { text: '', color: '' }
    if (passwordStrength <= 1) return { text: 'Weak', color: 'var(--color-alert)' }
    if (passwordStrength <= 3) return { text: 'Medium', color: 'var(--color-warning)' }
    return { text: 'Strong', color: 'var(--color-success)' }
  }

  // Handle input changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: '',
    }

    let hasError = false

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
      hasError = true
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters'
      hasError = true
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
      hasError = true
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
      hasError = true
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits'
      hasError = true
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
      hasError = true
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
      hasError = true
    } else if (passwordStrength < 2) {
      newErrors.password = 'Password is too weak'
      hasError = true
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
      hasError = true
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      hasError = true
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
      hasError = true
    }

    setErrors(newErrors)
    return !hasError
  }

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Simulate API call
    setIsLoading(true)
    setTimeout(() => {
      console.log('Register:', formData)
      alert('Registration successful! (This is just a demo)')
      setIsLoading(false)
      navigate('/login')
    }, 2000)
  }

  const strengthLabel = getPasswordStrengthLabel()

  return (
    <div className={styles.container}>
      <div className={styles.registerBox}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join the EPR Platform</p>
        </div>

        {/* Register Card */}
        <Card variant="elevated" padding="large">
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* User Type Selection */}
            <div className={styles.userTypeSection}>
              <label className={styles.fieldLabel}>I am a:</label>
              <div className={styles.userTypeGrid}>
                {userTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`${styles.userTypeCard} ${
                      formData.userType === type.value ? styles.userTypeCardActive : ''
                    }`}
                    onClick={() => handleChange('userType', type.value)}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => handleChange('userType', e.target.value)}
                      className={styles.radioInput}
                    />
                    <div className={styles.userTypeContent}>
                      <h4 className={styles.userTypeLabel}>{type.label}</h4>
                      <p className={styles.userTypeDesc}>{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              icon={<User size={18} />}
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={errors.fullName}
              fullWidth
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              fullWidth
            />

            {/* Phone */}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              icon={<Phone size={18} />}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              helperText="10 digits without country code"
              fullWidth
            />

            {/* Password with Strength Indicator */}
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                fullWidth
              />
              {formData.password && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles.strengthBarFill}
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: strengthLabel.color,
                      }}
                    />
                  </div>
                  <span
                    className={styles.strengthLabel}
                    style={{ color: strengthLabel.color }}
                  >
                    {strengthLabel.text}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              fullWidth
            />

            {/* Terms & Conditions */}
            <div className={styles.termsSection}>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                  className={styles.termsCheckbox}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className={styles.termsLink}>
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className={styles.termsLink}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <span className={styles.termsError}>
                  <AlertCircle size={14} />
                  {errors.agreeToTerms}
                </span>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </Button>

            {/* Login Link */}
            <div className={styles.footer}>
              <span className={styles.footerText}>
                Already have an account?{' '}
                <Link to="/login" className={styles.loginLink}>
                  Login here
                </Link>
              </span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Register