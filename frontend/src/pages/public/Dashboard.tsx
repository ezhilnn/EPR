import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Search,
  CreditCard,
  Calendar,
  Download
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import styles from './Dashboard.module.css'

// Mock data types
interface Verification {
  id: string
  billNumber: string
  issuerName: string
  date: string
  result: 'valid' | 'invalid' | 'restricted' | 'suspicious' | 'not_found'
  amount: number
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Mock data - will be replaced with API calls later
  const [stats] = useState({
    totalVerifications: 47,
    creditsRemaining: 125,
    amountSpent: 235,
    successRate: 89,
  })

  const [recentVerifications] = useState<Verification[]>([
    {
      id: '1',
      billNumber: 'BILL1702845123456',
      issuerName: 'ABC Corporation',
      date: '2024-12-14',
      result: 'valid',
      amount: 5,
    },
    {
      id: '2',
      billNumber: 'BILL1702844987321',
      issuerName: 'XYZ Pvt Ltd',
      date: '2024-12-13',
      result: 'valid',
      amount: 5,
    },
    {
      id: '3',
      billNumber: 'BILL1702843856234',
      issuerName: 'Tech Solutions Inc',
      date: '2024-12-13',
      result: 'invalid',
      amount: 5,
    },
    {
      id: '4',
      billNumber: 'BILL1702842745123',
      issuerName: 'Global Services',
      date: '2024-12-12',
      result: 'restricted',
      amount: 10,
    },
    {
      id: '5',
      billNumber: 'BILL1702841634012',
      issuerName: 'Mega Industries',
      date: '2024-12-11',
      result: 'valid',
      amount: 5,
    },
  ])

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'valid':
        return <span className={styles.badgeValid}>✓ Valid</span>
      case 'invalid':
        return <span className={styles.badgeInvalid}>✕ Invalid</span>
      case 'restricted':
        return <span className={styles.badgeRestricted}>🔒 Restricted</span>
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.title}>Welcome back, {user?.fullName}! 👋</h1>
          <p className={styles.subtitle}>Here's your verification activity overview</p>
        </div>
        <div className={styles.quickActions}>
          <Button 
            variant="primary" 
            icon={<Search size={18} />}
            onClick={() => navigate('/verify')}
          >
            Verify Bill
          </Button>
          <Button 
            variant="secondary" 
            icon={<CreditCard size={18} />}
            onClick={() => navigate('/credits')}
          >
            Buy Credits
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Total Verifications */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <FileText size={24} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Verifications</span>
              <span className={styles.statValue}>{stats.totalVerifications}</span>
              <span className={styles.statChange}>
                <TrendingUp size={14} /> +12% from last month
              </span>
            </div>
          </div>
        </Card>

        {/* Credits Remaining */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 167, 38, 0.1)' }}>
              <DollarSign size={24} color="var(--color-warning)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Credits Remaining</span>
              <span className={styles.statValue}>{stats.creditsRemaining}</span>
              <span className={styles.statChange}>
                ₹{stats.creditsRemaining * 5} value
              </span>
            </div>
          </div>
        </Card>

        {/* Amount Spent */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(41, 182, 246, 0.1)' }}>
              <CreditCard size={24} color="var(--color-info)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Amount Spent</span>
              <span className={styles.statValue}>₹{stats.amountSpent}</span>
              <span className={styles.statChange}>This month</span>
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <CheckCircle size={24} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Success Rate</span>
              <span className={styles.statValue}>{stats.successRate}%</span>
              <span className={styles.statChange}>Valid bills detected</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Verifications */}
      <Card variant="elevated" padding="large">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recent Verifications</h2>
            <p className={styles.sectionSubtitle}>Your last 5 bill verifications</p>
          </div>
          <Button 
            variant="ghost" 
            size="small"
            onClick={() => navigate('/history')}
          >
            View All
          </Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Issuer</th>
                <th>Date</th>
                <th>Result</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentVerifications.map((verification) => (
                <tr key={verification.id}>
                  <td>
                    <span className={styles.billNumber}>
                      <FileText size={16} />
                      {verification.billNumber}
                    </span>
                  </td>
                  <td>{verification.issuerName}</td>
                  <td>
                    <span className={styles.date}>
                      <Calendar size={14} />
                      {new Date(verification.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td>{getResultBadge(verification.result)}</td>
                  <td>₹{verification.amount}</td>
                  <td>
                    <Button 
                      variant="ghost" 
                      size="small"
                      icon={<Download size={14} />}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State (if no verifications) */}
        {recentVerifications.length === 0 && (
          <div className={styles.emptyState}>
            <Search size={48} color="var(--color-text-light)" />
            <h3>No verifications yet</h3>
            <p>Start verifying bills to see your history here</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/verify')}
            >
              Verify Your First Bill
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Dashboard