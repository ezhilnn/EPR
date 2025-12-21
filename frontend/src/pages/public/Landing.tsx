import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'
import { CheckCircle, Shield, Zap, FileText, Search } from 'lucide-react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>
          EPR Platform
        </h1>
        <p className={styles.subtitle}>
          Blockchain-Backed Bill Generation & Verification System
        </p>
        <p className={styles.description}>
          Eliminate fake bills, prevent financial fraud, and create a single source of truth for all financial documents.
        </p>
        
        <div className={styles.buttonGroup}>
          <Button 
            variant="primary" 
            size="large"
            icon={<FileText size={20} />}
            onClick={() => navigate('/login')}
          >
            Generate Bill
          </Button>
          <Button 
            variant="secondary" 
            size="large"
            icon={<Search size={20} />}
            onClick={() => navigate('/login')}
          >
            Verify Bill
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <Card variant="elevated" padding="large">
          <div className={styles.featureContent}>
            <Shield className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Blockchain Security</h3>
            <p className={styles.featureText}>
              Every bill is cryptographically secured and stored on an immutable blockchain ledger.
            </p>
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className={styles.featureContent}>
            <CheckCircle className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Instant Verification</h3>
            <p className={styles.featureText}>
              Verify any bill's authenticity in seconds. Detect fake bills immediately.
            </p>
          </div>
        </Card>

        <Card variant="elevated" padding="large">
          <div className={styles.featureContent}>
            <Zap className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Global Truth Layer</h3>
            <p className={styles.featureText}>
              A single source of truth for bills. No more disputes, no more fraud.
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Landing