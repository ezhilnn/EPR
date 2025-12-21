-- Migration: Create transactions table
-- Description: Financial transaction ledger for wallet operations

CREATE TYPE transaction_type AS ENUM (
    'bill_generation',
    'verification',
    'wallet_topup',
    'refund',
    'loyalty_bonus',
    'admin_adjustment'
);

CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User account
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Wallet balance tracking (for audit)
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    -- Related entities
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    verification_id UUID REFERENCES verifications(id) ON DELETE SET NULL,
    
    -- Payment gateway details (for topups)
    payment_gateway VARCHAR(50), -- 'razorpay', 'stripe', etc.
    payment_gateway_transaction_id VARCHAR(255),
    payment_method VARCHAR(50), -- 'upi', 'card', 'netbanking'
    
    -- Status
    status transaction_status DEFAULT 'completed',
    
    -- Metadata (flexible for different transaction types)
    metadata JSONB,
    /*
    Example for bill_generation:
    {
        "bill_number": "SAL202501000001",
        "generation_fee": 0.50
    }
    
    Example for wallet_topup:
    {
        "payment_gateway_order_id": "order_123456",
        "payment_method": "upi",
        "upi_id": "user@okaxis"
    }
    */
    
    -- Refund tracking
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    refunded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transactions_bill ON transactions(bill_id);
CREATE INDEX idx_transactions_verification ON transactions(verification_id);
CREATE INDEX idx_transactions_payment_gateway ON transactions(payment_gateway_transaction_id);

-- GIN index for JSON queries
CREATE INDEX idx_transactions_metadata_gin ON transactions USING gin(metadata);

-- Trigger for updated_at
CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to record a transaction (ensures atomic wallet update)
CREATE OR REPLACE FUNCTION record_transaction(
    p_user_id UUID,
    p_transaction_type transaction_type,
    p_amount DECIMAL,
    p_bill_id UUID DEFAULT NULL,
    p_verification_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_balance_before DECIMAL;
    v_balance_after DECIMAL;
BEGIN
    -- Get current balance (with row lock to prevent race conditions)
    SELECT wallet_balance INTO v_balance_before
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Calculate new balance
    v_balance_after := v_balance_before + p_amount;
    
    -- Check if balance would go negative
    IF v_balance_after < 0 THEN
        RAISE EXCEPTION 'Insufficient wallet balance: current=%, required=%', v_balance_before, ABS(p_amount);
    END IF;
    
    -- Update user wallet
    UPDATE users
    SET wallet_balance = v_balance_after,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Insert transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        bill_id,
        verification_id,
        metadata,
        status
    ) VALUES (
        p_user_id,
        p_transaction_type,
        p_amount,
        v_balance_before,
        v_balance_after,
        p_bill_id,
        p_verification_id,
        p_metadata,
        'completed'
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE transactions IS 'Financial ledger for all wallet operations - immutable audit trail';
COMMENT ON COLUMN transactions.balance_before IS 'Wallet balance before this transaction (for audit)';
COMMENT ON COLUMN transactions.balance_after IS 'Wallet balance after this transaction (for audit)';
COMMENT ON FUNCTION record_transaction IS 'Atomically updates wallet and creates transaction record - prevents race conditions';