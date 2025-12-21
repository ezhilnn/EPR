-- Migration: Create bills table
-- Description: Stores bill data (not PDFs - we generate on-demand)

-- Create ENUM types
CREATE TYPE bill_type AS ENUM (
    'salary_slip',
    'sales_invoice',
    'medical_bill',
    'purchase_invoice',
    'rental_agreement',
    'education_fee',
    'rent_receipt',
    'reimbursement',
    'loan_statement',
    'tax_receipt',
    'insurance_policy',
    'other'
);


CREATE TYPE access_level AS ENUM ('public', 'restricted', 'government','financial');
CREATE TYPE blockchain_status AS ENUM ('pending', 'confirmed', 'failed');

-- Bills table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Unique bill identifier (human-readable)
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    -- Format: [TYPE][YEAR][MONTH][SEQUENCE]
    -- Example: SAL202501000001 (Salary slip, Jan 2025, 1st bill)
    --          INV202501000002 (Invoice, Jan 2025, 2nd bill)
    
    -- Classification
    bill_type bill_type NOT NULL,
    access_level access_level NOT NULL DEFAULT 'public',
    
    -- Issuer information
    issuer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issuer_name VARCHAR(255) NOT NULL, -- Denormalized for performance
    
    -- Bill data (stored as JSON for flexibility)
    bill_data JSONB NOT NULL,
    /*
    Example structure for salary slip:
    {
        "employee_name": "John Doe",
        "employee_id": "EMP001",
        "designation": "Software Engineer",
        "department": "Engineering",
        "month": "January 2025",
        "pay_period": {"from": "2025-01-01", "to": "2025-01-31"},
        "earnings": {
            "basic_salary": 40000,
            "hra": 8000,
            "special_allowance": 2000,
            "total": 50000
        },
        "deductions": {
            "pf": 4800,
            "professional_tax": 200,
            "total": 5000
        },
        "net_salary": 45000,
        "bank_details": {
            "account_number": "XXXX1234",
            "ifsc": "SBIN0001234",
            "bank_name": "State Bank of India"
        }
    }
    */
    
    -- Amount (denormalized for quick access and pricing calculation)
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Issue date
    issue_date DATE NOT NULL,
    
    -- Blockchain integration
    data_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of normalized bill_data
    blockchain_tx_id VARCHAR(255), -- Hyperledger Fabric transaction ID
    blockchain_status blockchain_status DEFAULT 'pending',
    blockchain_confirmed_at TIMESTAMP,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
    deletion_reason TEXT,
    deleted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bills_number ON bills(bill_number);
CREATE INDEX idx_bills_issuer ON bills(issuer_id);
CREATE INDEX idx_bills_type ON bills(bill_type);
CREATE INDEX idx_bills_access_level ON bills(access_level);
CREATE INDEX idx_bills_hash ON bills(data_hash);
CREATE INDEX idx_bills_date ON bills(issue_date);
CREATE INDEX idx_bills_blockchain_status ON bills(blockchain_status);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_bills_active ON bills(is_active) WHERE is_active = TRUE;

-- GIN index for JSON queries (allows searching inside bill_data)
CREATE INDEX idx_bills_data_gin ON bills USING gin(bill_data);

-- Trigger for updated_at
CREATE TRIGGER bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate bill number
CREATE OR REPLACE FUNCTION generate_bill_number(p_bill_type bill_type)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_year VARCHAR(4);
    v_month VARCHAR(2);
    v_sequence INTEGER;
    v_bill_number VARCHAR(50);
BEGIN
    -- Generate prefix based on bill type
    v_prefix := CASE p_bill_type
        WHEN 'salary_slip'       THEN 'SAL'
        WHEN 'sales_invoice'     THEN 'INV' -- Matches sales_invoice
        WHEN 'medical_bill'      THEN 'MED'
        WHEN 'purchase_invoice'  THEN 'PUR' -- Matches purchase_invoice
        WHEN 'rental_agreement'  THEN 'RNT'
        WHEN 'education_fee'     THEN 'EDU' -- Corrected to match ENUM
        WHEN 'rent_receipt'      THEN 'RCT' -- New logical prefix
        WHEN 'reimbursement'     THEN 'REI' -- New logical prefix
        WHEN 'loan_statement'    THEN 'LON'
        WHEN 'tax_receipt'       THEN 'TAX'
        WHEN 'insurance_policy'  THEN 'INS'
        ELSE 'OTH'
    END;
    
    -- Get current year and month
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_month := TO_CHAR(NOW(), 'MM');
    
    -- Get next sequence number for this type/month
    SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 12 FOR 6) AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM bills
    WHERE bill_number LIKE v_prefix || v_year || v_month || '%';
    
    -- Format: SAL202501000001 (3 + 4 + 2 + 6 = 15 chars)
    v_bill_number := v_prefix || v_year || v_month || LPAD(v_sequence::TEXT, 6, '0');
    
    RETURN v_bill_number;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE bills IS 'Stores bill metadata and data (PDFs generated on-demand)';
COMMENT ON COLUMN bills.bill_data IS 'JSON structure varies by bill_type - flexible schema';
COMMENT ON COLUMN bills.data_hash IS 'SHA-256 hash of normalized JSON for blockchain verification';
COMMENT ON FUNCTION generate_bill_number IS 'Auto-generates unique bill numbers like SAL202501000001';