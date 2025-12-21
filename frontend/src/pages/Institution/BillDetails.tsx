import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Share2,
  Eye,
  Calendar,
  FileText,
  Building,
  User,
  DollarSign,
  CheckCircle,
  Shield,
  Clock
} from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { ACCESS_LEVEL_INFO } from '../../types/bill'
import styles from './BillDetails.module.css'

interface BillDetail {
  billNumber: string
  billType: string
  issuerName: string
  issuerGSTIN: string
  recipientName: string
  recipientEmail: string
  amount: number
  issueDate: string
  description: string
  accessLevel: 'public' | 'restricted' | 'government' | 'financial'
  status: 'active' | 'verified' | 'pending'
  verificationCount: number
  blockchainHash: string
  createdAt: string
  qrCode: string
}

interface VerificationLog {
  id: string
  verifiedBy: string
  verifiedAt: string
  result: 'valid' | 'invalid'
  verifierType: 'public' | 'institutional' | 'government'
}

function BillDetails() {
  const { billNumber } = useParams<{ billNumber: string }>()
  const navigate = useNavigate()

  const [bill, setBill] = useState<BillDetail | null>(null)
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([])
  const [loading, setLoading] = useState(true)

  // Load bill details (mock data)
  useEffect(() => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const mockBill: BillDetail = {
        billNumber: billNumber || 'BILL1702845123456',
        billType: 'Sales Invoice',
        issuerName: 'ABC Corporation',
        issuerGSTIN: 'GST123456789',
        recipientName: 'John Enterprises',
        recipientEmail: 'john@enterprises.com',
        amount: 75000,
        issueDate: '2024-12-14',
        description: 'Professional web development services including UI/UX design, frontend and backend development.',
        accessLevel: 'public',
        status: 'active',
        verificationCount: 5,
        blockchainHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
        createdAt: '2024-12-14T10:30:00Z',
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=',
      }

      const mockLogs: VerificationLog[] = [
        {
          id: '1',
          verifiedBy: 'Tech Bank Ltd.',
          verifiedAt: '2024-12-15T09:30:00Z',
          result: 'valid',
          verifierType: 'institutional',
        },
        {
          id: '2',
          verifiedBy: 'Public User',
          verifiedAt: '2024-12-15T08:15:00Z',
          result: 'valid',
          verifierType: 'public',
        },
        {
          id: '3',
          verifiedBy: 'Finance Corp',
          verifiedAt: '2024-12-14T16:45:00Z',
          result: 'valid',
          verifierType: 'institutional',
        },
      ]

      setBill(mockBill)
      setVerificationLogs(mockLogs)
      setLoading(false)
    }, 800)
  }, [billNumber])

  const handleDownloadPDF = () => {
    alert('Downloading PDF...')
  }

  const handleCopyBillNumber = () => {
    navigator.clipboard.writeText(bill?.billNumber || '')
    alert('Bill number copied to clipboard!')
  }

  const handleCopyVerificationLink = () => {
    const link = `${window.location.origin}/verify?bill=${bill?.billNumber}`
    navigator.clipboard.writeText(link)
    alert('Verification link copied to clipboard!')
  }

  const handleShareBill = () => {
    if (navigator.share) {
      navigator.share({
        title: `Bill ${bill?.billNumber}`,
        text: `Verify this bill on EPR Platform`,
        url: `${window.location.origin}/verify?bill=${bill?.billNumber}`,
      })
    } else {
      handleCopyVerificationLink()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} at ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className={styles.badgeActive}><CheckCircle size={16} /> Active</span>
      case 'verified':
        return <span className={styles.badgeVerified}><Eye size={16} /> Verified</span>
      case 'pending':
        return <span className={styles.badgePending}><Clock size={16} /> Pending</span>
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading bill details...</p>
        </div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className={styles.container}>
        <Card variant="elevated" padding="large">
          <div className={styles.notFound}>
            <FileText size={64} color="var(--color-text-light)" />
            <h2>Bill Not Found</h2>
            <p>The bill you're looking for doesn't exist or has been deleted.</p>
            <Button
              variant="primary"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate('/institution/bills')}
            >
              Back to Bills
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/institution/bills')}
        >
          Back to Bills
        </Button>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="small"
            icon={<Share2 size={16} />}
            onClick={handleShareBill}
          >
            Share
          </Button>
          <Button
            variant="primary"
            size="small"
            icon={<Download size={16} />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Main Bill Information */}
        <div className={styles.mainSection}>
          <Card variant="elevated" padding="large">
            {/* Bill Header */}
            <div className={styles.billHeader}>
              <div>
                <h1 className={styles.billNumber}>
                  <FileText size={28} />
                  {bill.billNumber}
                  <button
                    className={styles.copyButton}
                    onClick={handleCopyBillNumber}
                    title="Copy bill number"
                  >
                    <Copy size={16} />
                  </button>
                </h1>
                <div className={styles.billMeta}>
                  <span className={styles.billType}>{bill.billType}</span>
                  {getStatusBadge(bill.status)}
                </div>
              </div>
              <div className={styles.amountDisplay}>
                <span className={styles.amountLabel}>Total Amount</span>
                <span className={styles.amountValue}>{formatCurrency(bill.amount)}</span>
              </div>
            </div>

            {/* Issuer & Recipient Info */}
            <div className={styles.infoGrid}>
              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>
                  <Building size={20} />
                  Issuer Information
                </h3>
                <div className={styles.infoItems}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Organization:</span>
                    <span className={styles.infoValue}>{bill.issuerName}</span>
                  </div>
                  {bill.issuerGSTIN && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>GSTIN:</span>
                      <span className={styles.infoValue}>{bill.issuerGSTIN}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>
                  <User size={20} />
                  Recipient Information
                </h3>
                <div className={styles.infoItems}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Name:</span>
                    <span className={styles.infoValue}>{bill.recipientName}</span>
                  </div>
                  {bill.recipientEmail && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email:</span>
                      <span className={styles.infoValue}>{bill.recipientEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div className={styles.detailsSection}>
              <h3 className={styles.sectionTitle}>Bill Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Calendar size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Issue Date</span>
                    <span className={styles.detailValue}>{formatDate(bill.issueDate)}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <DollarSign size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Amount</span>
                    <span className={styles.detailValue}>{formatCurrency(bill.amount)}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Eye size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Verifications</span>
                    <span className={styles.detailValue}>{bill.verificationCount}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Clock size={18} className={styles.detailIcon} />
                  <div>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>{formatDateTime(bill.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {bill.description && (
              <div className={styles.descriptionSection}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <p className={styles.description}>{bill.description}</p>
              </div>
            )}

            {/* Blockchain Info */}
            <div className={styles.blockchainSection}>
              <h3 className={styles.sectionTitle}>
                <Shield size={20} />
                Blockchain Verification
              </h3>
              <div className={styles.blockchainInfo}>
                <div className={styles.blockchainItem}>
                  <span className={styles.blockchainLabel}>Blockchain Hash:</span>
                  <span className={styles.blockchainHash}>{bill.blockchainHash}</span>
                </div>
                <div className={styles.blockchainItem}>
                  <span className={styles.blockchainLabel}>Access Level:</span>
                  <span
                    className={styles.accessBadge}
                    style={{
                      backgroundColor: `${ACCESS_LEVEL_INFO[bill.accessLevel].color}15`,
                      color: ACCESS_LEVEL_INFO[bill.accessLevel].color,
                    }}
                  >
                    {ACCESS_LEVEL_INFO[bill.accessLevel].label}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* QR Code Card */}
          <Card variant="elevated" padding="large">
            <h3 className={styles.sidebarTitle}>QR Code</h3>
            <p className={styles.sidebarDesc}>Scan to verify this bill</p>
            <div className={styles.qrCode}>
              <img src={bill.qrCode} alt="Bill QR Code" />
            </div>
            <Button
              variant="secondary"
              size="small"
              fullWidth
              icon={<Download size={16} />}
              onClick={() => alert('Downloading QR code...')}
            >
              Download QR Code
            </Button>
          </Card>

          {/* Verification Link Card */}
          <Card variant="bordered" padding="medium">
            <h3 className={styles.sidebarTitle}>Verification Link</h3>
            <p className={styles.sidebarDesc}>Share this link for verification</p>
            <Button
              variant="ghost"
              size="small"
              fullWidth
              icon={<Copy size={16} />}
              onClick={handleCopyVerificationLink}
            >
              Copy Verification Link
            </Button>
          </Card>

          {/* Stats Card */}
          <Card variant="bordered" padding="medium">
            <h3 className={styles.sidebarTitle}>Statistics</h3>
            <div className={styles.statsItems}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Verifications</span>
                <span className={styles.statValue}>{bill.verificationCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue}>{bill.status}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Verification History */}
      {verificationLogs.length > 0 && (
        <Card variant="elevated" padding="large">
          <h2 className={styles.sectionTitle}>Verification History</h2>
          <p className={styles.sectionDesc}>
            Log of all verifications performed on this bill
          </p>

          <div className={styles.verificationLogs}>
            {verificationLogs.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logIcon}>
                  {log.result === 'valid' ? (
                    <CheckCircle size={20} color="var(--color-success)" />
                  ) : (
                    <Shield size={20} color="var(--color-text)" />
                  )}
                </div>
                <div className={styles.logContent}>
                  <div className={styles.logHeader}>
                    <span className={styles.logVerifier}>{log.verifiedBy}</span>
                    <span className={styles.logType}>{log.verifierType}</span>
                  </div>
                  <span className={styles.logTime}>{formatDateTime(log.verifiedAt)}</span>
                </div>
                <div className={styles.logResult}>
                  <span className={log.result === 'valid' ? styles.resultValid : styles.resultInvalid}>
                    {log.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default BillDetails