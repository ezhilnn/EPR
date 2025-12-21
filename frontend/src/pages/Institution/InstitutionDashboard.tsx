import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  CheckCircle, 
  Eye,
  TrendingUp,
  Plus,
  Calendar,
  Download,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import styles from './InstitutionDashboard.module.css'

// Mock data types
interface Bill {
  id: string
  billNumber: string
  billType: string
  recipientName: string
  amount: number
  date: string
  verificationCount: number
  status: 'active' | 'verified' | 'pending'
}

function InstitutionDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Mock stats data
  const [stats] = useState({
    totalBills: 156,
    thisMonthBills: 23,
    totalVerifications: 342,
    activeBills: 142,
  })

  // Mock recent bills data
  const [recentBills] = useState<Bill[]>([
    {
      id: '1',
      billNumber: 'BILL1702845123456',
      billType: 'Sales Invoice',
      recipientName: 'John Enterprises',
      amount: 45000,
      date: '2024-12-14',
      verificationCount: 3,
      status: 'active',
    },
    {
      id: '2',
      billNumber: 'BILL1702844987321',
      billType: 'Salary Slip',
      recipientName: 'Rahul Kumar',
      amount: 65000,
      date: '2024-12-13',
      verificationCount: 1,
      status: 'verified',
    },
    {
      id: '3',
      billNumber: 'BILL1702843856234',
      billType: 'Purchase Invoice',
      recipientName: 'Tech Suppliers',
      amount: 125000,
      date: '2024-12-13',
      verificationCount: 0,
      status: 'pending',
    },
    {
      id: '4',
      billNumber: 'BILL1702842745123',
      billType: 'Rent Receipt',
      recipientName: 'Property Owners',
      amount: 50000,
      date: '2024-12-12',
      verificationCount: 2,
      status: 'active',
    },
    {
      id: '5',
      billNumber: 'BILL1702841634012',
      billType: 'Sales Invoice',
      recipientName: 'Global Corp',
      amount: 98000,
      date: '2024-12-11',
      verificationCount: 5,
      status: 'active',
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className={styles.badgeActive}>● Active</span>
      case 'verified':
        return <span className={styles.badgeVerified}>✓ Verified</span>
      case 'pending':
        return <span className={styles.badgePending}>○ Pending</span>
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.title}>
            {user?.organizationName || 'Institution'} Dashboard 🏢
          </h1>
          <p className={styles.subtitle}>
            Manage your bills and track verifications
          </p>
        </div>
        <Button 
          variant="primary" 
          size="large"
          icon={<Plus size={18} />}
          onClick={() => navigate('/institution/generate')}
        >
          Generate New Bill
        </Button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Total Bills Generated */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <FileText size={24} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Bills Generated</span>
              <span className={styles.statValue}>{stats.totalBills}</span>
              <span className={styles.statChange}>
                <TrendingUp size={14} /> +15% from last month
              </span>
            </div>
          </div>
        </Card>

        {/* This Month */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(41, 182, 246, 0.1)' }}>
              <Calendar size={24} color="var(--color-info)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Bills This Month</span>
              <span className={styles.statValue}>{stats.thisMonthBills}</span>
              <span className={styles.statChange}>December 2024</span>
            </div>
          </div>
        </Card>

        {/* Total Verifications */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 167, 38, 0.1)' }}>
              <Eye size={24} color="var(--color-warning)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Verifications</span>
              <span className={styles.statValue}>{stats.totalVerifications}</span>
              <span className={styles.statChange}>Across all bills</span>
            </div>
          </div>
        </Card>

        {/* Active Bills */}
        <Card variant="elevated" padding="large">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <CheckCircle size={24} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Active Bills</span>
              <span className={styles.statValue}>{stats.activeBills}</span>
              <span className={styles.statChange}>Ready for verification</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Bills */}
      <Card variant="elevated" padding="large">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recent Bills</h2>
            <p className={styles.sectionSubtitle}>Bills you've generated recently</p>
          </div>
          <Button 
            variant="ghost" 
            size="small"
            onClick={() => navigate('/institution/bills')}
          >
            View All Bills
          </Button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Type</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Verifications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <span className={styles.billNumber}>
                      <FileText size={16} />
                      {bill.billNumber}
                    </span>
                  </td>
                  <td>
                    <span className={styles.billType}>{bill.billType}</span>
                  </td>
                  <td>{bill.recipientName}</td>
                  <td className={styles.amount}>{formatCurrency(bill.amount)}</td>
                  <td>
                    <span className={styles.date}>
                      <Calendar size={14} />
                      {new Date(bill.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td>
                    <span className={styles.verificationCount}>
                      <Eye size={14} />
                      {bill.verificationCount}
                    </span>
                  </td>
                  <td>{getStatusBadge(bill.status)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <Button 
                        variant="ghost" 
                        size="small"
                        icon={<ExternalLink size={14} />}
                        onClick={() => navigate(`/institution/bills/${bill.id}`)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="small"
                        icon={<Download size={14} />}
                      >
                        PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {recentBills.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={48} color="var(--color-text-light)" />
            <h3>No bills generated yet</h3>
            <p>Create your first bill to see it here</p>
            <Button 
              variant="primary" 
              icon={<Plus size={18} />}
              onClick={() => navigate('/institution/generate')}
            >
              Generate Your First Bill
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Stats Summary */}
      <div className={styles.summaryGrid}>
        <Card variant="bordered" padding="medium">
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Average Bill Amount</span>
            <span className={styles.summaryValue}>{formatCurrency(67000)}</span>
          </div>
        </Card>
        <Card variant="bordered" padding="medium">
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Most Generated Type</span>
            <span className={styles.summaryValue}>Sales Invoice</span>
          </div>
        </Card>
        <Card variant="bordered" padding="medium">
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Generation Fee Paid</span>
            <span className={styles.summaryValue}>₹78</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default InstitutionDashboard