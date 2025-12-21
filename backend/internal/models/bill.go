package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// BillType represents the type of bill
type BillType string

const (
	BillTypeSalarySlip        BillType = "salary_slip"
	BillTypeSalesInvoice      BillType = "sales_invoice"
	BillTypeMedicalBill       BillType = "medical_bill"
	BillTypePurchaseInvoice   BillType = "purchase_invoice"
	BillTypeRentalAgreement   BillType = "rental_agreement"
	BillTypeEducationFee      BillType = "education_fee"
	BillTypeRentReceipt       BillType = "rent_receipt"
	BillTypeReimbursement     BillType = "reimbursement"
	BillTypeLoanStatement     BillType = "loan_statement"
	BillTypeTaxReceipt        BillType = "tax_receipt"
	BillTypeInsurancePolicy   BillType = "insurance_policy"
	BillTypeOther             BillType = "other"
)

// AccessLevel represents who can access bill details
type AccessLevel string

const (
	AccessLevelPublic     AccessLevel = "public"
	AccessLevelRestricted AccessLevel = "restricted"
	AccessLevelGovernment AccessLevel = "government"
	AccessLevelFinancial  AccessLevel = "financial"
)

// BlockchainStatus represents the status of blockchain commitment
type BlockchainStatus string

const (
	BlockchainPending   BlockchainStatus = "pending"
	BlockchainConfirmed BlockchainStatus = "confirmed"
	BlockchainFailed    BlockchainStatus = "failed"
)

// Bill represents a bill in the system
type Bill struct {
	ID           string           `db:"id" json:"id"`
	BillNumber   string           `db:"bill_number" json:"bill_number"`
	BillType     BillType         `db:"bill_type" json:"bill_type"`
	AccessLevel  AccessLevel      `db:"access_level" json:"access_level"`
	
	// Issuer information
	IssuerID     string           `db:"issuer_id" json:"issuer_id"`
	IssuerName   string           `db:"issuer_name" json:"issuer_name"`
	
	// Bill data (stored as JSONB)
	BillData     json.RawMessage  `db:"bill_data" json:"bill_data"`
	
	// Amount
	Amount       float64          `db:"amount" json:"amount"`
	Currency     string           `db:"currency" json:"currency"`
	
	// Date
	IssueDate    time.Time        `db:"issue_date" json:"issue_date"`
	
	// Blockchain
	DataHash              string           `db:"data_hash" json:"data_hash"`
	BlockchainTxID        *string          `db:"blockchain_tx_id" json:"blockchain_tx_id,omitempty"`
	BlockchainStatus      BlockchainStatus `db:"blockchain_status" json:"blockchain_status"`
	BlockchainConfirmedAt *time.Time       `db:"blockchain_confirmed_at" json:"blockchain_confirmed_at,omitempty"`
	
	// Metadata
	IsActive     bool             `db:"is_active" json:"is_active"`
	IsDeleted    bool             `db:"is_deleted" json:"is_deleted"`
	DeletionReason *string        `db:"deletion_reason" json:"deletion_reason,omitempty"`
	DeletedAt    *time.Time       `db:"deleted_at" json:"deleted_at,omitempty"`
	
	// Timestamps
	CreatedAt    time.Time        `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time        `db:"updated_at" json:"updated_at"`
}

// CreateBillRequest represents the request to create a new bill
type CreateBillRequest struct {
	BillType    BillType               `json:"bill_type" binding:"required"`
	AccessLevel AccessLevel            `json:"access_level" binding:"required"`
	IssuerGSTIN string                 `json:"issuer_gstin"`
	Amount      float64                `json:"amount" binding:"required,gt=0"`
	IssueDate   string                 `json:"issue_date" binding:"required"` // Format: YYYY-MM-DD
	BillData    map[string]interface{} `json:"bill_data" binding:"required"`
}

// BillResponse represents a bill in API responses
type BillResponse struct {
	ID              string                 `json:"id"`
	BillNumber      string                 `json:"bill_number"`
	BillType        string                 `json:"bill_type"`
	AccessLevel     string                 `json:"access_level"`
	IssuerName      string                 `json:"issuer_name"`
	Amount          float64                `json:"amount"`
	Currency        string                 `json:"currency"`
	IssueDate       string                 `json:"issue_date"`
	DataHash        string                 `json:"data_hash"`
	BlockchainStatus string                `json:"blockchain_status"`
	BillData        map[string]interface{} `json:"bill_data,omitempty"`
	CreatedAt       string                 `json:"created_at"`
}

// BillListResponse represents a bill in list views (limited data)
type BillListResponse struct {
	ID              string  `json:"id"`
	BillNumber      string  `json:"bill_number"`
	BillType        string  `json:"bill_type"`
	IssuerName      string  `json:"issuer_name"`
	Amount          float64 `json:"amount"`
	IssueDate       string  `json:"issue_date"`
	VerificationCount int   `json:"verification_count"` // Will be added later
	Status          string  `json:"status"` // active/verified/pending
	CreatedAt       string  `json:"created_at"`
}

// BillStats represents statistics for dashboard
type BillStats struct {
	TotalBills       int     `json:"total_bills"`
	ThisMonthBills   int     `json:"this_month_bills"`
	TotalVerifications int   `json:"total_verifications"`
	ActiveBills      int     `json:"active_bills"`
	TotalAmount      float64 `json:"total_amount"`
}

// Value/Scan implementations for custom types

func (b BillType) Value() (driver.Value, error) {
	return string(b), nil
}

func (b *BillType) Scan(value interface{}) error {
	if value == nil {
		*b = BillTypeOther
		return nil
	}
	if sv, ok := value.(string); ok {
		*b = BillType(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*b = BillType(string(bv))
		return nil
	}
	return nil
}

func (a AccessLevel) Value() (driver.Value, error) {
	return string(a), nil
}

func (a *AccessLevel) Scan(value interface{}) error {
	if value == nil {
		*a = AccessLevelPublic
		return nil
	}
	if sv, ok := value.(string); ok {
		*a = AccessLevel(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*a = AccessLevel(string(bv))
		return nil
	}
	return nil
}

func (bs BlockchainStatus) Value() (driver.Value, error) {
	return string(bs), nil
}

func (bs *BlockchainStatus) Scan(value interface{}) error {
	if value == nil {
		*bs = BlockchainPending
		return nil
	}
	if sv, ok := value.(string); ok {
		*bs = BlockchainStatus(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*bs = BlockchainStatus(string(bv))
		return nil
	}
	return nil
}