package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
)

// GenerateBillHash generates a SHA-256 hash of bill data
// This ensures data integrity and creates a unique fingerprint for blockchain
func GenerateBillHash(data map[string]interface{}) (string, error) {
	// Normalize the data by sorting keys (ensures consistent hashing)
	normalized := normalizeJSON(data)
	
	// Convert to JSON
	jsonBytes, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	
	// Calculate SHA-256 hash
	hash := sha256.Sum256(jsonBytes)
	
	// Convert to hex string
	return hex.EncodeToString(hash[:]), nil
}

// normalizeJSON sorts map keys recursively for consistent hashing
func normalizeJSON(data interface{}) interface{} {
	switch v := data.(type) {
	case map[string]interface{}:
		// Create sorted map
		normalized := make(map[string]interface{})
		keys := make([]string, 0, len(v))
		
		// Get all keys
		for k := range v {
			keys = append(keys, k)
		}
		
		// Sort keys
		sort.Strings(keys)
		
		// Add values in sorted order
		for _, k := range keys {
			normalized[k] = normalizeJSON(v[k])
		}
		
		return normalized
		
	case []interface{}:
		// Normalize array elements
		normalized := make([]interface{}, len(v))
		for i, item := range v {
			normalized[i] = normalizeJSON(item)
		}
		return normalized
		
	default:
		// Return primitive values as-is
		return v
	}
}

// VerifyBillHash verifies if bill data matches the stored hash
func VerifyBillHash(data map[string]interface{}, expectedHash string) (bool, error) {
	calculatedHash, err := GenerateBillHash(data)
	if err != nil {
		return false, err
	}
	
	return calculatedHash == expectedHash, nil
}