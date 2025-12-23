package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/ezhilnn/epr-backend/config"
	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"gopkg.in/gomail.v2"
)

// EmailService handles email sending
type EmailService struct {
	cfg        *config.Config
	billRepo   *repository.BillRepository
	userRepo   *repository.UserRepository
	pdfService *PDFService
	dialer     *gomail.Dialer
}

// NewEmailService creates a new email service
func NewEmailService(
	cfg *config.Config,
	billRepo *repository.BillRepository,
	userRepo *repository.UserRepository,
	pdfService *PDFService,
) *EmailService {
	// Create SMTP dialer
	dialer := gomail.NewDialer(
		cfg.Email.SMTPHost,
		cfg.Email.SMTPPort,
		cfg.Email.SMTPUser,
		cfg.Email.SMTPPassword,
	)

	return &EmailService{
		cfg:        cfg,
		billRepo:   billRepo,
		userRepo:   userRepo,
		pdfService: pdfService,
		dialer:     dialer,
	}
}

// SendBillEmail sends a bill via email with PDF attachment
func (s *EmailService) SendBillEmail(ctx context.Context, billNumber, recipientEmail string) error {
	// Fetch bill
	bill, err := s.billRepo.GetByBillNumber(ctx, billNumber)
	if err != nil {
		return fmt.Errorf("bill not found: %w", err)
	}

	// Generate PDF
	pdfBytes, err := s.pdfService.GenerateBillPDF(bill)
	if err != nil {
		return fmt.Errorf("failed to generate PDF: %w", err)
	}

	// Get issuer details
	issuer, err := s.userRepo.GetByID(ctx, bill.IssuerID)
	if err != nil {
		return fmt.Errorf("failed to get issuer: %w", err)
	}

	// Create email message
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.Email.FromEmail)
	m.SetHeader("To", recipientEmail)
	m.SetHeader("Subject", fmt.Sprintf("Bill %s from %s", billNumber, bill.IssuerName))

	// Email body
	body := s.buildBillEmailBody(bill, issuer)
	m.SetBody("text/html", body)

	// Attach PDF
	// m.Attach(fmt.Sprintf("%s.pdf", billNumber), gomail.SetCopyFunc(func(w gomail.WriterTo) error {
	// 	_, err := w.Write(pdfBytes)
	// 	return err
	// }))
	m.Attach(
		fmt.Sprintf("%s.pdf", billNumber),
		gomail.SetCopyFunc(func(w io.Writer) error {
			_, err := w.Write(pdfBytes)
			return err
		}),
	)
	// Send email
	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendWelcomeEmail sends welcome email after signup
func (s *EmailService) SendWelcomeEmail(ctx context.Context, user *models.User) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.Email.FromEmail)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", "Welcome to EPR - Electronic Public Records")

	body := s.buildWelcomeEmailBody(user)
	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	return nil
}

// SendLoginNotification sends login notification email
func (s *EmailService) SendLoginNotification(ctx context.Context, user *models.User, ipAddress string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.Email.FromEmail)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", "New Login to Your EPR Account")

	body := s.buildLoginEmailBody(user, ipAddress)
	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send login notification: %w", err)
	}

	return nil
}

// SendLowBalanceWarning sends low balance warning email
func (s *EmailService) SendLowBalanceWarning(ctx context.Context, user *models.User) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.Email.FromEmail)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", "Low Wallet Balance - EPR")

	body := s.buildLowBalanceEmailBody(user)
	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send low balance warning: %w", err)
	}

	return nil
}

// SendDailyBillSummary sends daily consolidated bill summary to issuer
func (s *EmailService) SendDailyBillSummary(ctx context.Context, userID string) error {
	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Get today's bills
	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	bills, err := s.billRepo.Search(ctx, userID, nil, &startOfDay, &endOfDay, 100, 0)
	if err != nil {
		return fmt.Errorf("failed to fetch bills: %w", err)
	}

	// If no bills generated today, don't send email
	if len(bills) == 0 {
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.Email.FromEmail)
	m.SetHeader("To", user.Email)
	m.SetHeader("Subject", fmt.Sprintf("Daily Bill Summary - %s", today.Format("02 Jan 2006")))

	body := s.buildDailySummaryEmailBody(user, bills, today)
	m.SetBody("text/html", body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send daily summary: %w", err)
	}

	return nil
}

// Email body builders

func (s *EmailService) buildBillEmailBody(bill *models.Bill, issuer *models.User) string {
	verifyURL := fmt.Sprintf("%s/verify/%s", s.cfg.App.FrontendURL, bill.BillNumber)
	_= issuer
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1f4e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .bill-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1f4e78; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background-color: #1f4e78; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bill from %s</h1>
        </div>
        <div class="content">
            <p>Dear Recipient,</p>
            <p>Please find attached your bill from <strong>%s</strong>.</p>
            
            <div class="bill-info">
                <h3>Bill Details</h3>
                <p><strong>Bill Number:</strong> %s</p>
                <p><strong>Bill Type:</strong> %s</p>
                <p><strong>Issue Date:</strong> %s</p>
                <p><strong>Amount:</strong> %s %.2f</p>
            </div>
            
            <p>You can verify the authenticity of this bill using our online verification system:</p>
            <p><a href="%s" class="button">Verify Bill Online</a></p>
            
            <p>The attached PDF contains the complete bill details. This bill is registered in the Electronic Public Records (EPR) system for authenticity verification.</p>
        </div>
        <div class="footer">
            <p>This email was sent by Electronic Public Records (EPR) System</p>
            <p>© 2025 EPR. All rights reserved.</p>
            <p><a href="%s">Visit EPR</a></p>
        </div>
    </div>
</body>
</html>
	`, bill.IssuerName, bill.IssuerName, bill.BillNumber, bill.BillType,
		bill.IssueDate.Format("02 Jan 2006"), bill.Currency, bill.Amount,
		verifyURL, s.cfg.App.FrontendURL)
}

func (s *EmailService) buildWelcomeEmailBody(user *models.User) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1f4e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to EPR!</h1>
        </div>
        <div class="content">
            <p>Dear %s,</p>
            <p>Welcome to <strong>Electronic Public Records (EPR)</strong> - Your trusted platform for bill generation and verification.</p>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Complete your profile and KYC verification (for institutions)</li>
                <li>Add funds to your wallet to start generating bills</li>
                <li>Generate and manage your bills securely</li>
                <li>Verify bills to prevent fraud</li>
            </ul>
            
            <p>Your current wallet balance is: <strong>₹%.2f</strong></p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
            <p>© 2025 EPR. All rights reserved.</p>
            <p><a href="%s">Visit EPR Dashboard</a></p>
        </div>
    </div>
</body>
</html>
	`, user.FullName, user.WalletBalance, s.cfg.App.FrontendURL)
}

func (s *EmailService) buildLoginEmailBody(user *models.User, ipAddress string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1f4e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .alert { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Login Detected</h1>
        </div>
        <div class="content">
            <p>Hello %s,</p>
            <p>We detected a new login to your EPR account:</p>
            
            <div class="alert">
                <p><strong>Time:</strong> %s</p>
                <p><strong>IP Address:</strong> %s</p>
            </div>
            
            <p>If this was you, you can safely ignore this email.</p>
            <p>If you did not log in, please change your password immediately and contact our support team.</p>
        </div>
        <div class="footer">
            <p>© 2025 EPR. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, user.FullName, time.Now().Format("02 Jan 2006 15:04:05 MST"), ipAddress)
}

func (s *EmailService) buildLowBalanceEmailBody(user *models.User) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .warning { background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Low Wallet Balance</h1>
        </div>
        <div class="content">
            <p>Dear %s,</p>
            
            <div class="warning">
                <p><strong>Your wallet balance is running low!</strong></p>
                <p>Current Balance: <strong>₹%.2f</strong></p>
            </div>
            
            <p>To continue generating bills and verifying documents, please recharge your wallet.</p>
            
            <p><a href="%s/dashboard/wallet" class="button">Recharge Wallet</a></p>
            
            <h3>Pricing Reminder:</h3>
            <ul>
                <li>Bill Generation: ₹%.2f per bill</li>
                <li>Bill Verification: ₹%.2f - ₹%.2f per verification</li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2025 EPR. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, user.FullName, user.WalletBalance, s.cfg.App.FrontendURL,
		s.cfg.Pricing.BillGenerationFee, s.cfg.Pricing.VerificationMinFee, s.cfg.Pricing.VerificationMaxFee)
}

func (s *EmailService) buildDailySummaryEmailBody(user *models.User, bills []*models.Bill, date time.Time) string {
	// Build bill list HTML
	billListHTML := ""
	totalAmount := 0.0

	for _, bill := range bills {
		totalAmount += bill.Amount
		billListHTML += fmt.Sprintf(`
			<tr>
				<td style="padding: 8px; border: 1px solid #ddd;">%s</td>
				<td style="padding: 8px; border: 1px solid #ddd;">%s</td>
				<td style="padding: 8px; border: 1px solid #ddd;">%s</td>
				<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹%.2f</td>
			</tr>
		`, bill.BillNumber, bill.BillType, bill.IssueDate.Format("02 Jan 2006"), bill.Amount)
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1f4e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .summary { background-color: #e7f3ff; padding: 15px; margin: 15px 0; border-left: 4px solid #1f4e78; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        table { width: 100%%; border-collapse: collapse; margin: 15px 0; background-color: white; }
        th { background-color: #1f4e78; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Daily Bill Summary</h1>
            <p>%s</p>
        </div>
        <div class="content">
            <p>Dear %s,</p>
            
            <div class="summary">
                <h3>Today's Summary</h3>
                <p><strong>Total Bills Generated:</strong> %d</p>
                <p><strong>Total Amount:</strong> ₹%.2f</p>
            </div>
            
            <h3>Bill Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Bill Number</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    %s
                </tbody>
            </table>
            
            <p>You can view all your bills in the <a href="%s/dashboard">dashboard</a>.</p>
        </div>
        <div class="footer">
            <p>This is an automated daily summary. You can manage your email preferences in settings.</p>
            <p>© 2025 EPR. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, date.Format("Monday, 02 January 2006"), user.FullName, len(bills), totalAmount,
		billListHTML, s.cfg.App.FrontendURL)
}
