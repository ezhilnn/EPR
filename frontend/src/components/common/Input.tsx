import { type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  fullWidth?: boolean
}

function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  type = 'text',
  className = '',
  ...rest
}: InputProps) {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false)

  // If it's a password field, allow toggling visibility
  const inputType = type === 'password' && showPassword ? 'text' : type

  // Build container class names
  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
  ].join(' ')

  // Build input class names
  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
    icon ? styles.inputWithIcon : '',
    className,
  ].join(' ')

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className={styles.inputWrapper}>
        {/* Icon (if provided) */}
        {icon && (
          <span className={styles.iconLeft}>
            {icon}
          </span>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          className={inputClasses}
          {...rest}
        />

        {/* Password Toggle Button */}
        {type === 'password' && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <span className={styles.error}>
          {error}
        </span>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <span className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}

export default Input