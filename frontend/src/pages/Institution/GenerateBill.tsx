import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Upload,
  Eye,
  Save,
  AlertCircle ,
  Send
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { 
  BILL_TYPE_CONFIGS, 
  ACCESS_LEVEL_INFO, 
  type BillFormData, 
  type BillType,
  type AccessLevel 
} from '../../types/bill'
import styles from './GenerateBill.module.css'

function GenerateBill() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Step state (1: Select Type, 2: Fill Form, 3: Preview, 4: Success)
  const [currentStep, setCurrentStep] = useState(1)

  // Form data
  const [formData, setFormData] = useState<Partial<BillFormData>>({
    billType: undefined,
    issuerName: user?.organizationName || '',
    issuerGSTIN: '',
    recipientName: '',
    amount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    accessLevel: 'public',
  })

  // Additional fields for specific bill types
  const [additionalFields, setAdditionalFields] = useState<Record<string, any>>({})

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generated bill number (after submission)
  const [generatedBillNumber, setGeneratedBillNumber] = useState('')

  // Get selected bill type config
  const selectedBillConfig = BILL_TYPE_CONFIGS.find(
    config => config.value === formData.billType
  )

  // Handle bill type selection
  const handleBillTypeSelect = (billType: BillType) => {
    const config = BILL_TYPE_CONFIGS.find(c => c.value === billType)
    setFormData({
      ...formData,
      billType,
      accessLevel: config?.defaultAccessLevel || 'public',
    })
    setCurrentStep(2)
  }

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    if (field === 'amount' || field.includes('Salary') || field.includes('allowances') || field.includes('deductions')) {
      setFormData({ ...formData, [field]: parseFloat(value) || 0 })
    } else {
      setFormData({ ...formData, [field]: value })
    }
    // Clear error for this field
    setErrors({ ...errors, [field]: '' })
  }

  // Handle additional field change (bill type specific)
  const handleAdditionalFieldChange = (field: string, value: any) => {
    setAdditionalFields({ ...additionalFields, [field]: value })
    setErrors({ ...errors, [field]: '' })
  }

  // Calculate total amount for salary slip
  const calculateTotalAmount = () => {
    if (formData.billType === 'salary_slip') {
      const basic = parseFloat(additionalFields.basicSalary || '0')
      const allowances = parseFloat(additionalFields.allowances || '0')
      const deductions = parseFloat(additionalFields.deductions || '0')
      return basic + allowances - deductions
    }
    return formData.amount || 0
  }

  // Validate current step
  // const validateStep = () => {
  //   const newErrors: Record<string, string> = {}

  //   if (currentStep === 2) {
  //     // Validate required fields
  //     if (!formData.recipientName?.trim()) {
  //       newErrors.recipientName = 'This field is required'
  //     }

  //     if (!formData.issueDate) {
  //       newErrors.issueDate = 'Date is required'
  //     }

  //     if (formData.billType === 'salary_slip') {
  //       if (!additionalFields.basicSalary || additionalFields.basicSalary <= 0) {
  //         newErrors.basicSalary = 'Basic salary is required'
  //       }
  //     } else {
  //       if (!formData.amount || formData.amount <= 0) {
  //         newErrors.amount = 'Amount must be greater than 0'
  //       }
  //     }

  //     // Validate bill type specific required fields
  //     if (selectedBillConfig) {
  //       selectedBillConfig.fields.forEach(field => {
  //         if (field.required) {
  //           const value = additionalFields[field.name]
  //           if (!value || (typeof value === 'string' && !value.trim())) {
  //             newErrors[field.name] = `${field.label} is required`
  //           }
  //         }
  //       })
  //     }
  //   }

  //   setErrors(newErrors)
  //   return Object.keys(newErrors).length === 0
  // }
  // Validate current step
const validateStep = () => {
  const newErrors: Record<string, string> = {}

  if (currentStep === 2) {
    // Validate bill type specific required fields
    if (selectedBillConfig) {
      selectedBillConfig.fields.forEach(field => {
        if (field.required) {
          const value = additionalFields[field.name]
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors[field.name] = `${field.label} is required`
          }
        }
      })
    }

    // Validate amount (not for salary slip)
    if (formData.billType !== 'salary_slip') {
      if (!formData.amount || formData.amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0'
      }
    }

    // For salary slip, validate basic salary
    if (formData.billType === 'salary_slip') {
      if (!additionalFields.basicSalary || parseFloat(additionalFields.basicSalary) <= 0) {
        newErrors.basicSalary = 'Basic salary is required and must be greater than 0'
      }
    }

    console.log('Validation errors:', newErrors) // Debug log
    console.log('Form data:', formData) // Debug log
    console.log('Additional fields:', additionalFields) // Debug log
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

  // Go to next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Go to previous step
  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  // Generate bill number
  const generateBillNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `BILL${timestamp}${random}`
  }

  // Submit form
  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate bill number
    const billNumber = generateBillNumber()
    setGeneratedBillNumber(billNumber)

    // Update total amount for salary slip
    if (formData.billType === 'salary_slip') {
      formData.amount = calculateTotalAmount()
    }

    console.log('Submitting bill:', {
      ...formData,
      ...additionalFields,
      billNumber,
    })

    setIsSubmitting(false)
    setCurrentStep(4) // Success step
  }

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: 'Select Type' },
      { number: 2, label: 'Fill Details' },
      { number: 3, label: 'Preview' },
    ]

    return (
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => (
          <div key={step.number} className={styles.stepItem}>
            <div
              className={`${styles.stepCircle} ${
                currentStep > step.number ? styles.stepCompleted : ''
              } ${currentStep === step.number ? styles.stepActive : ''}`}
            >
              {currentStep > step.number ? <Check size={16} /> : step.number}
            </div>
            <span className={styles.stepLabel}>{step.label}</span>
            {index < steps.length - 1 && (
              <div
                className={`${styles.stepLine} ${
                  currentStep > step.number ? styles.stepLineCompleted : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  // Step 1: Select Bill Type
  const renderBillTypeSelection = () => (
    <div className={styles.billTypeGrid}>
      {BILL_TYPE_CONFIGS.map(config => (
        <Card
          key={config.value}
          variant="bordered"
          padding="large"
          className={styles.billTypeCard}
          onClick={() => handleBillTypeSelect(config.value)}
        >
          <div className={styles.billTypeIcon}>{config.icon}</div>
          <h3 className={styles.billTypeLabel}>{config.label}</h3>
          <p className={styles.billTypeDesc}>{config.description}</p>
          <div className={styles.billTypeAccess}>
            <span
              className={styles.accessBadge}
              style={{ backgroundColor: `${ACCESS_LEVEL_INFO[config.defaultAccessLevel].color}15`, color: ACCESS_LEVEL_INFO[config.defaultAccessLevel].color }}
            >
              {ACCESS_LEVEL_INFO[config.defaultAccessLevel].label}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )

  // Step 2: Fill Form
  const renderForm = () => {
    if (!selectedBillConfig) return null

    return (
      <div className={styles.formContainer}>
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Bill Information</h3>
          
          {/* Issuer Information (Pre-filled) */}
          <div className={styles.formGrid}>
            <Input
              label="Issuer Organization"
              type="text"
              value={formData.issuerName}
              onChange={(e) => handleFieldChange('issuerName', e.target.value)}
              disabled
              fullWidth
            />
            <Input
              label="GSTIN (Optional)"
              type="text"
              placeholder="Enter GSTIN"
              value={formData.issuerGSTIN}
              onChange={(e) => handleFieldChange('issuerGSTIN', e.target.value)}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Recipient Details</h3>
          
          <div className={styles.formGrid}>
            {selectedBillConfig.fields.map(field => {
              if (field.type === 'textarea') {
                return (
                  <div key={field.name} className={styles.fullWidth}>
                    <label className={styles.label}>
                      {field.label} {field.required && <span className={styles.required}>*</span>}
                    </label>
                    <textarea
                      className={styles.textarea}
                      placeholder={field.placeholder}
                      value={additionalFields[field.name] || ''}
                      onChange={(e) => handleAdditionalFieldChange(field.name, e.target.value)}
                      rows={3}
                    />
                    {errors[field.name] && (
                      <span className={styles.error}>{errors[field.name]}</span>
                    )}
                  </div>
                )
              }

              if (field.type === 'select') {
                return (
                  <div key={field.name}>
                    <label className={styles.label}>
                      {field.label} {field.required && <span className={styles.required}>*</span>}
                    </label>
                    <select
                      className={styles.select}
                      value={additionalFields[field.name] || ''}
                      onChange={(e) => handleAdditionalFieldChange(field.name, e.target.value)}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[field.name] && (
                      <span className={styles.error}>{errors[field.name]}</span>
                    )}
                  </div>
                )
              }

              return (
                <Input
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={additionalFields[field.name] || ''}
                  onChange={(e) => handleAdditionalFieldChange(field.name, e.target.value)}
                  error={errors[field.name]}
                  fullWidth
                />
              )
            })}
          </div>
        </div>

        {/* Amount Section */}
        {formData.billType !== 'salary_slip' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Amount</h3>
            <div className={styles.formGrid}>
              <Input
                label="Total Amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount || ''}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                error={errors.amount}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Salary Slip Specific */}
        {formData.billType === 'salary_slip' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>Salary Breakdown</h3>
            <div className={styles.formGrid}>
              <Input
                label="Basic Salary"
                type="number"
                placeholder="Enter basic salary"
                value={additionalFields.basicSalary || ''}
                onChange={(e) => handleAdditionalFieldChange('basicSalary', e.target.value)}
                error={errors.basicSalary}
                fullWidth
              />
              <Input
                label="Allowances"
                type="number"
                placeholder="Enter allowances"
                value={additionalFields.allowances || ''}
                onChange={(e) => handleAdditionalFieldChange('allowances', e.target.value)}
                fullWidth
              />
              <Input
                label="Deductions"
                type="number"
                placeholder="Enter deductions"
                value={additionalFields.deductions || ''}
                onChange={(e) => handleAdditionalFieldChange('deductions', e.target.value)}
                fullWidth
              />
              <div className={styles.totalAmount}>
                <span className={styles.totalLabel}>Net Salary:</span>
                <span className={styles.totalValue}>
                  ₹{calculateTotalAmount().toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Access Level */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Access Level</h3>
          <p className={styles.formSectionDesc}>Who can verify and view this bill's full details?</p>
          
          <div className={styles.accessLevelGrid}>
            {Object.entries(ACCESS_LEVEL_INFO).map(([key, info]) => (
              <label
                key={key}
                className={`${styles.accessLevelCard} ${
                  formData.accessLevel === key ? styles.accessLevelCardActive : ''
                }`}
              >
                <input
                  type="radio"
                  name="accessLevel"
                  value={key}
                  checked={formData.accessLevel === key}
                  onChange={(e) => handleFieldChange('accessLevel', e.target.value)}
                  className={styles.radioInput}
                />
                <div>
                  <div className={styles.accessLevelLabel}>{info.label}</div>
                  <div className={styles.accessLevelDesc}>{info.description}</div>
                  <div className={styles.accessLevelFee}>Verification fee: ₹{info.fee}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Preview
  const renderPreview = () => {
    const totalAmount = formData.billType === 'salary_slip' 
      ? calculateTotalAmount() 
      : formData.amount || 0

    return (
      <div className={styles.previewContainer}>
        <Card variant="elevated" padding="large" className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <h2 className={styles.previewTitle}>Bill Preview</h2>
            <div className={styles.previewBillType}>
              {selectedBillConfig?.icon} {selectedBillConfig?.label}
            </div>
          </div>

          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>Issuer Information</h3>
            <div className={styles.previewGrid}>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Organization:</span>
                <span className={styles.previewValue}>{formData.issuerName}</span>
              </div>
              {formData.issuerGSTIN && (
                <div className={styles.previewItem}>
                  <span className={styles.previewLabel}>GSTIN:</span>
                  <span className={styles.previewValue}>{formData.issuerGSTIN}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>Recipient Information</h3>
            <div className={styles.previewGrid}>
              {Object.entries(additionalFields).map(([key, value]) => {
                if (!value) return null
                const field = selectedBillConfig?.fields.find(f => f.name === key)
                if (!field) return null

                return (
                  <div key={key} className={styles.previewItem}>
                    <span className={styles.previewLabel}>{field.label}:</span>
                    <span className={styles.previewValue}>
                      {field.type === 'date' 
                        ? new Date(value).toLocaleDateString('en-IN')
                        : value}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {formData.billType === 'salary_slip' && (
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Salary Details</h3>
              <div className={styles.salaryBreakdown}>
                <div className={styles.salaryItem}>
                  <span>Basic Salary:</span>
                  <span>₹{parseFloat(additionalFields.basicSalary || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.salaryItem}>
                  <span>Allowances:</span>
                  <span>+ ₹{parseFloat(additionalFields.allowances || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.salaryItem}>
                  <span>Deductions:</span>
                  <span>- ₹{parseFloat(additionalFields.deductions || '0').toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.salaryItemTotal}>
                  <span>Net Salary:</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>Amount</h3>
            <div className={styles.previewAmount}>
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className={styles.previewSection}>
            <h3 className={styles.previewSectionTitle}>Access Level</h3>
            <div
              className={styles.previewAccessBadge}
              style={{ 
                backgroundColor: `${ACCESS_LEVEL_INFO[formData.accessLevel as AccessLevel].color}15`, 
                color: ACCESS_LEVEL_INFO[formData.accessLevel as AccessLevel].color 
              }}
            >
              {ACCESS_LEVEL_INFO[formData.accessLevel as AccessLevel].label}
            </div>
          </div>

          <div className={styles.previewFooter}>
            <p className={styles.previewNote}>
              ℹ️ Once generated, this bill will be committed to the blockchain and cannot be modified.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Step 4: Success
  const renderSuccess = () => (
    <div className={styles.successContainer}>
      <Card variant="elevated" padding="large" className={styles.successCard}>
        <div className={styles.successIcon}>
          <Check size={64} />
        </div>
        <h2 className={styles.successTitle}>Bill Generated Successfully!</h2>
        <p className={styles.successMessage}>
          Your bill has been generated and committed to the blockchain.
        </p>

        <div className={styles.billNumberDisplay}>
          <span className={styles.billNumberLabel}>Bill Number:</span>
          <span className={styles.billNumberValue}>{generatedBillNumber}</span>
        </div>

        <div className={styles.successActions}>
          <Button
            variant="secondary"
            icon={<Eye size={18} />}
            onClick={() => navigate(`/institution/bills/${generatedBillNumber}`)}
          >
            View Bill
          </Button>
          <Button
            variant="primary"
            icon={<FileText size={18} />}
            onClick={() => {
              setCurrentStep(1)
              setFormData({
                billType: undefined,
                issuerName: user?.organizationName || '',
                issuerGSTIN: '',
                recipientName: '',
                amount: 0,
                issueDate: new Date().toISOString().split('T')[0],
                description: '',
                accessLevel: 'public',
              })
              setAdditionalFields({})
              setErrors({})
            }}
          >
            Generate Another Bill
          </Button>
        </div>
      </Card>
    </div>
  )

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Generate New Bill</h1>
        <p className={styles.subtitle}>
          {currentStep === 1 && 'Select the type of bill you want to generate'}
          {currentStep === 2 && 'Fill in the bill details'}
          {currentStep === 3 && 'Review bill before submitting'}
          {currentStep === 4 && 'Bill generated successfully'}
        </p>
      </div>

      {/* Step Indicator */}
      {currentStep < 4 && renderStepIndicator()}

      {/* Content */}
      <div className={styles.content}>
        {currentStep === 1 && renderBillTypeSelection()}
        {currentStep === 2 && (
          <Card variant="elevated" padding="large">
            {renderForm()}
          </Card>
        )}
        {currentStep === 3 && renderPreview()}
        {currentStep === 4 && renderSuccess()}
      </div>

      {/* Navigation Buttons */}
      {currentStep > 1 && currentStep < 4 && (
        <div className={styles.navigation}>
          <Button
            variant="secondary"
            icon={<ArrowLeft size={18} />}
            onClick={handleBack}
          >
            Back
          </Button>

          {currentStep === 2 && (
            <Button
              variant="primary"
              icon={<ArrowRight size={18} />}
              iconPosition="right"
              onClick={handleNext}
            >
              Preview Bill
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              variant="primary"
              icon={<Send size={18} />}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Generate & Submit'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default GenerateBill