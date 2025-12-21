// Bill types
export type BillType = 
  | 'sales_invoice'
  | 'purchase_invoice'
  | 'salary_slip'
  | 'medical_bill'
  | 'education_fee'
  | 'rent_receipt'
  | 'reimbursement'
  | 'tax_receipt'
  |'rental_agreement'
  | 'loan_statement'
   | 'insurance_policy'
   | 'other'
// Access levels
export type AccessLevel = 'public' | 'restricted' | 'government' | 'financial'

// Form field types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select'
  placeholder?: string
  required: boolean
  options?: { value: string; label: string }[]
}

// Bill type configuration
export interface BillTypeConfig {
  value: BillType
  label: string
  description: string
  icon: string
  defaultAccessLevel: AccessLevel
  fields: FormField[]
}

// Bill data interface
export interface BillFormData {
  billType: BillType
  issuerName: string
  issuerGSTIN?: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  amount: number
  issueDate: string
  dueDate?: string
  description: string
  accessLevel: AccessLevel
  lineItems?: LineItem[]
  additionalFields?: Record<string, any>
}

// Line item for invoices
export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

// Bill type configurations
export const BILL_TYPE_CONFIGS: BillTypeConfig[] = [
  {
    value: 'sales_invoice',
    label: 'Sales Invoice',
    description: 'Invoice for goods or services sold',
    icon: '🧾',
    defaultAccessLevel: 'public',
    fields: [
      { name: 'recipientName', label: 'Customer Name', type: 'text', placeholder: 'Enter customer name', required: true },
      { name: 'recipientEmail', label: 'Customer Email', type: 'email', placeholder: 'customer@example.com', required: false },
      { name: 'recipientPhone', label: 'Customer Phone', type: 'text', placeholder: '10-digit phone number', required: false },
      { name: 'issueDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: false },
      { name: 'description', label: 'Invoice Description', type: 'textarea', placeholder: 'Brief description of goods/services', required: true },
    ],
  },
  {
    value: 'purchase_invoice',
    label: 'Purchase Invoice',
    description: 'Invoice for goods or services purchased',
    icon: '🛒',
    defaultAccessLevel: 'public',
    fields: [
      { name: 'recipientName', label: 'Supplier Name', type: 'text', placeholder: 'Enter supplier name', required: true },
      { name: 'recipientEmail', label: 'Supplier Email', type: 'email', placeholder: 'supplier@example.com', required: false },
      { name: 'issueDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'description', label: 'Purchase Description', type: 'textarea', placeholder: 'What was purchased?', required: true },
    ],
  },
  {
    value: 'salary_slip',
    label: 'Salary Slip',
    description: 'Employee salary payment receipt',
    icon: '💰',
    defaultAccessLevel: 'restricted',
    fields: [
      { name: 'recipientName', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', required: true },
      { name: 'recipientEmail', label: 'Employee Email', type: 'email', placeholder: 'employee@company.com', required: true },
      { name: 'employeeId', label: 'Employee ID', type: 'text', placeholder: 'EMP001', required: true },
      { name: 'designation', label: 'Designation', type: 'text', placeholder: 'Job title', required: true },
      { name: 'issueDate', label: 'Salary Month', type: 'date', required: true },
      { name: 'basicSalary', label: 'Basic Salary', type: 'number', placeholder: 'Enter basic salary', required: true },
      { name: 'allowances', label: 'Allowances', type: 'number', placeholder: 'Total allowances', required: false },
      { name: 'deductions', label: 'Deductions', type: 'number', placeholder: 'Total deductions', required: false },
    ],
  },
  {
    value: 'medical_bill',
    label: 'Medical Bill',
    description: 'Healthcare services bill',
    icon: '🏥',
    defaultAccessLevel: 'restricted',
    fields: [
      { name: 'recipientName', label: 'Patient Name', type: 'text', placeholder: 'Enter patient name', required: true },
      { name: 'patientId', label: 'Patient ID', type: 'text', placeholder: 'PAT001', required: false },
      { name: 'issueDate', label: 'Treatment Date', type: 'date', required: true },
      { name: 'treatmentType', label: 'Treatment Type', type: 'text', placeholder: 'Type of treatment', required: true },
      { name: 'description', label: 'Treatment Details', type: 'textarea', placeholder: 'Describe treatment/procedures', required: true },
    ],
  },
  {
    value: 'education_fee',
    label: 'Education Fee Receipt',
    description: 'School/college fee payment',
    icon: '🎓',
    defaultAccessLevel: 'restricted',
    fields: [
      { name: 'recipientName', label: 'Student Name', type: 'text', placeholder: 'Enter student name', required: true },
      { name: 'studentId', label: 'Student ID', type: 'text', placeholder: 'STU001', required: true },
      { name: 'course', label: 'Course/Class', type: 'text', placeholder: 'Course or class name', required: true },
      { name: 'issueDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'academicYear', label: 'Academic Year', type: 'text', placeholder: '2024-25', required: true },
      { name: 'description', label: 'Fee Description', type: 'textarea', placeholder: 'Tuition, exam fees, etc.', required: true },
    ],
  },
  {
    value: 'rent_receipt',
    label: 'Rent Receipt',
    description: 'Property rent payment receipt',
    icon: '🏠',
    defaultAccessLevel: 'public',
    fields: [
      { name: 'recipientName', label: 'Tenant Name', type: 'text', placeholder: 'Enter tenant name', required: true },
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', placeholder: 'Full property address', required: true },
      { name: 'issueDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'rentPeriod', label: 'Rent Period', type: 'text', placeholder: 'e.g., January 2024', required: true },
      { name: 'description', label: 'Additional Details', type: 'textarea', placeholder: 'Any additional information', required: false },
    ],
  },
  {
    value: 'reimbursement',
    label: 'Reimbursement Bill',
    description: 'Expense reimbursement claim',
    icon: '💳',
    defaultAccessLevel: 'restricted',
    fields: [
      { name: 'recipientName', label: 'Employee Name', type: 'text', placeholder: 'Enter employee name', required: true },
      { name: 'employeeId', label: 'Employee ID', type: 'text', placeholder: 'EMP001', required: true },
      { name: 'issueDate', label: 'Expense Date', type: 'date', required: true },
      { name: 'expenseCategory', label: 'Expense Category', type: 'select', required: true, options: [
        { value: 'travel', label: 'Travel' },
        { value: 'meals', label: 'Meals' },
        { value: 'accommodation', label: 'Accommodation' },
        { value: 'supplies', label: 'Office Supplies' },
        { value: 'other', label: 'Other' },
      ]},
      { name: 'description', label: 'Expense Description', type: 'textarea', placeholder: 'Describe the expense', required: true },
    ],
  },
  {
    value: 'tax_receipt',
    label: 'Tax Receipt',
    description: 'Tax payment acknowledgment',
    icon: '📊',
    defaultAccessLevel: 'government',
    fields: [
      { name: 'recipientName', label: 'Taxpayer Name', type: 'text', placeholder: 'Enter taxpayer name', required: true },
      { name: 'panNumber', label: 'PAN Number', type: 'text', placeholder: 'ABCDE1234F', required: true },
      { name: 'issueDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'taxType', label: 'Tax Type', type: 'select', required: true, options: [
        { value: 'income_tax', label: 'Income Tax' },
        { value: 'gst', label: 'GST' },
        { value: 'property_tax', label: 'Property Tax' },
        { value: 'other', label: 'Other' },
      ]},
      { name: 'assessmentYear', label: 'Assessment Year', type: 'text', placeholder: '2024-25', required: true },
      { name: 'description', label: 'Payment Details', type: 'textarea', placeholder: 'Additional details', required: false },
    ],
  },
]

// Access level descriptions
export const ACCESS_LEVEL_INFO = {
  public: {
    label: 'Public',
    description: 'Anyone can verify (full details visible)',
    color: 'var(--color-success)',
    fee: 1,
  },
  restricted: {
    label: 'Restricted',
    description: 'Companies & financial institutions only',
    color: 'var(--color-warning)',
    fee: 5,
  },
  government: {
    label: 'Government Only',
    description: 'Tax authorities & government agencies',
    color: 'var(--color-alert)',
    fee: 10,
  },
  financial: {
    label: 'Financial Institutions',
    description: 'Banks, NBFCs, insurance companies',
    color: 'var(--color-info)',
    fee: 8,
  },
}