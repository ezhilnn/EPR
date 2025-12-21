package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// VerificationStatus represents the result of bill verification
type VerificationStatus string

const (
	VerificationValid      VerificationStatus = "valid"
	VerificationInvalid    VerificationStatus = "invalid"
	VerificationSuspicious VerificationStatus = "suspicious"
	VerificationNotFound   VerificationStatus = "not_found"
	VerificationRestricted VerificationStatus = "restricted"
)

// Verification represents a bill verification record
type Verification struct {
	ID                string             `db:"id" json:"id"`
	BillID            *string            `db:"bill_id" json:"bill_id,omitempty"`
	BillNumber        string             `db:"bill_number" json:"bill_number"`
	VerifierID        *string            `db:"verifier_id" json:"verifier_id,omitempty"`
	VerifierIP        *string            `db:"verifier_ip" json:"verifier_ip,omitempty"`
	VerifierUserAgent *string            `db:"verifier_user_agent" json:"verifier_user_agent,omitempty"`
	AccessLevelUsed   AccessLevel        `db:"access_level_used" json:"access_level_used"`
	DataRevealed      json.RawMessage    `db:"data_revealed" json:"data_revealed,omitempty"`
	AmountCharged     float64            `db:"amount_charged" json:"amount_charged"`
	WasFree           bool               `db:"was_free" json:"was_free"`
	PricingRuleApplied string            `db:"pricing_rule_applied" json:"pricing_rule_applied"`
	VerificationStatus VerificationStatus `db:"verification_status" json:"verification_status"`
	BlockchainVerified bool               `db:"blockchain_verified" json:"blockchain_verified"`
	BlockchainTxID    *string            `db:"blockchain_tx_id" json:"blockchain_tx_id,omitempty"`
	IsSuspicious      bool               `db:"is_suspicious" json:"is_suspicious"`
	SuspiciousReason  *string            `db:"suspicious_reason" json:"suspicious_reason,omitempty"`
	ResponseTimeMs    int                `db:"response_time_ms" json:"response_time_ms"`
	VerifiedAt        time.Time          `db:"verified_at" json:"verified_at"`
}

// VerifyBillRequest represents the request to verify a bill
type VerifyBillRequest struct {
	BillNumber string `json:"bill_number" binding:"required"`
}

// VerifyBillResponse represents the verification result
type VerifyBillResponse struct {
	Success    bool                   `json:"success"`
	BillNumber string                 `json:"bill_number"`
	Status     string                 `json:"status"` // valid, invalid, restricted
	IssuerName string                 `json:"issuer_name,omitempty"`
	IssueDate  string                 `json:"issue_date,omitempty"`
	BillType   string                 `json:"bill_type,omitempty"`
	Message    string                 `json:"message"`
	Details    map[string]interface{} `json:"details,omitempty"`
	Fee        float64                `json:"fee"`
}

// VerificationHistoryResponse represents a verification in history list
type VerificationHistoryResponse struct {
	ID          string  `json:"id"`
	BillNumber  string  `json:"bill_number"`
	IssuerName  string  `json:"issuer_name"`
	BillType    string  `json:"bill_type"`
	Date        string  `json:"verification_date"`
	Result      string  `json:"result"`
	Fee         float64 `json:"fee"`
	WasFree     bool    `json:"was_free"`
}

// VerificationStats represents verification statistics
type VerificationStats struct {
	TotalVerifications int     `json:"total_verifications"`
	TotalSpent         float64 `json:"total_spent"`
	ValidCount         int     `json:"valid_count"`
	InvalidCount       int     `json:"invalid_count"`
	RestrictedCount    int     `json:"restricted_count"`
	SuccessRate        float64 `json:"success_rate"`
}

// Value/Scan implementations
func (vs VerificationStatus) Value() (driver.Value, error) {
	return string(vs), nil
}

func (vs *VerificationStatus) Scan(value interface{}) error {
	if value == nil {
		*vs = VerificationNotFound
		return nil
	}
	if sv, ok := value.(string); ok {
		*vs = VerificationStatus(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*vs = VerificationStatus(string(bv))
		return nil
	}
	return nil
}