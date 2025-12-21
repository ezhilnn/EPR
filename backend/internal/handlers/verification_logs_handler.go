package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"github.com/ezhilnn/epr-backend/internal/utils"
)

// GetBillVerificationLogs retrieves verification logs for a specific bill
// GET /api/v1/bills/:id/verifications
func GetBillVerificationLogs(
	c *gin.Context,
	billRepo *repository.BillRepository,
	verificationRepo *repository.VerificationRepository,
	userRepo *repository.UserRepository,
) {
	userID, _ := c.Get("user_id")
	billID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get bill and check ownership
	bill, err := billRepo.GetByID(ctx, billID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bill not found")
		return
	}

	// Check if user owns the bill
	if bill.IssuerID != userID.(string) {
		utils.ErrorResponse(c, http.StatusForbidden, "Access denied")
		return
	}

	// Get all verifications for this bill (simplified query)
	query := `
		SELECT v.*, u.organization_name as verifier_name 
		FROM verifications v 
		LEFT JOIN users u ON v.verifier_id = u.id 
		WHERE v.bill_id = $1 
		ORDER BY v.verified_at DESC 
		LIMIT 50
	`
	_= query

	type VerificationLog struct {
		ID           string    `db:"id"`
		VerifierName *string   `db:"verifier_name"`
		VerifierIP   *string   `db:"verifier_ip"`
		VerifiedAt   time.Time `db:"verified_at"`
		Result       string    `db:"verification_status"`
		AccessLevel  string    `db:"access_level_used"`
	}

	var logs []VerificationLog
	// Note: This is simplified - in production use proper repository method
	// For now, return empty array
	logs = []VerificationLog{}

	// Format response to match frontend
	response := make([]map[string]interface{}, 0)
	for _, log := range logs {
		verifierName := "Public User"
		verifierType := "public"
		
		if log.VerifierName != nil {
			verifierName = *log.VerifierName
			if log.AccessLevel == "government" || log.AccessLevel == "financial" {
				verifierType = "government"
			} else {
				verifierType = "institutional"
			}
		}

		response = append(response, map[string]interface{}{
			"id":           log.ID,
			"verified_by":  verifierName,
			"verified_at":  log.VerifiedAt.Format(time.RFC3339),
			"result":       log.Result,
			"verifier_type": verifierType,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"verification_logs": response,
		"total": len(response),
	})
}