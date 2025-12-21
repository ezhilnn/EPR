package models

import (
	"database/sql/driver"
	"time"
)

// UserRole represents the role of a user in the system
type UserRole string

const (
	RolePublic           UserRole = "public"
	RoleInstitutionUser  UserRole = "institution_user"
	RoleInstitutionAdmin UserRole = "institution_admin"
	RoleVerifier         UserRole = "verifier"
	RoleMasterAdmin      UserRole = "master_admin"
)

// KYCStatus represents the KYC verification status
type KYCStatus string

const (
	KYCPending    KYCStatus = "pending"
	KYCApproved   KYCStatus = "approved"
	KYCRejected   KYCStatus = "rejected"
	KYCNotNeeded  KYCStatus = "not_needed"
)

// User represents a user in the system
// This struct matches the 'users' table in PostgreSQL
type User struct {
	// Primary fields
	ID               string    `db:"id" json:"id"`
	Email            string    `db:"email" json:"email"`
	PasswordHash     string    `db:"password_hash" json:"-"` // Never send password in JSON
	Role             UserRole  `db:"role" json:"role"`
	
	// Organization details
	OrganizationName string    `db:"organization_name" json:"organization_name"`
	OrganizationType *string   `db:"organization_type" json:"organization_type,omitempty"`
	GSTIN            *string   `db:"gstin" json:"gstin,omitempty"`
	PAN              *string   `db:"pan" json:"pan,omitempty"`
	
	// KYC verification
	KYCStatus          KYCStatus  `db:"kyc_status" json:"kyc_status"`
	KYCDocuments       *string    `db:"kyc_documents" json:"kyc_documents,omitempty"` // JSONB stored as string
	KYCVerifiedAt      *time.Time `db:"kyc_verified_at" json:"kyc_verified_at,omitempty"`
	KYCVerifiedBy      *string    `db:"kyc_verified_by" json:"kyc_verified_by,omitempty"`
	KYCRejectionReason *string    `db:"kyc_rejection_reason" json:"kyc_rejection_reason,omitempty"`
	
	// Wallet
	WalletBalance            float64 `db:"wallet_balance" json:"wallet_balance"`
	
	// Loyalty
	VerificationCount        int     `db:"verification_count" json:"verification_count"`
	FreeVerificationsEarned  int     `db:"free_verifications_earned" json:"free_verifications_earned"`
	
	// Account status
	IsActive                 bool      `db:"is_active" json:"is_active"`
	IsEmailVerified          bool      `db:"is_email_verified" json:"is_email_verified"`
	EmailVerificationToken   *string   `db:"email_verification_token" json:"-"` // Don't expose in API
	
	// Password reset
	PasswordResetToken       *string   `db:"password_reset_token" json:"-"`
	PasswordResetExpiresAt   *time.Time `db:"password_reset_expires_at" json:"-"`
	
	// Timestamps
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
	LastLoginAt *time.Time `db:"last_login_at" json:"last_login_at,omitempty"`
}

// PublicUser returns a safe version of User without sensitive data
// Use this when returning user info to clients
func (u *User) PublicUser() map[string]interface{} {
	return map[string]interface{}{
		"id":                 u.ID,
		"email":              u.Email,
		"role":               u.Role,
		"organization_name":  u.OrganizationName,
		"kyc_status":         u.KYCStatus,
		"wallet_balance":     u.WalletBalance,
		"is_active":          u.IsActive,
		"is_email_verified":  u.IsEmailVerified,
		"created_at":         u.CreatedAt,
	}
}

// CreateUserRequest represents the request body for user registration
type CreateUserRequest struct {
	Email            string   `json:"email" binding:"required,email"`
	Password         string   `json:"password" binding:"required,min=8"`
	OrganizationName string   `json:"organization_name" binding:"required"`
	OrganizationType string   `json:"organization_type"`
	GSTIN            string   `json:"gstin"`
	PAN              string   `json:"pan"`
	Role             UserRole `json:"role" binding:"required,oneof=public institution_user institution_admin verifier"`
}

// LoginRequest represents the request body for login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the response after successful login
type LoginResponse struct {
	AccessToken  string                 `json:"access_token"`
	RefreshToken string                 `json:"refresh_token"`
	User         map[string]interface{} `json:"user"`
	ExpiresIn    int64                  `json:"expires_in"` // Seconds until access token expires
}

// RefreshTokenRequest represents the request to refresh access token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Value implements the driver.Valuer interface for UserRole
// This allows UserRole to be stored in database
func (r UserRole) Value() (driver.Value, error) {
	return string(r), nil
}

// Scan implements the sql.Scanner interface for UserRole
// This allows UserRole to be read from database
func (r *UserRole) Scan(value interface{}) error {
	if value == nil {
		*r = RolePublic
		return nil
	}
	if sv, ok := value.(string); ok {
		*r = UserRole(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*r = UserRole(string(bv))
		return nil
	}
	return nil
}

// Value implements the driver.Valuer interface for KYCStatus
func (k KYCStatus) Value() (driver.Value, error) {
	return string(k), nil
}

// Scan implements the sql.Scanner interface for KYCStatus
func (k *KYCStatus) Scan(value interface{}) error {
	if value == nil {
		*k = KYCNotNeeded
		return nil
	}
	if sv, ok := value.(string); ok {
		*k = KYCStatus(sv)
		return nil
	}
	if bv, ok := value.([]byte); ok {
		*k = KYCStatus(string(bv))
		return nil
	}
	return nil
}