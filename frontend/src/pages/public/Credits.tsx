import { useState } from 'react'
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import styles from './Credits.module.css'

interface CreditPackage {
  id: string
  credits: number
  price: number
  bonus: number
  popular?: boolean
}

interface Transaction {
  id: string
  type: 'purchase' | 'usage'
  amount: number
  credits: number
  date: string
  description: string
  status: 'completed' | 'pending' | 'failed'
}

function Credits() {
  const { user } = useAuth()

  // Current balance
  const [balance] = useState({
    credits: 125,
    value: 625, // ₹5 per credit average
  })

  // Credit packages
  const packages: CreditPackage[] = [
    { id: '1', credits: 20, price: 100, bonus: 0 },
    { id: '2', credits: 50, price: 250, bonus: 10, popular: true },
    { id: '3', credits: 120, price: 500, bonus: 30 },
    { id: '4', credits: 300, price: 1000, bonus: 100 },
  ]

  // Transaction history
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'usage',
      amount: -5,
      credits: -1,
      date: '2024-12-14T10:30:00Z',
      description: 'Bill verification - BILL1702845123456',
      status: 'completed',
    },
    {
      id: '2',
      type: 'purchase',
      amount: 250,
      credits: 60,
      date: '2024-12-13T14:20:00Z',
      description: 'Credit purchase - 50 credits + 10 bonus',
      status: 'completed',
    },
    {
      id: '3',
      type: 'usage',
      amount: -10,
      credits: -1,
      date: '2024-12-13T09:15:00Z',
      description: 'Bill verification - BILL1702844987321',
      status: 'completed',
    },
    {
      id: '4',
      type: 'purchase',
      amount: 100,
      credits: 20,
      date: '2024-12-10T16:45:00Z',
      description: 'Credit purchase - 20 credits',
      status: 'completed',
    },
  ])

  // Handle purchase
  const handlePurchase = (pkg: CreditPackage) => {
    alert(`Redirecting to payment gateway for ₹${pkg.price}...`)
    // In real app: redirect to Razorpay/Stripe
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Credits & Billing</h1>
          <p className={styles.subtitle}>Manage your verification credits and transactions</p>
        </div>
      </div>

      {/* Current Balance */}
      <Card variant="elevated" padding="large" className={styles.balanceCard}>
        <div className={styles.balanceContent}>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>Available Credits</span>
            <span className={styles.balanceValue}>{balance.credits}</span>
            <span className={styles.balanceSubtext}>
              Worth {formatCurrency(balance.value)}
            </span>
          </div>
          <div className={styles.balanceIcon}>
            <DollarSign size={48} />
          </div>
        </div>
      </Card>

      {/* Credit Packages */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Buy Credits</h2>
        <p className={styles.sectionDesc}>
          Choose a package that suits your needs. Credits never expire.
        </p>

        <div className={styles.packagesGrid}>
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              variant="elevated"
              padding="large"
              className={`${styles.packageCard} ${pkg.popular ? styles.packageCardPopular : ''}`}
            >
              {pkg.popular && (
                <div className={styles.popularBadge}>
                  <TrendingUp size={14} />
                  Most Popular
                </div>
              )}

              <div className={styles.packageContent}>
                <div className={styles.packageCredits}>
                  {pkg.credits}
                  {pkg.bonus > 0 && (
                    <span className={styles.packageBonus}>+{pkg.bonus}</span>
                  )}
                </div>
                <div className={styles.packageLabel}>Credits</div>

                <div className={styles.packagePrice}>
                  {formatCurrency(pkg.price)}
                </div>

                <div className={styles.packageDetails}>
                  <div className={styles.packageDetail}>
                    <CheckCircle size={16} />
                    <span>Never expires</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className={styles.packageDetail}>
                      <CheckCircle size={16} />
                      <span>{pkg.bonus} bonus credits</span>
                    </div>
                  )}
                  <div className={styles.packageDetail}>
                    <CheckCircle size={16} />
                    <span>Instant activation</span>
                  </div>
                </div>

                <Button
                  variant={pkg.popular ? 'primary' : 'secondary'}
                  fullWidth
                  icon={<CreditCard size={18} />}
                  onClick={() => handlePurchase(pkg)}
                >
                  Buy Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className={styles.section}>
        <Card variant="elevated" padding="large">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Transaction History</h2>
              <p className={styles.sectionDesc}>
                View all your credit purchases and usage
              </p>
            </div>
            <Button
              variant="ghost"
              size="small"
              icon={<Download size={16} />}
            >
              Export CSV
            </Button>
          </div>

          <div className={styles.transactionsList}>
            {transactions.map((transaction) => (
              <div key={transaction.id} className={styles.transactionItem}>
                <div className={styles.transactionIcon}>
                  {transaction.type === 'purchase' ? (
                    <div className={styles.iconPurchase}>
                      <TrendingUp size={20} />
                    </div>
                  ) : (
                    <div className={styles.iconUsage}>
                      <DollarSign size={20} />
                    </div>
                  )}
                </div>

                <div className={styles.transactionContent}>
                  <div className={styles.transactionHeader}>
                    <span className={styles.transactionDesc}>
                      {transaction.description}
                    </span>
                    <span className={styles.transactionDate}>
                      <Calendar size={14} />
                      {formatDate(transaction.date)} at {formatTime(transaction.date)}
                    </span>
                  </div>
                </div>

                <div className={styles.transactionAmounts}>
                  <span
                    className={`${styles.transactionAmount} ${
                      transaction.type === 'purchase'
                        ? styles.transactionAmountPositive
                        : styles.transactionAmountNegative
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                  <span className={styles.transactionCredits}>
                    {transaction.credits > 0 ? '+' : ''}
                    {Math.abs(transaction.credits)} credits
                  </span>
                </div>

                <div className={styles.transactionStatus}>
                  {transaction.status === 'completed' ? (
                    <span className={styles.statusCompleted}>
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : transaction.status === 'pending' ? (
                    <span className={styles.statusPending}>
                      <AlertCircle size={14} />
                      Pending
                    </span>
                  ) : (
                    <span className={styles.statusFailed}>
                      <AlertCircle size={14} />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {transactions.length === 0 && (
            <div className={styles.emptyState}>
              <CreditCard size={48} color="var(--color-text-light)" />
              <h3>No transactions yet</h3>
              <p>Your credit purchases and usage will appear here</p>
            </div>
          )}
        </Card>
      </div>

      {/* Info Section */}
      <div className={styles.infoSection}>
        <Card variant="bordered" padding="large">
          <h3 className={styles.infoTitle}>💡 How Credits Work</h3>
          <ul className={styles.infoList}>
            <li>Each bill verification costs 1-10 credits based on access level</li>
            <li>Credits never expire and can be used anytime</li>
            <li>Bonus credits are added automatically on larger packages</li>
            <li>All transactions are secure and encrypted</li>
            <li>Instant credit activation after successful payment</li>
          </ul>
        </Card>

        <Card variant="bordered" padding="large">
          <h3 className={styles.infoTitle}>🔒 Payment Methods</h3>
          <ul className={styles.infoList}>
            <li>UPI (Google Pay, PhonePe, Paytm)</li>
            <li>Credit/Debit Cards (Visa, Mastercard, RuPay)</li>
            <li>Net Banking (all major banks)</li>
            <li>Wallets (Paytm, Amazon Pay)</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default Credits