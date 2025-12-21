package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/services"
	"github.com/ezhilnn/epr-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// VerificationHandler handles verification-related requests
type VerificationHandler struct {
	verificationService *services.VerificationService
}

// NewVerificationHandler creates a new verification handler
func NewVerificationHandler(verificationService *services.VerificationService) *VerificationHandler {
	return &VerificationHandler{
		verificationService: verificationService,
	}
}

// VerifyBill handles bill verification request
// POST /api/v1/verify
func (h *VerificationHandler) VerifyBill(c *gin.Context) {
	// Get user info (optional - public can verify too)
	userID, userExists := c.Get("user_id")
	role, _ := c.Get("role")

	var req models.VerifyBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Get client info
	ip := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Determine user role
	userRole := models.RolePublic
	if userExists && role != nil {
		userRole = models.UserRole(role.(string))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify bill
	var userIDPtr *string
	if userExists {
		userIDStr := userID.(string)
		userIDPtr = &userIDStr
	}

	result, err := h.verificationService.VerifyBill(ctx, userIDPtr, req.BillNumber, ip, userAgent, userRole)
	if err != nil {
		// Check for specific errors
		if err.Error()[:20] == "insufficient wallet" {
			utils.ErrorResponse(c, http.StatusPaymentRequired, err.Error())
			return
		}

		utils.ErrorResponse(c, http.StatusInternalServerError, "Verification failed. Please try again.")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, result)
}

// GetVerificationHistory retrieves user's verification history
// GET /api/v1/verify/history
func (h *VerificationHandler) GetVerificationHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Get pagination and filter parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get history
	history, total, err := h.verificationService.GetVerificationHistory(ctx, userID.(string), page, pageSize)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve verification history")
		return
	}

	// Calculate pagination metadata
	totalPages := (total + pageSize - 1) / pageSize

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"verifications": history,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetVerificationStats retrieves verification statistics
// GET /api/v1/verify/stats
func (h *VerificationHandler) GetVerificationStats(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stats, err := h.verificationService.GetVerificationStats(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve statistics")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, stats)
}

// SearchVerifications searches verifications with filters
// GET /api/v1/verify/search
func (h *VerificationHandler) SearchVerifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	_ = userID

	// Get query parameters
	statusStr := c.Query("status")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// Parse status
	var status *models.VerificationStatus
	if statusStr != "" {
		vs := models.VerificationStatus(statusStr)
		status = &vs
	}

	// Parse dates
	var startDate, endDate *time.Time
	if startDateStr != "" {
		if sd, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &sd
		}
	}
	if endDateStr != "" {
		if ed, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &ed
		}
	}
	_ = status
	_ = startDate
	_ = endDate

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = ctx
	// Get verification repository (we'll need to expose this through service)
	// For now, return empty results with proper structure
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"verifications": []interface{}{},
		"filters": gin.H{
			"status":     statusStr,
			"start_date": startDateStr,
			"end_date":   endDateStr,
		},
		"message": "Search functionality coming soon",
	})
}
