package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/ezhilnn/epr-backend/config"
	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"github.com/ezhilnn/epr-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication related requests
type AuthHandler struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(userRepo *repository.UserRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

// Signup handles user registration
// POST /api/v1/auth/signup
func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.CreateUserRequest

	// Bind JSON request to struct
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if email already exists
	exists, err := h.userRepo.EmailExists(ctx, req.Email)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to check email availability")
		return
	}

	if exists {
		utils.ErrorResponse(c, http.StatusConflict, "Email already registered")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process password")
		return
	}

	// Determine KYC status based on role
	kycStatus := models.KYCNotNeeded
	if req.Role == models.RoleInstitutionUser || req.Role == models.RoleInstitutionAdmin {
		kycStatus = models.KYCPending
	}

	// Create user object
	user := &models.User{
		Email:            req.Email,
		PasswordHash:     hashedPassword,
		Role:             req.Role,
		OrganizationName: req.OrganizationName,
		KYCStatus:        kycStatus,
		WalletBalance:    0.0,
		IsActive:         true,
		IsEmailVerified:  false,
	}

	// Set optional fields
	if req.OrganizationType != "" {
		user.OrganizationType = &req.OrganizationType
	}
	if req.GSTIN != "" {
		user.GSTIN = &req.GSTIN
	}
	if req.PAN != "" {
		user.PAN = &req.PAN
	}

	// Save to database
	if err := h.userRepo.Create(ctx, user); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// Return success response (don't auto-login, require email verification)
	utils.SuccessResponse(c, http.StatusCreated, gin.H{
		"message": "Account created successfully. Please login to continue.",
		"user":    user.PublicUser(),
	})
}

// Login handles user authentication
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user by email
	user, err := h.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Check if account is active
	if !user.IsActive {
		utils.ErrorResponse(c, http.StatusForbidden, "Account is deactivated. Please contact support.")
		return
	}

	// Verify password
	if !utils.CheckPassword(user.PasswordHash, req.Password) {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate access token
	accessToken, err := utils.GenerateAccessToken(
		user.ID,
		user.Email,
		string(user.Role),
		h.cfg.JWT.Secret,
		h.cfg.JWT.AccessTokenExpiry,
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken(
		user.ID,
		h.cfg.JWT.Secret,
		h.cfg.JWT.RefreshTokenExpiry,
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	// Update last login timestamp
	if err := h.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		// Log error but don't fail the login
		c.Error(err)
	}

	// Return tokens and user info
	response := models.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user.PublicUser(),
		ExpiresIn:    int64(h.cfg.JWT.AccessTokenExpiry.Seconds()),
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}

// RefreshToken generates a new access token using refresh token
// POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Validate refresh token
	userID, err := utils.ValidateRefreshToken(req.RefreshToken, h.cfg.JWT.Secret)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user from database
	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
		return
	}

	// Check if account is still active
	if !user.IsActive {
		utils.ErrorResponse(c, http.StatusForbidden, "Account is deactivated")
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateAccessToken(
		user.ID,
		user.Email,
		string(user.Role),
		h.cfg.JWT.Secret,
		h.cfg.JWT.AccessTokenExpiry,
	)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	// Return new access token
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"access_token": accessToken,
		"expires_in":   int64(h.cfg.JWT.AccessTokenExpiry.Seconds()),
	})
}

// GetMe returns current user information
// GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get user from database
	user, err := h.userRepo.GetByID(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	// Return user information
	utils.SuccessResponse(c, http.StatusOK, user.PublicUser())
}

// TopupWallet adds balance to user's wallet (FOR TESTING ONLY)
// In production, this would integrate with payment gateway
// POST /api/v1/auth/wallet/topup
func (h *AuthHandler) TopupWallet(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get current user
	user, err := h.userRepo.GetByID(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	// Update wallet balance
	newBalance := user.WalletBalance + req.Amount
	if err := h.userRepo.UpdateWalletBalance(ctx, user.ID, newBalance); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update wallet")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message":     "Wallet topped up successfully",
		"new_balance": newBalance,
	})
}
