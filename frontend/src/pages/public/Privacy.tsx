import Card from '../../components/common/Card'
import styles from './StaticPages.module.css'

function Privacy() {
  return (
    <div className={styles.container}>
      <Card variant="elevated" padding="large">
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>
          Last updated: 14 Dec 2024
        </p>

        <div className={styles.content}>
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect only the minimum data required to verify bills,
              including bill identifiers, issuer details, and verification
              metadata.
            </p>
          </section>

          <section>
            <h2>2. How We Use Data</h2>
            <ul>
              <li>Bill authenticity verification</li>
              <li>Fraud detection and prevention</li>
              <li>Audit and compliance logging</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage & Security</h2>
            <p>
              All sensitive data is encrypted. Bill hashes may be stored on
              immutable ledgers to ensure tamper detection.
            </p>
          </section>

          <section>
            <h2>4. Data Sharing</h2>
            <p>
              We do not sell user data. Data may be shared only with authorized
              institutions during verification requests.
            </p>
          </section>

          <section>
            <h2>5. User Rights</h2>
            <p>
              Users may request access or deletion of personal data where
              legally permitted.
            </p>
          </section>

          <section>
            <h2>6. Policy Updates</h2>
            <p>
              This policy may be updated periodically. Continued use indicates
              acceptance of changes.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}

export default Privacy
