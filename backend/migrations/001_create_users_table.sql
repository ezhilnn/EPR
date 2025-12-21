-- Migration: Create users table
-- Description: Stores user accounts (institutions, verifiers, admin)

-- Enable UUID extension (for generating unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for user roles and KYC status
CREATE TYPE user_role AS ENUM ('public', 'institution_user', 'institution_admin', 'verifier', 'master_admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'not_needed');  -- FIXED: Changed 'not-needed' to 'not_needed'

-- Create users table
CREATE TABLE users (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'public',
    
    -- Organization details
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50), -- 'small_shop', 'company', 'hospital', 'school', etc.
    gstin VARCHAR(15), -- GST Identification Number (optional for small shops)
    pan VARCHAR(10), -- PAN card number (for KYC)
    
    -- KYC (Know Your Customer) verification
    kyc_status kyc_status DEFAULT 'not_needed',  -- FIXED: Changed to match ENUM
    kyc_documents JSONB, -- Stores document URLs/metadata as JSON
    kyc_verified_at TIMESTAMP,
    kyc_verified_by UUID REFERENCES users(id), -- Admin who verified
    kyc_rejection_reason TEXT,
    
    -- Wallet for bill generation & verification fees
    wallet_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0),
    
    -- Loyalty program
    verification_count INTEGER DEFAULT 0 CHECK (verification_count >= 0), -- Total verifications done
    free_verifications_earned INTEGER DEFAULT 0 CHECK (free_verifications_earned >= 0), -- Free verifications available
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    
    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_organization ON users(organization_name);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any UPDATE on users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default master admin user (password: admin123)
-- Password hash generated using bcrypt with cost 10
INSERT INTO users (
    email, 
    password_hash, 
    role, 
    organization_name,
    organization_type,
    kyc_status, 
    is_active,
    is_email_verified,
    wallet_balance
) VALUES (
    'admin@billengine.com',
    '$2a$10$rKvVLG.qYZ3VxZ0LK0k3G.nX5yXGqYQVH0qvRZ5oZ8CK0YQK0YKZC', -- admin123
    'master_admin',
    'Bill Verification System',
    'platform',
    'approved',
    TRUE,
    TRUE,
    10000.00  -- Give admin some initial balance for testing
);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts for bill generation and verification';
COMMENT ON COLUMN users.role IS 'User role: public (view only), institution_user (generate bills), institution_admin (manage org), verifier (govt/agencies), master_admin (platform admin)';
COMMENT ON COLUMN users.wallet_balance IS 'Balance for paying bill generation and verification fees';
COMMENT ON COLUMN users.verification_count IS 'Total number of verifications performed (for loyalty program)';
COMMENT ON COLUMN users.pan IS 'Permanent Account Number for KYC verification';