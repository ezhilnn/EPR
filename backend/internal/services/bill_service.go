package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ezhilnn/epr-backend/config"
	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"github.com/ezhilnn/epr-backend/internal/utils"
)

// BillService handles business logic for bills
type BillService struct {
	billRepo *repository.BillRepository
	userRepo *repository.UserRepository
	cfg      *config.Config
}

// NewBillService creates a new bill service
func NewBillService(
	billRepo *repository.BillRepository,
	userRepo *repository.UserRepository,
	cfg *config.Config,
) *BillService {
	return &BillService{
		billRepo: billRepo,
		userRepo: userRepo,
		cfg:      cfg,
	}
}

// CreateBill generates a new bill
func (s *BillService) CreateBill(ctx context.Context, userID string, req *models.CreateBillRequest) (*models.Bill, error) {
	// Get user details
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user has permission to generate bills
	if user.Role != models.RoleInstitutionUser && user.Role != models.RoleInstitutionAdmin && user.Role != models.RoleMasterAdmin {
		return nil, fmt.Errorf("only institutions can generate bills")
	}

	// Check KYC status for institutions
	if (user.Role == models.RoleInstitutionUser || user.Role == models.RoleInstitutionAdmin) && user.KYCStatus != models.KYCApproved {
		return nil, fmt.Errorf("KYC verification required to generate bills")
	}

	// Check wallet balance
	generationFee := s.cfg.Pricing.BillGenerationFee
	if user.WalletBalance < generationFee {
		return nil, fmt.Errorf("insufficient wallet balance. Required: ₹%.2f, Available: ₹%.2f", generationFee, user.WalletBalance)
	}

	// Generate bill number
	billNumber, err := s.billRepo.GenerateBillNumber(ctx, req.BillType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate bill number: %w", err)
	}

	// Parse issue date
	issueDate, err := time.Parse("2006-01-02", req.IssueDate)
	if err != nil {
		return nil, fmt.Errorf("invalid date format. Use YYYY-MM-DD")
	}

	// Add metadata to bill data
	enrichedBillData := req.BillData
	enrichedBillData["_metadata"] = map[string]interface{}{
		"generated_at":  time.Now().UTC(),
		"generated_by":  user.ID,
		"organization":  user.OrganizationName,
		"gstin":         req.IssuerGSTIN,
	}

	// Convert bill data to JSON
	billDataJSON, err := json.Marshal(enrichedBillData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal bill data: %w", err)
	}

	// Generate SHA-256 hash
	dataHash, err := utils.GenerateBillHash(enrichedBillData)
	if err != nil {
		return nil, fmt.Errorf("failed to generate hash: %w", err)
	}

	// Create bill object
	bill := &models.Bill{
		BillNumber:       billNumber,
		BillType:         req.BillType,
		AccessLevel:      req.AccessLevel,
		IssuerID:         user.ID,
		IssuerName:       user.OrganizationName,
		BillData:         billDataJSON,
		Amount:           req.Amount,
		Currency:         "INR",
		IssueDate:        issueDate,
		DataHash:         dataHash,
		BlockchainStatus: models.BlockchainPending,
		IsActive:         true,
		IsDeleted:        false,
	}

	// Start transaction
	// Note: In production, you'd use proper transaction handling
	// For now, we'll do operations sequentially

	// Save bill to database
	if err := s.billRepo.Create(ctx, bill); err != nil {
		return nil, fmt.Errorf("failed to save bill: %w", err)
	}

	// Deduct wallet balance
	newBalance := user.WalletBalance - generationFee
	if err := s.userRepo.UpdateWalletBalance(ctx, user.ID, newBalance); err != nil {
		// In production, you'd rollback the bill creation here
		return nil, fmt.Errorf("failed to deduct wallet balance: %w", err)
	}

	// TODO: Queue blockchain commitment (will implement with RabbitMQ later)
	// For now, we'll mark it as pending

	return bill, nil
}

// GetBillByID retrieves a bill by ID
func (s *BillService) GetBillByID(ctx context.Context, userID, billID string, userRole models.UserRole) (*models.Bill, error) {
	bill, err := s.billRepo.GetByID(ctx, billID)
	if err != nil {
		return nil, err
	}

	// Check access permissions
	canAccess := s.canAccessBill(userID, userRole, bill)
	if !canAccess {
		return nil, fmt.Errorf("access denied to this bill")
	}

	return bill, nil
}

// GetBillByNumber retrieves a bill by bill number
func (s *BillService) GetBillByNumber(ctx context.Context, billNumber string) (*models.Bill, error) {
	return s.billRepo.GetByBillNumber(ctx, billNumber)
}

// ListUserBills lists bills for a user with pagination
func (s *BillService) ListUserBills(ctx context.Context, userID string, page, pageSize int) ([]*models.Bill, int, error) {
	offset := (page - 1) * pageSize
	
	bills, err := s.billRepo.ListByIssuer(ctx, userID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list bills: %w", err)
	}

	total, err := s.billRepo.CountByIssuer(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count bills: %w", err)
	}

	return bills, total, nil
}

// GetUserStats retrieves statistics for a user's bills
func (s *BillService) GetUserStats(ctx context.Context, userID string) (*models.BillStats, error) {
	return s.billRepo.GetStatsByIssuer(ctx, userID)
}

// DeleteBill soft deletes a bill
func (s *BillService) DeleteBill(ctx context.Context, userID, billID, reason string) error {
	// Get bill
	bill, err := s.billRepo.GetByID(ctx, billID)
	if err != nil {
		return err
	}

	// Check if user owns the bill
	if bill.IssuerID != userID {
		return fmt.Errorf("you can only delete your own bills")
	}

	// Check if bill has been verified
	// TODO: Check verifications count when verification system is implemented
	// For now, we'll allow deletion

	return s.billRepo.SoftDelete(ctx, billID, reason)
}

// SearchBills searches bills with filters
func (s *BillService) SearchBills(
	ctx context.Context,
	userID string,
	billType *models.BillType,
	startDate, endDate *time.Time,
	page, pageSize int,
) ([]*models.Bill, error) {
	offset := (page - 1) * pageSize
	return s.billRepo.Search(ctx, userID, billType, startDate, endDate, pageSize, offset)
}

// canAccessBill checks if a user can access a bill
func (s *BillService) canAccessBill(userID string, userRole models.UserRole, bill *models.Bill) bool {
	// Bill owner always has access
	if bill.IssuerID == userID {
		return true
	}

	// Master admin has access to everything
	if userRole == models.RoleMasterAdmin {
		return true
	}

	// For other users, check access level
	// Public bills can be accessed by anyone (for verification)
	if bill.AccessLevel == models.AccessLevelPublic {
		return true
	}

	// Restricted bills can be accessed by institutions and verifiers
	if bill.AccessLevel == models.AccessLevelRestricted {
		if userRole == models.RoleInstitutionUser || 
		   userRole == models.RoleInstitutionAdmin || 
		   userRole == models.RoleVerifier {
			return true
		}
	}

	// Government level requires verifier role
	if bill.AccessLevel == models.AccessLevelGovernment {
		if userRole == models.RoleVerifier {
			return true
		}
	}

	// Financial level also requires verifier role
	if bill.AccessLevel == models.AccessLevelFinancial {
		if userRole == models.RoleVerifier {
			return true
		}
	}

	return false
}

// ConvertToResponse converts a Bill to BillResponse (with data filtering based on access level)
func (s *BillService) ConvertToResponse(bill *models.Bill, accessLevel string) *models.BillResponse {
	response := &models.BillResponse{
		ID:               bill.ID,
		BillNumber:       bill.BillNumber,
		BillType:         string(bill.BillType),
		AccessLevel:      string(bill.AccessLevel),
		IssuerName:       bill.IssuerName,
		Amount:           bill.Amount,
		Currency:         bill.Currency,
		IssueDate:        bill.IssueDate.Format("2006-01-02"),
		DataHash:         bill.DataHash,
		BlockchainStatus: string(bill.BlockchainStatus),
		CreatedAt:        bill.CreatedAt.Format(time.RFC3339),
	}

	// Include bill data only if user has appropriate access
	if accessLevel == "full" {
		var billData map[string]interface{}
		if err := json.Unmarshal(bill.BillData, &billData); err == nil {
			response.BillData = billData
		}
	}

	return response
}
func (s *BillService) ConvertToListResponse(bill *models.Bill) *models.BillListResponse {
	status := "pending"
	if bill.BlockchainStatus == models.BlockchainConfirmed {
		status = "verified"
	} else if bill.IsActive {
		status = "active"
	}

	return &models.BillListResponse{
		ID:                bill.ID,
		BillNumber:        bill.BillNumber,
		BillType:          string(bill.BillType),
		IssuerName:        bill.IssuerName,
		Amount:            bill.Amount,
		IssueDate:         bill.IssueDate.Format("2006-01-02"),
		VerificationCount: 0, // TODO: Get from verifications table
		Status:            status,
		CreatedAt:         bill.CreatedAt.Format(time.RFC3339),
	}
}

// ConvertToDetailedResponse converts a Bill to detailed response (for bill details page)
func (s *BillService) ConvertToDetailedResponse(bill *models.Bill, accessLevel string) map[string]interface{} {
	response := map[string]interface{}{
		"bill_number":  bill.BillNumber,
		"bill_type":    string(bill.BillType),
		"issuer_name":  bill.IssuerName,
		"amount":       bill.Amount,
		"currency":     bill.Currency,
		"issue_date":   bill.IssueDate.Format("2006-01-02"),
		"access_level": string(bill.AccessLevel),
		"status":       s.getBillStatus(bill),
		"blockchain_hash": bill.DataHash, // Using data hash as blockchain ID
		"blockchain_status": string(bill.BlockchainStatus),
		"created_at":   bill.CreatedAt.Format(time.RFC3339),
	}

	// Add bill data if user has full access
	if accessLevel == "full" {
		var billData map[string]interface{}
		if err := json.Unmarshal(bill.BillData, &billData); err == nil {
			// Extract specific fields for frontend
			response["recipient_name"] = billData["recipient_name"]
			response["recipient_email"] = billData["recipient_email"]
			response["description"] = billData["description"]
			response["issuer_gstin"] = billData["_metadata"].(map[string]interface{})["gstin"]
			
			// Full bill data
			response["bill_data"] = billData
		}
	}

	// Generate QR code
	qrCode, err := utils.GenerateQRCode(bill.BillNumber, s.cfg.App.FrontendURL)
	if err == nil {
		response["qr_code"] = qrCode
	}

	// Generate verification link
	response["verification_link"] = utils.GenerateVerificationLink(bill.BillNumber, s.cfg.App.FrontendURL)

	return response
}

// GenerateQRCode generates QR code for a bill
func (s *BillService) GenerateQRCode(billNumber string) (string, error) {
	return utils.GenerateQRCode(billNumber, s.cfg.App.FrontendURL)
}

// getBillStatus determines bill status
func (s *BillService) getBillStatus(bill *models.Bill) string {
	if bill.BlockchainStatus == models.BlockchainConfirmed {
		return "verified"
	}
	if bill.IsActive && bill.BlockchainStatus == models.BlockchainPending {
		return "active"
	}
	return "pending"
}