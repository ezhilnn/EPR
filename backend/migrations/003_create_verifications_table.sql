-- Migration: Create verifications table
-- Description: Audit log of all bill verification requests

CREATE TYPE verification_status AS ENUM ('valid', 'invalid', 'suspicious', 'not_found', 'restricted');  -- FIXED: Changed 'restrcited' to 'restricted'

-- Verifications table
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What was verified
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) NOT NULL, -- Denormalized for quick lookup even if bill deleted
    
    -- Who verified
    verifier_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if public verification
    verifier_ip VARCHAR(45), -- Store IP for public verifications
    verifier_user_agent TEXT, -- Browser/device info
    
    -- Access level used
    access_level_used access_level NOT NULL,
    
    -- What data was revealed (for compliance/audit)
    data_revealed JSONB,
    /*
    Example:
    {
        "fields_shown": ["bill_number", "issuer_name", "issue_date", "amount"],
        "fields_hidden": ["employee_id", "bank_account", "address"]
    }
    */
    
    -- Pricing
    amount_charged DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    was_free BOOLEAN DEFAULT FALSE, -- Loyalty discount applied?
    pricing_rule_applied VARCHAR(50), -- e.g., "1_percent_of_bill", "flat_rate", "loyalty_free"
    
    -- Verification result
    verification_status verification_status NOT NULL,
    blockchain_verified BOOLEAN DEFAULT FALSE, -- Was hash verified on blockchain?
    blockchain_tx_id VARCHAR(255), -- Reference to blockchain transaction
    
    -- Fraud detection flags
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reason TEXT,
    
    -- Metadata
    response_time_ms INTEGER, -- How long the verification took
    
    -- Timestamp
    verified_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verifications_bill ON verifications(bill_id);
CREATE INDEX idx_verifications_bill_number ON verifications(bill_number);
CREATE INDEX idx_verifications_verifier ON verifications(verifier_id);
CREATE INDEX idx_verifications_date ON verifications(verified_at);
CREATE INDEX idx_verifications_status ON verifications(verification_status);
CREATE INDEX idx_verifications_ip ON verifications(verifier_ip);

-- GIN index for JSON queries
CREATE INDEX idx_verifications_data_gin ON verifications USING gin(data_revealed);

-- Comments
COMMENT ON TABLE verifications IS 'Complete audit log of all bill verification requests';
COMMENT ON COLUMN verifications.verifier_ip IS 'IP address for public verifications (GDPR compliant - anonymized after 90 days)';
COMMENT ON COLUMN verifications.data_revealed IS 'Tracks what information was shown to comply with data protection regulations';