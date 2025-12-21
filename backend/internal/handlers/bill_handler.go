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

// BillHandler handles bill-related requests
type BillHandler struct {
	billService *services.BillService
}

// NewBillHandler creates a new bill handler
func NewBillHandler(billService *services.BillService) *BillHandler {
	return &BillHandler{
		billService: billService,
	}
}

// CreateBill handles bill generation
// POST /api/v1/bills
func (h *BillHandler) CreateBill(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req models.CreateBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create bill
	bill, err := h.billService.CreateBill(ctx, userID.(string), &req)
	if err != nil {
		// Check for specific errors
		if err.Error() == "only institutions can generate bills" {
			utils.ErrorResponse(c, http.StatusForbidden, err.Error())
			return
		}
		if err.Error() == "KYC verification required to generate bills" {
			utils.ErrorResponse(c, http.StatusForbidden, "Your KYC verification is pending. Please complete KYC to generate bills.")
			return
		}
		if err.Error()[:20] == "insufficient wallet" {
			utils.ErrorResponse(c, http.StatusPaymentRequired, err.Error())
			return
		}

		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate bill")
		return
	}

	// Convert to response
	response := h.billService.ConvertToResponse(bill, "full")

	utils.SuccessResponse(c, http.StatusCreated, gin.H{
		"message": "Bill generated successfully",
		"bill":    response,
	})
}

// GetBill retrieves a single bill
// GET /api/v1/bills/:id
func (h *BillHandler) GetBill(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	billID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get bill
	bill, err := h.billService.GetBillByID(ctx, userID.(string), billID, models.UserRole(role.(string)))
	if err != nil {
		if err.Error() == "bill not found" {
			utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
			return
		}
		if err.Error() == "access denied to this bill" {
			utils.ErrorResponse(c, http.StatusForbidden, "You don't have permission to view this bill")
			return
		}

		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve bill")
		return
	}

	// Determine access level for response
	accessLevel := "full"
	if bill.IssuerID != userID.(string) && role.(string) != string(models.RoleMasterAdmin) {
		accessLevel = "limited"
	}

	response := h.billService.ConvertToResponse(bill, accessLevel)
	utils.SuccessResponse(c, http.StatusOK, response)
}

// ListBills lists bills for the current user
// GET /api/v1/bills
func (h *BillHandler) ListBills(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Get pagination parameters
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

	// Get bills
	bills, total, err := h.billService.ListUserBills(ctx, userID.(string), page, pageSize)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve bills")
		return
	}

	// Convert to list response
	billResponses := make([]*models.BillListResponse, len(bills))
	for i, bill := range bills {
		billResponses[i] = h.billService.ConvertToListResponse(bill)
	}

	// Calculate pagination metadata
	totalPages := (total + pageSize - 1) / pageSize

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"bills": billResponses,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// GetBillStats retrieves statistics for user's bills
// GET /api/v1/bills/stats
func (h *BillHandler) GetBillStats(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stats, err := h.billService.GetUserStats(ctx, userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve statistics")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, stats)
}

// DeleteBill soft deletes a bill
// DELETE /api/v1/bills/:id
func (h *BillHandler) DeleteBill(c *gin.Context) {
	userID, _ := c.Get("user_id")
	billID := c.Param("id")

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Deletion reason is required")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := h.billService.DeleteBill(ctx, userID.(string), billID, req.Reason); err != nil {
		if err.Error() == "bill not found" {
			utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
			return
		}
		if err.Error() == "you can only delete your own bills" {
			utils.ErrorResponse(c, http.StatusForbidden, "You don't have permission to delete this bill")
			return
		}

		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete bill")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Bill deleted successfully",
	})
}

// SearchBills searches bills with filters
// GET /api/v1/bills/search
func (h *BillHandler) SearchBills(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Get query parameters
	billTypeStr := c.Query("bill_type")
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

	// Parse bill type
	var billType *models.BillType
	if billTypeStr != "" {
		bt := models.BillType(billTypeStr)
		billType = &bt
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Search bills
	bills, err := h.billService.SearchBills(ctx, userID.(string), billType, startDate, endDate, page, pageSize)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search bills")
		return
	}

	// Convert to list response
	billResponses := make([]*models.BillListResponse, len(bills))
	for i, bill := range bills {
		billResponses[i] = h.billService.ConvertToListResponse(bill)
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"bills": billResponses,
		"filters": gin.H{
			"bill_type":  billTypeStr,
			"start_date": startDateStr,
			"end_date":   endDateStr,
		},
	})
}

// VerifyBill checks if a bill exists (public endpoint for verification)
// GET /api/v1/bills/verify/:bill_number
func (h *BillHandler) VerifyBill(c *gin.Context) {
	billNumber := c.Param("bill_number")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get bill
	bill, err := h.billService.GetBillByNumber(ctx, billNumber)
	if err != nil {
		if err.Error() == "bill not found" {
			utils.SuccessResponse(c, http.StatusOK, gin.H{
				"exists": false,
				"status": "not_found",
			})
			return
		}

		utils.ErrorResponse(c, http.StatusInternalServerError, "Verification failed")
		return
	}

	// Return limited public information
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"exists":            true,
		"status":            "valid",
		"bill_number":       bill.BillNumber,
		"bill_type":         string(bill.BillType),
		"issuer_name":       bill.IssuerName,
		"issue_date":        bill.IssueDate.Format("2006-01-02"),
		"blockchain_status": string(bill.BlockchainStatus),
		"access_level":      string(bill.AccessLevel),
	})
}

// GetBillByNumber retrieves a bill using bill number
// GET /api/v1/bills/number/:bill_number
func (h *BillHandler) GetBillByNumber(c *gin.Context) {
	billNumber := c.Param("bill_number")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	bill, err := h.billService.GetBillByNumber(ctx, billNumber)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
		return
	}

	response := h.billService.ConvertToResponse(bill, "full")
	utils.SuccessResponse(c, http.StatusOK, response)
}

// DownloadBillQR returns QR code for a bill
// GET /api/v1/bills/:id/qrcode
func (h *BillHandler) DownloadBillQR(c *gin.Context) {
	billID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	bill, err := h.billService.GetBillByID(ctx, "", billID, models.RoleMasterAdmin)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
		return
	}

	qrCode, err := h.billService.GenerateQRCode(bill.BillNumber)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate QR")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"bill_number": bill.BillNumber,
		"qr_code":     qrCode,
	})
}
