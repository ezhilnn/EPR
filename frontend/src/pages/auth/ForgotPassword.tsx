import { useState, type FormEvent } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import styles from './ForgotPassword.module.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.box}>
          <Card variant="elevated" padding="large">
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle size={64} />
              </div>
              <h2 className={styles.successTitle}>Check Your Email</h2>
              <p className={styles.successMessage}>
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className={styles.successNote}>
                If you don't see the email, check your spam folder.
              </p>
              <Link to="/login">
                <Button variant="primary" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.subtitle}>
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        <Card variant="elevated" padding="large">
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              isLoading={isSubmitting}
            >
              Send Reset Instructions
            </Button>

            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword