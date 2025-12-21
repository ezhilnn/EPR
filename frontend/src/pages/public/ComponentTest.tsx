import { Mail, User, Phone } from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import styles from './ComponentTest.module.css'

function ComponentTest() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Component Testing</h1>

      {/* Button Tests */}
      <Card variant="elevated" padding="large">
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.buttonGrid}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </Card>

      {/* Input Tests */}
      <Card variant="elevated" padding="large">
        <h2 className={styles.sectionTitle}>Input Fields</h2>
        <div className={styles.inputGrid}>
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={<Mail size={18} />}
            helperText="We'll never share your email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            helperText="Must be at least 8 characters"
          />
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your name"
            icon={<User size={18} />}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number"
            icon={<Phone size={18} />}
            error="Invalid phone number"
          />
        </div>
      </Card>

      {/* Card Tests */}
      <div className={styles.cardGrid}>
        <Card variant="default" padding="medium">
          <h3>Default Card</h3>
          <p>This is a default card with medium padding</p>
        </Card>
        <Card variant="bordered" padding="medium">
          <h3>Bordered Card</h3>
          <p>This card has a visible border</p>
        </Card>
        <Card variant="elevated" padding="medium">
          <h3>Elevated Card</h3>
          <p>This card has a larger shadow</p>
        </Card>
      </div>
    </div>
  )
}

export default ComponentTest