import { useState } from 'react'
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Lock,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import styles from './History.module.css'

interface VerificationRecord {
  id: string
  billNumber: string
  issuerName: string
  billType: string
  verificationDate: string
  result: 'valid' | 'invalid' | 'restricted'
  fee: number
}

function History() {
  const { user } = useAuth()

  // Mock data
  const [allRecords] = useState<VerificationRecord[]>([
    {
      id: '1',
      billNumber: 'BILL1702845123456',
      issuerName: 'ABC Corporation',
      billType: 'Sales Invoice',
      verificationDate: '2024-12-14T10:30:00',
      result: 'valid',
      fee: 5,
    },
    {
      id: '2',
      billNumber: 'BILL1702844987321',
      issuerName: 'XYZ Pvt Ltd',
      billType: 'Purchase Invoice',
      verificationDate: '2024-12-13T14:20:00',
      result: 'valid',
      fee: 5,
    },
    {
      id: '3',
      billNumber: 'BILL1702843856234',
      issuerName: 'Tech Solutions Inc',
      billType: 'Service Invoice',
      verificationDate: '2024-12-13T09:15:00',
      result: 'invalid',
      fee: 5,
    },
    {
      id: '4',
      billNumber: 'BILL1702842745123',
      issuerName: 'Global Services',
      billType: 'Salary Slip',
      verificationDate: '2024-12-12T16:45:00',
      result: 'restricted',
      fee: 10,
    },
    {
      id: '5',
      billNumber: 'BILL1702841634012',
      issuerName: 'Mega Industries',
      billType: 'Sales Invoice',
      verificationDate: '2024-12-11T11:30:00',
      result: 'valid',
      fee: 5,
    },
    {
      id: '6',
      billNumber: 'BILL1702840523901',
      issuerName: 'Tech Suppliers',
      billType: 'Purchase Invoice',
      verificationDate: '2024-12-10T13:20:00',
      result: 'valid',
      fee: 5,
    },
    {
      id: '7',
      billNumber: 'BILL1702839412890',
      issuerName: 'Finance Corp',
      billType: 'Tax Receipt',
      verificationDate: '2024-12-09T10:10:00',
      result: 'restricted',
      fee: 10,
    },
    {
      id: '8',
      billNumber: 'BILL1702838301789',
      issuerName: 'Unknown Entity',
      billType: 'Unknown',
      verificationDate: '2024-12-08T15:30:00',
      result: 'invalid',
      fee: 5,
    },
  ])

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterResult, setFilterResult] = useState<'all' | 'valid' | 'invalid' | 'restricted'>('all')

  // Filter records
  const filteredRecords = allRecords.filter(record => {
    // Filter by search query
    const matchesSearch = 
      record.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.issuerName.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by result type
    const matchesFilter = filterResult === 'all' || record.result === filterResult

    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const stats = {
    totalVerifications: allRecords.length,
    totalSpent: allRecords.reduce((sum, record) => sum + record.fee, 0),
    validCount: allRecords.filter(r => r.result === 'valid').length,
    invalidCount: allRecords.filter(r => r.result === 'invalid').length,
    restrictedCount: allRecords.filter(r => r.result === 'restricted').length,
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'valid':
        return (
          <span className={styles.badgeValid}>
            <CheckCircle size={14} />
            Valid
          </span>
        )
      case 'invalid':
        return (
          <span className={styles.badgeInvalid}>
            <XCircle size={14} />
            Invalid
          </span>
        )
      case 'restricted':
        return (
          <span className={styles.badgeRestricted}>
            <Lock size={14} />
            Restricted
          </span>
        )
    }
  }

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

  const handleDownloadCertificate = (record: VerificationRecord) => {
    // Mock download - will implement actual PDF download later
    alert(`Downloading verification certificate for ${record.billNumber}`)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Verification History</h1>
          <p className={styles.subtitle}>View all your past bill verifications</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card variant="elevated" padding="medium">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <FileText size={20} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Verifications</span>
              <span className={styles.statValue}>{stats.totalVerifications}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="medium">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(255, 167, 38, 0.1)' }}>
              <DollarSign size={20} color="var(--color-warning)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Spent</span>
              <span className={styles.statValue}>₹{stats.totalSpent}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="medium">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(37, 193, 95, 0.1)' }}>
              <CheckCircle size={20} color="var(--color-success)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Valid Bills</span>
              <span className={styles.statValue}>{stats.validCount}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="medium">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(217, 67, 67, 0.1)' }}>
              <XCircle size={20} color="var(--color-alert)" />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Invalid Bills</span>
              <span className={styles.statValue}>{stats.invalidCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card variant="elevated" padding="large">
        {/* Search and Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchSection}>
            <Input
              type="text"
              placeholder="Search by bill number or issuer..."
              icon={<Search size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filterSection}>
            <Filter size={18} />
            <span className={styles.filterLabel}>Filter:</span>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${filterResult === 'all' ? styles.filterButtonActive : ''}`}
                onClick={() => setFilterResult('all')}
              >
                All ({allRecords.length})
              </button>
              <button
                className={`${styles.filterButton} ${filterResult === 'valid' ? styles.filterButtonActive : ''}`}
                onClick={() => setFilterResult('valid')}
              >
                <CheckCircle size={14} />
                Valid ({stats.validCount})
              </button>
              <button
                className={`${styles.filterButton} ${filterResult === 'invalid' ? styles.filterButtonActive : ''}`}
                onClick={() => setFilterResult('invalid')}
              >
                <XCircle size={14} />
                Invalid ({stats.invalidCount})
              </button>
              <button
                className={`${styles.filterButton} ${filterResult === 'restricted' ? styles.filterButtonActive : ''}`}
                onClick={() => setFilterResult('restricted')}
              >
                <Lock size={14} />
                Restricted ({stats.restrictedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className={styles.resultsCount}>
          Showing {filteredRecords.length} of {allRecords.length} verifications
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bill Number</th>
                <th>Issuer</th>
                <th>Bill Type</th>
                <th>Date & Time</th>
                <th>Result</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className={styles.billNumber}>
                      <FileText size={16} />
                      {record.billNumber}
                    </span>
                  </td>
                  <td>{record.issuerName}</td>
                  <td>
                    <span className={styles.billType}>{record.billType}</span>
                  </td>
                  <td>
                    <div className={styles.dateTime}>
                      <span className={styles.date}>
                        <Calendar size={14} />
                        {formatDate(record.verificationDate)}
                      </span>
                      <span className={styles.time}>{formatTime(record.verificationDate)}</span>
                    </div>
                  </td>
                  <td>{getResultBadge(record.result)}</td>
                  <td className={styles.fee}>₹{record.fee}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="small"
                      icon={<Download size={14} />}
                      onClick={() => handleDownloadCertificate(record)}
                    >
                      Certificate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && (
          <div className={styles.emptyState}>
            <Search size={48} color="var(--color-text-light)" />
            <h3>No verifications found</h3>
            <p>
              {searchQuery || filterResult !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'You haven\'t verified any bills yet'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default History