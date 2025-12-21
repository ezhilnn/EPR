package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/ezhilnn/epr-backend/internal/services"
	"github.com/ezhilnn/epr-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// DashboardHandler handles dashboard-related requests
type DashboardHandler struct {
	billService         *services.BillService
	verificationService *services.VerificationService
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(
	billService *services.BillService,
	verificationService *services.VerificationService,
) *DashboardHandler {
	return &DashboardHandler{
		billService:         billService,
		verificationService: verificationService,
	}
}

// GetPublicDashboard returns dashboard data for public users
// GET /api/v1/dashboard
func (h *DashboardHandler) GetPublicDashboard(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get verification stats
	verificationStats, err := h.verificationService.GetVerificationStats(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve dashboard data")
		return
	}

	// Get recent verifications (last 5)
	recentVerifications, _, err := h.verificationService.GetVerificationHistory(ctx, userID.(string), 1, 5)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve recent verifications")
		return
	}

	// Build response matching frontend structure
	response := gin.H{
		"stats": gin.H{
			"total_verifications": verificationStats.TotalVerifications,
			"amount_spent":        verificationStats.TotalSpent,
			"success_rate":        verificationStats.SuccessRate,
			"valid_count":         verificationStats.ValidCount,
			"invalid_count":       verificationStats.InvalidCount,
		},
		"recent_verifications": recentVerifications,
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}

// GetInstitutionDashboard returns dashboard data for institutions
// GET /api/v1/dashboard/institution
func (h *DashboardHandler) GetInstitutionDashboard(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get bill stats (PRIMARY FOCUS)
	billStats, err := h.billService.GetUserStats(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve dashboard data")
		return
	}

	// Get recent bills (last 5)
	recentBills, _, err := h.billService.ListUserBills(ctx, userID.(string), 1, 5)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve recent bills")
		return
	}

	// Convert bills to list response format
	recentBillsResponse := make([]interface{}, len(recentBills))
	for i, bill := range recentBills {
		recentBillsResponse[i] = h.billService.ConvertToListResponse(bill)
	}

	// Calculate additional metrics
	averageBillAmount := 0.0
	if billStats.TotalBills > 0 {
		averageBillAmount = billStats.TotalAmount / float64(billStats.TotalBills)
	}

	// Most generated bill type (simplified - returns first bill type found)
	mostGeneratedType := "N/A"
	if len(recentBills) > 0 {
		mostGeneratedType = string(recentBills[0].BillType)
	}

	// Calculate generation fee paid (₹0.50 per bill)
	generationFeePaid := float64(billStats.TotalBills) * 0.50

	// Build response matching frontend structure
	response := gin.H{
		"stats": gin.H{
			"total_bills":         billStats.TotalBills,
			"this_month_bills":    billStats.ThisMonthBills,
			"active_bills":        billStats.ActiveBills,
			"total_amount":        billStats.TotalAmount,
			"average_bill_amount": averageBillAmount,
			"most_generated_type": mostGeneratedType,
			"generation_fee_paid": generationFeePaid,
			// Verification count is secondary (how many times their bills were verified)
			"total_verifications": billStats.TotalVerifications,
		},
		"recent_bills": recentBillsResponse,
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}

// GetVerifierDashboard returns dashboard data for verifiers
// GET /api/v1/dashboard/verifier
func (h *DashboardHandler) GetVerifierDashboard(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get verification stats
	verificationStats, err := h.verificationService.GetVerificationStats(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve dashboard data")
		return
	}

	// Get recent verifications (last 10)
	recentVerifications, _, err := h.verificationService.GetVerificationHistory(ctx, userID.(string), 1, 10)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve recent verifications")
		return
	}

	// Build response matching frontend structure
	response := gin.H{
		"stats": gin.H{
			"total_verifications": verificationStats.TotalVerifications,
			"amount_spent":        verificationStats.TotalSpent,
			"valid_count":         verificationStats.ValidCount,
			"invalid_count":       verificationStats.InvalidCount,
			"restricted_count":    verificationStats.RestrictedCount,
			"success_rate":        verificationStats.SuccessRate,
		},
		"recent_verifications": recentVerifications,
	}

	utils.SuccessResponse(c, http.StatusOK, response)
}
