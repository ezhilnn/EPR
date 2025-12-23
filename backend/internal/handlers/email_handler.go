package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/ezhilnn/epr-backend/internal/services"
	"github.com/ezhilnn/epr-backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// EmailHandler handles email-related requests
type EmailHandler struct {
	emailService *services.EmailService
}

// NewEmailHandler creates a new email handler
func NewEmailHandler(emailService *services.EmailService) *EmailHandler {
	return &EmailHandler{
		emailService: emailService,
	}
}

// SendBillEmail sends a bill via email
// POST /api/v1/bills/:bill_number/email
func (h *EmailHandler) SendBillEmail(c *gin.Context) {
	billNumber := c.Param("bill_number")
	
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, "Valid email address is required")
		return
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	// Send email with bill attachment
	if err := h.emailService.SendBillEmail(ctx, billNumber, req.Email); err != nil {
		if err.Error() == "bill not found: bill not found" {
			utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
			return
		}
		
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to send email. Please try again.")
		return
	}
	
	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"message": "Bill sent successfully to " + req.Email,
	})
}