import { useState, type FormEvent } from 'react'
import { Search, FileText, CheckCircle, XCircle, Lock, Download, Calendar, Building } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import styles from './Verify.module.css'

interface VerificationResult {
  success: boolean
  billNumber: string
  status: 'valid' | 'invalid' | 'restricted'
  issuerName?: string
  issueDate?: string
  billType?: string
  message: string
  details?: {
    recipient?: string
    amount?: number
    description?: string
  }
  fee: number
}

function Verify() {
  const { user } = useAuth()
  const [billNumber, setBillNumber] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')

  // Mock verification function
  const verifyBill = async (billNum: string): Promise<VerificationResult> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock different results based on bill number pattern
    if (billNum.includes('INVALID')) {
      return {
        success: true,
        billNumber: billNum,
        status: 'invalid',
        message: 'This bill is not registered in the EPR system. It may be fake.',
        fee: 5,
      }
    }

    if (billNum.includes('RESTRICTED')) {
      return {
        success: true,
        billNumber: billNum,
        status: 'restricted',
        message: 'This bill requires institutional access to view full details.',
        issuerName: 'XYZ Private Limited',
        issueDate: '2024-12-10',
        billType: 'Salary Slip',
        fee: 10,
      }
    }

    // Valid bill
    return {
      success: true,
      billNumber: billNum,
      status: 'valid',
      issuerName: 'ABC Corporation',
      issueDate: '2024-12-14',
      billType: 'Sales Invoice',
      message: 'This bill is registered and verified in the EPR system.',
      details: {
        recipient: 'John Enterprises',
        amount: 45000,
        description: 'Professional services rendered',
      },
      fee: 5,
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    // Validation
    if (!billNumber.trim()) {
      setError('Please enter a bill number')
      return
    }

    if (billNumber.length < 10) {
      setError('Invalid bill number format')
      return
    }

    setIsVerifying(true)

    try {
      const verificationResult = await verifyBill(billNumber)
      setResult(verificationResult)
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReset = () => {
    setBillNumber('')
    setResult(null)
    setError('')
  }

  const getResultIcon = () => {
    if (!result) return null

    switch (result.status) {
      case 'valid':
        return <CheckCircle size={64} color="var(--color-success)" />
      case 'invalid':
        return <XCircle size={64} color="var(--color-alert)" />
      case 'restricted':
        return <Lock size={64} color="var(--color-warning)" />
    }
  }

  const getResultTitle = () => {
    if (!result) return ''

    switch (result.status) {
      case 'valid':
        return '✓ Bill Verified Successfully'
      case 'invalid':
        return '✕ Invalid Bill - Not Registered'
      case 'restricted':
        return '🔒 Access Restricted'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Verify Bill Authenticity</h1>
          <p className={styles.subtitle}>
            Enter a bill number to verify its authenticity and detect fake bills
          </p>
        </div>

        {/* Verification Form */}
        {!result && (
          <Card variant="elevated" padding="large">
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Bill Number"
                type="text"
                placeholder="Enter bill number (e.g., BILL1702845123456)"
                icon={<FileText size={18} />}
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value.toUpperCase())}
                error={error}
                fullWidth
              />

              <div className={styles.feeNotice}>
                <span className={styles.feeLabel}>Verification Fee:</span>
                <span className={styles.feeAmount}>₹1 - ₹10</span>
                <span className={styles.feeNote}>(Based on bill type and access level)</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                isLoading={isVerifying}
                icon={<Search size={18} />}
              >
                {isVerifying ? 'Verifying...' : 'Verify Bill'}
              </Button>

              <div className={styles.helpText}>
                <p>💡 Tip: You can also scan a QR code from the bill (coming soon)</p>
              </div>
            </form>
          </Card>
        )}

        {/* Verification Result */}
        {result && (
          <div className={styles.resultContainer}>
            <Card 
              variant="elevated" 
              padding="large"
              className={`${styles.resultCard} ${styles[`result${result.status.charAt(0).toUpperCase() + result.status.slice(1)}`]}`}
            >
              <div className={styles.resultHeader}>
                {getResultIcon()}
                <h2 className={styles.resultTitle}>{getResultTitle()}</h2>
                <p className={styles.resultMessage}>{result.message}</p>
              </div>

              {/* Bill Information */}
              {result.issuerName && (
                <div className={styles.billInfo}>
                  <h3 className={styles.infoTitle}>Bill Information</h3>
                  
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <FileText size={18} className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Bill Number</span>
                        <span className={styles.infoValue}>{result.billNumber}</span>
                      </div>
                    </div>

                    <div className={styles.infoItem}>
                      <Building size={18} className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Issuer</span>
                        <span className={styles.infoValue}>{result.issuerName}</span>
                      </div>
                    </div>

                    {result.billType && (
                      <div className={styles.infoItem}>
                        <FileText size={18} className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Bill Type</span>
                          <span className={styles.infoValue}>{result.billType}</span>
                        </div>
                      </div>
                    )}

                    {result.issueDate && (
                      <div className={styles.infoItem}>
                        <Calendar size={18} className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Issue Date</span>
                          <span className={styles.infoValue}>
                            {new Date(result.issueDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Details (for valid bills with full access) */}
                  {result.details && result.status === 'valid' && (
                    <div className={styles.additionalDetails}>
                      <h4 className={styles.detailsTitle}>Full Details</h4>
                      <div className={styles.detailsGrid}>
                        {result.details.recipient && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Recipient:</span>
                            <span className={styles.detailValue}>{result.details.recipient}</span>
                          </div>
                        )}
                        {result.details.amount && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Amount:</span>
                            <span className={styles.detailValue}>
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                              }).format(result.details.amount)}
                            </span>
                          </div>
                        )}
                        {result.details.description && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Description:</span>
                            <span className={styles.detailValue}>{result.details.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Restricted Access Message */}
                  {result.status === 'restricted' && (
                    <div className={styles.restrictedNotice}>
                      <Lock size={20} />
                      <p>
                        Full bill details require institutional verifier access. 
                        Only basic information is shown to public users.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.resultActions}>
                {result.status === 'valid' && (
                  <Button
                    variant="secondary"
                    icon={<Download size={18} />}
                  >
                    Download Certificate
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleReset}
                  icon={<Search size={18} />}
                >
                  Verify Another Bill
                </Button>
              </div>

              {/* Fee Charged */}
              <div className={styles.feeCharged}>
                <span>Verification fee charged: ₹{result.fee}</span>
              </div>
            </Card>
          </div>
        )}

        {/* Info Cards */}
        {!result && (
          <div className={styles.infoCards}>
            <Card variant="bordered" padding="medium">
              <h3 className={styles.infoCardTitle}>✓ Valid Bills</h3>
              <p className={styles.infoCardText}>
                Registered in EPR system with full blockchain verification
              </p>
            </Card>
            <Card variant="bordered" padding="medium">
              <h3 className={styles.infoCardTitle}>✕ Invalid Bills</h3>
              <p className={styles.infoCardText}>
                Not found in EPR system - potentially fake or fraudulent
              </p>
            </Card>
            <Card variant="bordered" padding="medium">
              <h3 className={styles.infoCardTitle}>🔒 Restricted Bills</h3>
              <p className={styles.infoCardText}>
                Require institutional access for full details (e.g., salary slips)
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Verify