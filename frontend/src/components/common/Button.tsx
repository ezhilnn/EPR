import type { ReactNode, ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

// Define the props our Button accepts
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  isLoading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  // Build class names dynamically
  const buttonClasses = [
  styles.button,
  styles[variant],
  styles[size],
  fullWidth ? styles.fullWidth : '',
  isLoading ? styles.loading : '',
  className
].join(' ')

  return (
    <button 
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={styles.iconLeft}>{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className={styles.iconRight}>{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

export default Button