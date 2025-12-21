package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/ezhilnn/epr-backend/internal/models"
)

// VerificationRepository handles database operations for verifications
type VerificationRepository struct {
	db *sqlx.DB
}

// NewVerificationRepository creates a new verification repository
func NewVerificationRepository(db *sqlx.DB) *VerificationRepository {
	return &VerificationRepository{db: db}
}

// Create inserts a new verification record
func (r *VerificationRepository) Create(ctx context.Context, verification *models.Verification) error {
	query := `
		INSERT INTO verifications (
			bill_id, bill_number, verifier_id, verifier_ip, verifier_user_agent,
			access_level_used, data_revealed, amount_charged, was_free,
			pricing_rule_applied, verification_status, blockchain_verified,
			blockchain_tx_id, is_suspicious, suspicious_reason, response_time_ms
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		) RETURNING id, verified_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		verification.BillID,
		verification.BillNumber,
		verification.VerifierID,
		verification.VerifierIP,
		verification.VerifierUserAgent,
		verification.AccessLevelUsed,
		verification.DataRevealed,
		verification.AmountCharged,
		verification.WasFree,
		verification.PricingRuleApplied,
		verification.VerificationStatus,
		verification.BlockchainVerified,
		verification.BlockchainTxID,
		verification.IsSuspicious,
		verification.SuspiciousReason,
		verification.ResponseTimeMs,
	).Scan(&verification.ID, &verification.VerifiedAt)

	if err != nil {
		return fmt.Errorf("failed to create verification: %w", err)
	}

	return nil
}

// ListByVerifier retrieves verifications by verifier with pagination
func (r *VerificationRepository) ListByVerifier(ctx context.Context, verifierID string, limit, offset int) ([]*models.Verification, error) {
	var verifications []*models.Verification
	query := `
		SELECT * FROM verifications 
		WHERE verifier_id = $1 
		ORDER BY verified_at DESC 
		LIMIT $2 OFFSET $3
	`

	err := r.db.SelectContext(ctx, &verifications, query, verifierID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list verifications: %w", err)
	}

	return verifications, nil
}

// CountByVerifier counts total verifications for a verifier
func (r *VerificationRepository) CountByVerifier(ctx context.Context, verifierID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM verifications WHERE verifier_id = $1`

	err := r.db.GetContext(ctx, &count, query, verifierID)
	if err != nil {
		return 0, fmt.Errorf("failed to count verifications: %w", err)
	}

	return count, nil
}

// GetStatsByVerifier retrieves statistics for a verifier
func (r *VerificationRepository) GetStatsByVerifier(ctx context.Context, verifierID string) (*models.VerificationStats, error) {
	stats := &models.VerificationStats{}

	// Total verifications
	query := `SELECT COUNT(*) FROM verifications WHERE verifier_id = $1`
	err := r.db.GetContext(ctx, &stats.TotalVerifications, query, verifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total verifications: %w", err)
	}

	// Total spent
	query = `SELECT COALESCE(SUM(amount_charged), 0) FROM verifications WHERE verifier_id = $1`
	err = r.db.GetContext(ctx, &stats.TotalSpent, query, verifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get total spent: %w", err)
	}

	// Valid count
	query = `SELECT COUNT(*) FROM verifications WHERE verifier_id = $1 AND verification_status = 'valid'`
	err = r.db.GetContext(ctx, &stats.ValidCount, query, verifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get valid count: %w", err)
	}

	// Invalid count
	query = `SELECT COUNT(*) FROM verifications WHERE verifier_id = $1 AND verification_status = 'invalid'`
	err = r.db.GetContext(ctx, &stats.InvalidCount, query, verifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get invalid count: %w", err)
	}

	// Restricted count
	query = `SELECT COUNT(*) FROM verifications WHERE verifier_id = $1 AND verification_status = 'restricted'`
	err = r.db.GetContext(ctx, &stats.RestrictedCount, query, verifierID)
	if err != nil {
		return nil, fmt.Errorf("failed to get restricted count: %w", err)
	}

	// Calculate success rate
	if stats.TotalVerifications > 0 {
		stats.SuccessRate = float64(stats.ValidCount) / float64(stats.TotalVerifications) * 100
	}

	return stats, nil
}

// CountVerificationsByBill counts how many times a bill has been verified
func (r *VerificationRepository) CountVerificationsByBill(ctx context.Context, billID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM verifications WHERE bill_id = $1`

	err := r.db.GetContext(ctx, &count, query, billID)
	if err != nil {
		return 0, fmt.Errorf("failed to count bill verifications: %w", err)
	}

	return count, nil
}

// SearchVerifications searches verifications with filters
func (r *VerificationRepository) SearchVerifications(
	ctx context.Context,
	verifierID string,
	status *models.VerificationStatus,
	startDate, endDate *time.Time,
	limit, offset int,
) ([]*models.Verification, error) {
	var verifications []*models.Verification
	
	query := `
		SELECT * FROM verifications 
		WHERE verifier_id = $1
	`
	args := []interface{}{verifierID}
	argCount := 1

	if status != nil {
		argCount++
		query += fmt.Sprintf(" AND verification_status = $%d", argCount)
		args = append(args, *status)
	}

	if startDate != nil {
		argCount++
		query += fmt.Sprintf(" AND verified_at >= $%d", argCount)
		args = append(args, *startDate)
	}

	if endDate != nil {
		argCount++
		query += fmt.Sprintf(" AND verified_at <= $%d", argCount)
		args = append(args, *endDate)
	}

	query += " ORDER BY verified_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
	args = append(args, limit, offset)

	err := r.db.SelectContext(ctx, &verifications, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search verifications: %w", err)
	}

	return verifications, nil
}