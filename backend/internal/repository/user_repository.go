package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/jmoiron/sqlx"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create inserts a new user into the database
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (
			email, password_hash, role, organization_name, organization_type,
			gstin, pan, kyc_status, wallet_balance, is_active, is_email_verified
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.OrganizationName,
		user.OrganizationType,
		user.GSTIN,
		user.PAN,
		user.KYCStatus,
		user.WalletBalance,
		user.IsActive,
		user.IsEmailVerified,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	query := `SELECT * FROM users WHERE id = $1 AND is_active = true`

	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	query := `SELECT * FROM users WHERE email = $1`

	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// EmailExists checks if an email is already registered
func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	err := r.db.GetContext(ctx, &exists, query, email)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return exists, nil
}

// UpdateLastLogin updates the last login timestamp
func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	query := `UPDATE users SET last_login_at = $1, updated_at = NOW() WHERE id = $2`

	_, err := r.db.ExecContext(ctx, query, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	return nil
}

// UpdateWalletBalance updates the user's wallet balance
func (r *UserRepository) UpdateWalletBalance(ctx context.Context, userID string, newBalance float64) error {
	query := `UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query, newBalance, userID)
	if err != nil {
		return fmt.Errorf("failed to update wallet balance: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// IncrementVerificationCount increments the verification count and checks for loyalty rewards
func (r *UserRepository) IncrementVerificationCount(ctx context.Context, userID string) (bool, error) {
	// Use a transaction to ensure atomicity
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return false, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Increment verification count
	query := `
		UPDATE users 
		SET verification_count = verification_count + 1, 
		    updated_at = NOW()
		WHERE id = $1
		RETURNING verification_count
	`

	var newCount int
	err = tx.QueryRowContext(ctx, query, userID).Scan(&newCount)
	if err != nil {
		return false, fmt.Errorf("failed to increment verification count: %w", err)
	}

	// Check if user earned a free verification (every 10th verification)
	earnedFree := false
	if newCount%10 == 0 {
		query = `
			UPDATE users 
			SET free_verifications_earned = free_verifications_earned + 1
			WHERE id = $1
		`
		_, err = tx.ExecContext(ctx, query, userID)
		if err != nil {
			return false, fmt.Errorf("failed to update free verifications: %w", err)
		}
		earnedFree = true
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return earnedFree, nil
}

// List retrieves a paginated list of users
func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]*models.User, error) {
	var users []*models.User
	query := `
		SELECT * FROM users 
		WHERE is_active = true 
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2
	`

	err := r.db.SelectContext(ctx, &users, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	return users, nil
}
