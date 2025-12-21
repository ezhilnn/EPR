import Card from '../../components/common/Card'
import styles from './StaticPages.module.css'

function Terms() {
  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="large">
        <h1 className={styles.title}>Terms & Conditions</h1>
        <p className={styles.subtitle}>
          Last updated: 14 Dec 2024
        </p>

        <div className={styles.content}>
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the EPR Platform, you agree to be bound by
              these Terms & Conditions. If you do not agree, you must not use
              this platform.
            </p>
          </section>

          <section>
            <h2>2. Purpose of the Platform</h2>
            <p>
              EPR is a blockchain-backed bill generation and verification
              platform designed to detect fake or tampered financial documents.
              Verification results are informational and do not constitute
              legal advice.
            </p>
          </section>

          <section>
            <h2>3. User Responsibilities</h2>
            <ul>
              <li>Provide accurate information while verifying bills</li>
              <li>Do not misuse verification data</li>
              <li>Do not attempt to reverse engineer the system</li>
            </ul>
          </section>

          <section>
            <h2>4. Credits & Payments</h2>
            <p>
              Bill verification consumes credits. Purchased credits are
              non-refundable and do not expire unless stated otherwise.
            </p>
          </section>

          <section>
            <h2>5. Limitation of Liability</h2>
            <p>
              EPR Platform is not liable for financial decisions made solely
              based on verification results.
            </p>
          </section>

          <section>
            <h2>6. Modifications</h2>
            <p>
              We reserve the right to update these terms at any time. Continued
              usage implies acceptance of revised terms.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default Terms
