package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ezhilnn/epr-backend/config"
	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
)

// VerificationService handles business logic for bill verifications
type VerificationService struct {
	verificationRepo *repository.VerificationRepository
	billRepo         *repository.BillRepository
	userRepo         *repository.UserRepository
	cfg              *config.Config
}

// NewVerificationService creates a new verification service
func NewVerificationService(
	verificationRepo *repository.VerificationRepository,
	billRepo *repository.BillRepository,
	userRepo *repository.UserRepository,
	cfg *config.Config,
) *VerificationService {
	return &VerificationService{
		verificationRepo: verificationRepo,
		billRepo:         billRepo,
		userRepo:         userRepo,
		cfg:              cfg,
	}
}

// VerifyBill verifies a bill and charges the user
func (s *VerificationService) VerifyBill(
	ctx context.Context,
	userID *string,
	billNumber, ip, userAgent string,
	userRole models.UserRole,
) (*models.VerifyBillResponse, error) {
	startTime := time.Now()

	// Try to find bill
	bill, err := s.billRepo.GetByBillNumber(ctx, billNumber)

	// Bill not found
	if err != nil {
		response := &models.VerifyBillResponse{
			Success:    true,
			BillNumber: billNumber,
			Status:     "invalid",
			Message:    "This bill is not registered in the EPR system. It may be fake.",
			Fee:        s.cfg.Pricing.VerificationMinFee,
		}

		// Record verification (even for not found)
		if userID != nil {
			s.recordVerification(ctx, userID, nil, billNumber, response.Fee, false, models.VerificationNotFound, nil, ip, userAgent, int(time.Since(startTime).Milliseconds()))
		}

		return response, nil
	}

	// Determine user's access level
	accessLevel := s.determineAccessLevel(userRole, bill)

	// Calculate pricing
	fee, wasFree, _ := s.calculatePrice(ctx, userID, bill.Amount, bill.AccessLevel)

	// Check wallet balance if user is authenticated
	if userID != nil && !wasFree {
		user, err := s.userRepo.GetByID(ctx, *userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user: %w", err)
		}

		if user.WalletBalance < fee {
			return nil, fmt.Errorf("insufficient wallet balance. Required: ₹%.2f, Available: ₹%.2f", fee, user.WalletBalance)
		}

		// Deduct from wallet
		newBalance := user.WalletBalance - fee
		if err := s.userRepo.UpdateWalletBalance(ctx, *userID, newBalance); err != nil {
			return nil, fmt.Errorf("failed to deduct wallet balance: %w", err)
		}

		// Update verification count and check loyalty
		earnedFree, err := s.userRepo.IncrementVerificationCount(ctx, *userID)
		if err != nil {
			// Log but don't fail
			fmt.Printf("Warning: Failed to update verification count: %v\n", err)
		}
		if earnedFree {
			fmt.Printf("User %s earned a free verification!\n", *userID)
		}
	}

	// Build response based on access level
	response := s.buildVerificationResponse(bill, accessLevel, fee)

	// Record verification
	dataRevealed := s.getRevealedFields(accessLevel)
	verificationStatus := models.VerificationValid
	if accessLevel == "none" {
		verificationStatus = models.VerificationRestricted
		response.Status = "restricted"
		response.Message = "This bill requires institutional access to view full details."
	}

	if userID != nil {
		s.recordVerification(ctx, userID, &bill.ID, billNumber, fee, wasFree, verificationStatus, dataRevealed, ip, userAgent, int(time.Since(startTime).Milliseconds()))
	}

	return response, nil
}

// calculatePrice calculates verification price based on bill amount and access level
func (s *VerificationService) calculatePrice(ctx context.Context, userID *string, billAmount float64, accessLevel models.AccessLevel) (float64, bool, string) {
	// Check loyalty (every 10th verification is free)
	if userID != nil {
		user, err := s.userRepo.GetByID(ctx, *userID)
		if err == nil && user.FreeVerificationsEarned > 0 {
			// Use free verification
			// Note: In production, you'd decrement this in a transaction
			return 0, true, "loyalty_free"
		}
	}

	// Calculate based on bill amount (1% of bill)
	percentagePrice := billAmount * s.cfg.Pricing.VerificationPercentage
	percentagePrice = percentagePrice * 0.5

	// Apply min/max constraints
	minFee := s.cfg.Pricing.VerificationMinFee
	maxFee := s.cfg.Pricing.VerificationMaxFee

	finalPrice := percentagePrice
	pricingRule := "percentage_1_percent"

	if percentagePrice < minFee {
		finalPrice = minFee
		pricingRule = "minimum_fee"
	} else if percentagePrice > maxFee {
		finalPrice = maxFee
		pricingRule = "maximum_fee_capped"
	}

	// Adjust based on access level
	switch accessLevel {
	case models.AccessLevelRestricted:
		finalPrice = finalPrice * 1.5 // 50% more for restricted
		pricingRule = "restricted_access_premium"
	case models.AccessLevelGovernment, models.AccessLevelFinancial:
		finalPrice = maxFee // Always max for government/financial
		pricingRule = "government_financial_premium"
	}

	// Ensure within bounds
	if finalPrice < minFee {
		finalPrice = minFee
	}
	if finalPrice > maxFee {
		finalPrice = maxFee
	}

	return finalPrice, false, pricingRule
}

// determineAccessLevel determines what access level the user has
func (s *VerificationService) determineAccessLevel(userRole models.UserRole, bill *models.Bill) string {
	// Public bills - everyone gets full access
	if bill.AccessLevel == models.AccessLevelPublic {
		return "full"
	}

	// Restricted bills - institutions and verifiers get full access
	if bill.AccessLevel == models.AccessLevelRestricted {
		if userRole == models.RoleInstitutionUser ||
			userRole == models.RoleInstitutionAdmin ||
			userRole == models.RoleVerifier ||
			userRole == models.RoleMasterAdmin {
			return "full"
		}
		return "limited" // Public users get limited info
	}

	// Government/Financial - only verifiers get full access
	if bill.AccessLevel == models.AccessLevelGovernment || bill.AccessLevel == models.AccessLevelFinancial {
		if userRole == models.RoleVerifier || userRole == models.RoleMasterAdmin {
			return "full"
		}
		return "none" // Others see restricted message
	}

	return "limited"
}

// buildVerificationResponse builds the response based on access level
func (s *VerificationService) buildVerificationResponse(bill *models.Bill, accessLevel string, fee float64) *models.VerifyBillResponse {
	response := &models.VerifyBillResponse{
		Success:    true,
		BillNumber: bill.BillNumber,
		Status:     "valid",
		IssuerName: bill.IssuerName,
		IssueDate:  bill.IssueDate.Format("2006-01-02"),
		BillType:   string(bill.BillType),
		Message:    "This bill is registered and verified in the EPR system.",
		Fee:        fee,
	}

	// Add details based on access level
	if accessLevel == "full" {
		var billData map[string]interface{}
		if err := json.Unmarshal(bill.BillData, &billData); err == nil {
			response.Details = billData
		}
	} else if accessLevel == "limited" {
		// Limited access - show only basic info
		response.Details = map[string]interface{}{
			"amount":   bill.Amount,
			"currency": bill.Currency,
		}
	} else if accessLevel == "none" {
		// No access - restricted message
		response.Status = "restricted"
		response.Message = "This bill requires institutional verifier access to view full details."
	}

	return response
}

// getRevealedFields returns what fields were shown to user
func (s *VerificationService) getRevealedFields(accessLevel string) map[string]interface{} {
	revealed := make(map[string]interface{})

	switch accessLevel {
	case "full":
		revealed["fields_shown"] = []string{"all"}
		revealed["fields_hidden"] = []string{}
	case "limited":
		revealed["fields_shown"] = []string{"bill_number", "issuer_name", "issue_date", "bill_type", "amount"}
		revealed["fields_hidden"] = []string{"recipient_details", "line_items", "sensitive_data"}
	case "none":
		revealed["fields_shown"] = []string{"bill_number", "issuer_name", "bill_type"}
		revealed["fields_hidden"] = []string{"all_details"}
	}

	return revealed
}

// recordVerification saves verification record
func (s *VerificationService) recordVerification(
	ctx context.Context,
	userID *string,
	billID *string,
	billNumber string,
	fee float64,
	wasFree bool,
	status models.VerificationStatus,
	dataRevealed map[string]interface{},
	ip, userAgent string,
	responseTime int,
) {
	dataRevealedJSON, _ := json.Marshal(dataRevealed)

	accessLevel := models.AccessLevelPublic
	if userID != nil {
		user, _ := s.userRepo.GetByID(ctx, *userID)
		if user != nil {
			if user.Role == models.RoleVerifier {
				accessLevel = models.AccessLevelGovernment
			} else if user.Role == models.RoleInstitutionUser || user.Role == models.RoleInstitutionAdmin {
				accessLevel = models.AccessLevelRestricted
			}
		}
	}

	verification := &models.Verification{
		BillID:             billID,
		BillNumber:         billNumber,
		VerifierID:         userID,
		VerifierIP:         &ip,
		VerifierUserAgent:  &userAgent,
		AccessLevelUsed:    accessLevel,
		DataRevealed:       dataRevealedJSON,
		AmountCharged:      fee,
		WasFree:            wasFree,
		PricingRuleApplied: "standard",
		VerificationStatus: status,
		BlockchainVerified: false,
		ResponseTimeMs:     responseTime,
	}

	s.verificationRepo.Create(ctx, verification)
}

// GetVerificationHistory retrieves user's verification history
func (s *VerificationService) GetVerificationHistory(ctx context.Context, userID string, page, pageSize int) ([]*models.VerificationHistoryResponse, int, error) {
	offset := (page - 1) * pageSize

	verifications, err := s.verificationRepo.ListByVerifier(ctx, userID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list verifications: %w", err)
	}

	total, err := s.verificationRepo.CountByVerifier(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count verifications: %w", err)
	}

	// Convert to response format
	responses := make([]*models.VerificationHistoryResponse, len(verifications))
	for i, v := range verifications {
		// Get bill info if exists
		issuerName := "Unknown"
		billType := "Unknown"
		if v.BillID != nil {
			bill, err := s.billRepo.GetByID(ctx, *v.BillID)
			if err == nil {
				issuerName = bill.IssuerName
				billType = string(bill.BillType)
			}
		}

		responses[i] = &models.VerificationHistoryResponse{
			ID:         v.ID,
			BillNumber: v.BillNumber,
			IssuerName: issuerName,
			BillType:   billType,
			Date:       v.VerifiedAt.Format(time.RFC3339),
			Result:     string(v.VerificationStatus),
			Fee:        v.AmountCharged,
			WasFree:    v.WasFree,
		}
	}

	return responses, total, nil
}

// GetVerificationStats retrieves statistics
func (s *VerificationService) GetVerificationStats(ctx context.Context, userID string) (*models.VerificationStats, error) {
	return s.verificationRepo.GetStatsByVerifier(ctx, userID)
}
