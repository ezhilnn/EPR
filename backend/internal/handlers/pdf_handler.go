package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"github.com/ezhilnn/epr-backend/internal/services"
	"github.com/ezhilnn/epr-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// PDFHandler handles PDF generation requests
type PDFHandler struct {
	billRepo    *repository.BillRepository
	pdfService  *services.PDFService
}

// NewPDFHandler creates a new PDF handler
func NewPDFHandler(billRepo *repository.BillRepository, pdfService *services.PDFService) *PDFHandler {
	return &PDFHandler{
		billRepo:   billRepo,
		pdfService: pdfService,
	}
}

// DownloadBillPDF generates and downloads PDF for a bill
// GET /api/v1/bills/:bill_number/pdf
func (h *PDFHandler) DownloadBillPDF(c *gin.Context) {
	billNumber := c.Param("bill_number")
	
	// Get user info from auth middleware (if authenticated)
	userID, userExists := c.Get("user_id")
	role, _ := c.Get("role")
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	// Fetch bill from database
	bill, err := h.billRepo.GetByBillNumber(ctx, billNumber)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
		return
	}
	
	// Check access permissions
	canAccess := h.canAccessBillPDF(userID, role, bill, userExists)
	if !canAccess {
		utils.ErrorResponse(c, http.StatusForbidden, "You don't have permission to download this bill")
		return
	}
	
	// Generate PDF
	pdfBytes, err := h.pdfService.GenerateBillPDF(bill)
	if err != nil {
		fmt.Printf("Error generating PDF: %v\n", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate PDF")
		return
	}
	
	// Set headers for PDF download
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s.pdf", billNumber))
	c.Header("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))
	
	// Write PDF bytes to response
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}

// canAccessBillPDF checks if user can access the bill PDF
func (h *PDFHandler) canAccessBillPDF(userID interface{}, role interface{}, bill *models.Bill, userExists bool) bool {
	// If bill is public, anyone can download (no auth required)
	if bill.AccessLevel == models.AccessLevelPublic {
		return true
	}
	
	// For non-public bills, authentication is required
	if !userExists {
		return false
	}
	
	userIDStr := userID.(string)
	userRole := models.UserRole(role.(string))
	
	// Bill owner (issuer) always has access
	if bill.IssuerID == userIDStr {
		return true
	}
	
	// Master admin has access to everything
	if userRole == models.RoleMasterAdmin {
		return true
	}
	
	// For restricted bills - institutions and verifiers can access
	if bill.AccessLevel == models.AccessLevelRestricted {
		if userRole == models.RoleInstitutionUser ||
			userRole == models.RoleInstitutionAdmin ||
			userRole == models.RoleVerifier {
			return true
		}
	}
	
	// For government/financial level - only verifiers can access
	if bill.AccessLevel == models.AccessLevelGovernment || 
	   bill.AccessLevel == models.AccessLevelFinancial {
		if userRole == models.RoleVerifier {
			return true
		}
	}
	
	return false
}