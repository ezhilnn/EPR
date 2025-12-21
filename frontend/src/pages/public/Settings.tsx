import { useState, type FormEvent } from 'react'
import { User, Mail, Phone, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import styles from './Settings.module.css'

function Settings() {
  const { user } = useAuth()

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
  })

  const [profileErrors, setProfileErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    verificationAlerts: true,
    creditAlerts: true,
    monthlyReport: false,
  })

  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)

  // Success messages
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [notificationSuccess, setNotificationSuccess] = useState(false)

  // Handle profile form submission
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileErrors({ fullName: '', email: '', phone: '' })
    setProfileSuccess(false)

    // Validation
    let hasError = false
    const newErrors = { fullName: '', email: '', phone: '' }

    if (!profileForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
      hasError = true
    }

    if (!profileForm.email) {
      newErrors.email = 'Email is required'
      hasError = true
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Email is invalid'
      hasError = true
    }

    if (profileForm.phone && !/^\d{10}$/.test(profileForm.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits'
      hasError = true
    }

    if (hasError) {
      setProfileErrors(newErrors)
      return
    }

    // Simulate API call
    setIsUpdatingProfile(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsUpdatingProfile(false)
    setProfileSuccess(true)

    // Hide success message after 10 seconds
    setTimeout(() => setProfileSuccess(false), 10000)
  }

  // Handle password form submission
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordSuccess(false)

    // Validation
    let hasError = false
    const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' }

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
      hasError = true
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required'
      hasError = true
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
      hasError = true
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
      hasError = true
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
      hasError = true
    }

    if (hasError) {
      setPasswordErrors(newErrors)
      return
    }

    // Simulate API call
    setIsUpdatingPassword(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsUpdatingPassword(false)
    setPasswordSuccess(true)

    // Clear password fields
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    // Hide success message after 10 seconds
    setTimeout(() => setPasswordSuccess(false), 10000)
  }

  // Handle notification preferences update
  const handleNotificationUpdate = async () => {
    setNotificationSuccess(false)
    setIsUpdatingNotifications(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsUpdatingNotifications(false)
    setNotificationSuccess(true)

    // Hide success message after 10 seconds
    setTimeout(() => setNotificationSuccess(false), 10000)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>Manage your profile and preferences</p>
      </div>

      <div className={styles.content}>
        {/* Profile Information */}
        <Card variant="elevated" padding="large">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Profile Information</h2>
            <p className={styles.sectionSubtitle}>Update your personal details</p>
          </div>

          {profileSuccess && (
            <div className={styles.successAlert}>
              <div className={styles.successIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.successContent}>
                <h4 className={styles.successTitle}>Success!</h4>
                <p className={styles.successMessage}>Your profile has been updated successfully.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                icon={<User size={18} />}
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                error={profileErrors.fullName}
                fullWidth
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail size={18} />}
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                error={profileErrors.email}
                fullWidth
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                icon={<Phone size={18} />}
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                error={profileErrors.phone}
                helperText="10 digits without country code"
                fullWidth
              />
            </div>

            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={18} />}
                isLoading={isUpdatingProfile}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card variant="elevated" padding="large">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Change Password</h2>
            <p className={styles.sectionSubtitle}>Update your account password</p>
          </div>

          {passwordSuccess && (
            <div className={styles.successAlert}>
              <div className={styles.successIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.successContent}>
                <h4 className={styles.successTitle}>Password Changed!</h4>
                <p className={styles.successMessage}>Your password has been updated successfully.</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                error={passwordErrors.currentPassword}
                fullWidth
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                error={passwordErrors.newPassword}
                helperText="At least 8 characters"
                fullWidth
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                error={passwordErrors.confirmPassword}
                fullWidth
              />
            </div>

            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                icon={<Lock size={18} />}
                isLoading={isUpdatingPassword}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Notification Preferences */}
        <Card variant="elevated" padding="large">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Notification Preferences</h2>
            <p className={styles.sectionSubtitle}>Choose how you want to be notified</p>
          </div>

          {notificationSuccess && (
            <div className={styles.successAlert}>
              <div className={styles.successIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.successContent}>
                <h4 className={styles.successTitle}>Preferences Saved!</h4>
                <p className={styles.successMessage}>Your notification preferences have been updated.</p>
              </div>
            </div>
          )}

          <div className={styles.notificationList}>
            <label className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Email Notifications</span>
                <span className={styles.notificationDesc}>Receive notifications via email</span>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
              />
            </label>

            <label className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>SMS Notifications</span>
                <span className={styles.notificationDesc}>Receive notifications via SMS</span>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={notifications.smsNotifications}
                onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
              />
            </label>

            <label className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Verification Alerts</span>
                <span className={styles.notificationDesc}>Notify when bills are verified</span>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={notifications.verificationAlerts}
                onChange={(e) => setNotifications({ ...notifications, verificationAlerts: e.target.checked })}
              />
            </label>

            <label className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Credit Alerts</span>
                <span className={styles.notificationDesc}>Notify when credits are low</span>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={notifications.creditAlerts}
                onChange={(e) => setNotifications({ ...notifications, creditAlerts: e.target.checked })}
              />
            </label>

            <label className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>Monthly Report</span>
                <span className={styles.notificationDesc}>Receive monthly activity summary</span>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={notifications.monthlyReport}
                onChange={(e) => setNotifications({ ...notifications, monthlyReport: e.target.checked })}
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="primary"
              icon={<Save size={18} />}
              isLoading={isUpdatingNotifications}
              onClick={handleNotificationUpdate}
            >
              Save Preferences
            </Button>
          </div>
        </Card>

        {/* Account Information (Read-only) */}
        <Card variant="bordered" padding="large">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Account Information</h2>
            <p className={styles.sectionSubtitle}>Your account details</p>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Account Type</span>
              <span className={styles.infoValue}>Public User</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Member Since</span>
              <span className={styles.infoValue}>December 2024</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Account Status</span>
              <span className={styles.infoValue}>
                <span className={styles.statusActive}>● Active</span>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Settings