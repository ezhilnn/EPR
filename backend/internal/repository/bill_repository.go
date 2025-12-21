package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/jmoiron/sqlx"
)

// BillRepository handles database operations for bills
type BillRepository struct {
	db *sqlx.DB
}

// NewBillRepository creates a new bill repository
func NewBillRepository(db *sqlx.DB) *BillRepository {
	return &BillRepository{db: db}
}

// Create inserts a new bill into the database
func (r *BillRepository) Create(ctx context.Context, bill *models.Bill) error {
	query := `
		INSERT INTO bills (
			bill_number, bill_type, access_level, issuer_id, issuer_name,
			bill_data, amount, currency, issue_date, data_hash,
			blockchain_status, is_active
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		) RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		bill.BillNumber,
		bill.BillType,
		bill.AccessLevel,
		bill.IssuerID,
		bill.IssuerName,
		bill.BillData,
		bill.Amount,
		bill.Currency,
		bill.IssueDate,
		bill.DataHash,
		bill.BlockchainStatus,
		bill.IsActive,
	).Scan(&bill.ID, &bill.CreatedAt, &bill.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create bill: %w", err)
	}

	return nil
}

// GetByID retrieves a bill by ID
func (r *BillRepository) GetByID(ctx context.Context, id string) (*models.Bill, error) {
	var bill models.Bill
	query := `SELECT * FROM bills WHERE id = $1 AND is_deleted = false`

	err := r.db.GetContext(ctx, &bill, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, fmt.Errorf("failed to get bill: %w", err)
	}

	return &bill, nil
}

// GetByBillNumber retrieves a bill by bill number
func (r *BillRepository) GetByBillNumber(ctx context.Context, billNumber string) (*models.Bill, error) {
	var bill models.Bill
	query := `SELECT * FROM bills WHERE bill_number = $1 AND is_deleted = false`

	err := r.db.GetContext(ctx, &bill, query, billNumber)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, fmt.Errorf("failed to get bill: %w", err)
	}

	return &bill, nil
}

// ListByIssuer retrieves bills by issuer ID with pagination
func (r *BillRepository) ListByIssuer(ctx context.Context, issuerID string, limit, offset int) ([]*models.Bill, error) {
	var bills []*models.Bill
	query := `
		SELECT * FROM bills 
		WHERE issuer_id = $1 AND is_deleted = false 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3
	`

	err := r.db.SelectContext(ctx, &bills, query, issuerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list bills: %w", err)
	}

	return bills, nil
}

// CountByIssuer counts total bills for an issuer
func (r *BillRepository) CountByIssuer(ctx context.Context, issuerID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM bills WHERE issuer_id = $1 AND is_deleted = false`

	err := r.db.GetContext(ctx, &count, query, issuerID)
	if err != nil {
		return 0, fmt.Errorf("failed to count bills: %w", err)
	}

	return count, nil
}

// GetStatsByIssuer retrieves statistics for an issuer
func (r *BillRepository) GetStatsByIssuer(ctx context.Context, issuerID string) (*models.BillStats, error) {
	stats := &models.BillStats{}

	// Total bills
	query := `SELECT COUNT(*) FROM bills WHERE issuer_id = $1 AND is_deleted = false`
	err := r.db.GetContext(ctx, &stats.TotalBills, query, issuerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total bills: %w", err)
	}

	// This month's bills
	query = `
		SELECT COUNT(*) FROM bills 
		WHERE issuer_id = $1 
		AND is_deleted = false 
		AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
	`
	err = r.db.GetContext(ctx, &stats.ThisMonthBills, query, issuerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly bills: %w", err)
	}

	// Active bills
	query = `
		SELECT COUNT(*) FROM bills 
		WHERE issuer_id = $1 
		AND is_deleted = false 
		AND is_active = true
	`
	err = r.db.GetContext(ctx, &stats.ActiveBills, query, issuerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get active bills: %w", err)
	}

	// Total amount
	query = `
		SELECT COALESCE(SUM(amount), 0) FROM bills 
		WHERE issuer_id = $1 
		AND is_deleted = false
	`
	err = r.db.GetContext(ctx, &stats.TotalAmount, query, issuerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total amount: %w", err)
	}

	// Total verifications (will be implemented with verifications table)
	stats.TotalVerifications = 0

	return stats, nil
}

// SoftDelete marks a bill as deleted
func (r *BillRepository) SoftDelete(ctx context.Context, id, reason string) error {
	query := `
		UPDATE bills 
		SET is_deleted = true, 
		    deletion_reason = $2, 
		    deleted_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id, reason)
	if err != nil {
		return fmt.Errorf("failed to delete bill: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("bill not found")
	}

	return nil
}

// UpdateBlockchainStatus updates the blockchain status of a bill
func (r *BillRepository) UpdateBlockchainStatus(ctx context.Context, id, txID string, status models.BlockchainStatus) error {
	query := `
		UPDATE bills 
		SET blockchain_tx_id = $2, 
		    blockchain_status = $3,
		    blockchain_confirmed_at = CASE WHEN $3 = 'confirmed' THEN NOW() ELSE NULL END,
		    updated_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id, txID, status)
	if err != nil {
		return fmt.Errorf("failed to update blockchain status: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("bill not found")
	}

	return nil
}

// GenerateBillNumber generates a unique bill number
func (r *BillRepository) GenerateBillNumber(ctx context.Context, billType models.BillType) (string, error) {
	var billNumber string
	query := `SELECT generate_bill_number($1)`

	err := r.db.GetContext(ctx, &billNumber, query, billType)
	if err != nil {
		return "", fmt.Errorf("failed to generate bill number: %w", err)
	}

	return billNumber, nil
}

// Search bills by various criteria
func (r *BillRepository) Search(ctx context.Context, issuerID string, billType *models.BillType, startDate, endDate *time.Time, limit, offset int) ([]*models.Bill, error) {
	var bills []*models.Bill

	query := `
		SELECT * FROM bills 
		WHERE issuer_id = $1 
		AND is_deleted = false
	`
	args := []interface{}{issuerID}
	argCount := 1

	if billType != nil {
		argCount++
		query += fmt.Sprintf(" AND bill_type = $%d", argCount)
		args = append(args, *billType)
	}

	if startDate != nil {
		argCount++
		query += fmt.Sprintf(" AND issue_date >= $%d", argCount)
		args = append(args, *startDate)
	}

	if endDate != nil {
		argCount++
		query += fmt.Sprintf(" AND issue_date <= $%d", argCount)
		args = append(args, *endDate)
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
	args = append(args, limit, offset)

	err := r.db.SelectContext(ctx, &bills, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search bills: %w", err)
	}

	return bills, nil
}
