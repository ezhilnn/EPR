package utils

import (
	"encoding/base64"
	"fmt"

	"github.com/skip2/go-qrcode"
)

// GenerateQRCode generates a QR code for a bill verification link
func GenerateQRCode(billNumber, frontendURL string) (string, error) {
	// Create verification URL
	verificationURL := fmt.Sprintf("%s/verify?bill=%s", frontendURL, billNumber)
	
	// Generate QR code (256x256 pixels)
	qrCode, err := qrcode.Encode(verificationURL, qrcode.Medium, 256)
	if err != nil {
		return "", fmt.Errorf("failed to generate QR code: %w", err)
	}
	
	// Convert to base64 data URL
	base64QR := base64.StdEncoding.EncodeToString(qrCode)
	dataURL := fmt.Sprintf("data:image/png;base64,%s", base64QR)
	
	return dataURL, nil
}

// GenerateVerificationLink creates a shareable verification link
func GenerateVerificationLink(billNumber, frontendURL string) string {
	return fmt.Sprintf("%s/verify?bill=%s", frontendURL, billNumber)
}