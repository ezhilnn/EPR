package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
	"github.com/joho/godotenv"
)

// Config holds all application configuration
// Think of this as a "settings object" that contains all your app's settings
type Config struct {
	// Server settings
	Server ServerConfig
	
	// Database settings
	Database DatabaseConfig
	
	// Redis settings
	Redis RedisConfig
	
	// JWT settings
	JWT JWTConfig
	
	// Pricing settings
	Pricing PricingConfig
	
	// Application settings
	App AppConfig
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port        string // Port to run on (e.g., "8080")
	Host        string // Host address (e.g., "localhost")
	Environment string // "development", "staging", "production"
}

// DatabaseConfig holds PostgreSQL configuration
type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	DBName          string
	SSLMode         string // "disable", "require", "verify-full"
	MaxConnections  int    // Maximum number of open connections
	MaxIdleConns    int    // Maximum number of idle connections
	ConnMaxLifetime time.Duration
}

// RedisConfig holds Redis cache configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int // Redis database number (0-15)
}

// JWTConfig holds JWT token configuration
type JWTConfig struct {
	Secret              string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration
}

// PricingConfig holds billing and pricing rules
type PricingConfig struct {
	BillGenerationFee           float64 // Fee to generate a bill (e.g., 0.50)
	VerificationMinFee          float64 // Minimum verification fee (e.g., 1.00)
	VerificationMaxFee          float64 // Maximum verification fee (e.g., 10.00)
	VerificationPercentage      float64 // Percentage of bill amount (e.g., 0.01 for 1%)
	LoyaltyFreeEveryN           int     // Free verification every N verifications
}

// AppConfig holds general application settings
type AppConfig struct {
	FrontendURL string // Frontend URL for CORS
	RateLimitRPM int   // Rate limit: requests per minute
}

// Load reads configuration from environment variables
// This function is called when the app starts
func Load() (*Config, error) {
	// Try to load .env file (only in development)
	// In production, environment variables are set by the system
	if err := godotenv.Load(); err != nil {
		// Not an error if .env doesn't exist (e.g., in production)
		fmt.Println("No .env file found, using system environment variables")
	}

	// Create config object and populate it
	cfg := &Config{
		Server: ServerConfig{
			Port:        getEnv("SERVER_PORT", "8080"),
			Host:        getEnv("SERVER_HOST", "localhost"),
			Environment: getEnv("ENVIRONMENT", "development"),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "billuser"),
			Password:        getEnv("DB_PASSWORD", "billpass123"),
			DBName:          getEnv("DB_NAME", "bill_verification_db"),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxConnections:  getEnvAsInt("DB_MAX_CONNECTIONS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNECTIONS", 5),
			ConnMaxLifetime: time.Hour,
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", "redispass123"),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:              getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
			AccessTokenExpiry:   parseDuration(getEnv("JWT_ACCESS_TOKEN_EXPIRY", "15m"), 15*time.Minute),
			RefreshTokenExpiry:  parseDuration(getEnv("JWT_REFRESH_TOKEN_EXPIRY", "7d"), 7*24*time.Hour),
		},
		Pricing: PricingConfig{
			BillGenerationFee:      getEnvAsFloat("BILL_GENERATION_FEE", 0.50),
			VerificationMinFee:     getEnvAsFloat("VERIFICATION_MIN_FEE", 1.00),
			VerificationMaxFee:     getEnvAsFloat("VERIFICATION_MAX_FEE", 10.00),
			VerificationPercentage: getEnvAsFloat("VERIFICATION_PERCENTAGE", 0.01),
			LoyaltyFreeEveryN:      getEnvAsInt("LOYALTY_FREE_EVERY_N_VERIFICATIONS", 10),
		},
		App: AppConfig{
			FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
			RateLimitRPM: getEnvAsInt("RATE_LIMIT_REQUESTS_PER_MINUTE", 60),
		},
	}

	// Validate critical settings
	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return cfg, nil
}

// Validate checks if configuration is valid
func (c *Config) Validate() error {
	// Check if JWT secret is default (security risk!)
	if c.JWT.Secret == "your-super-secret-jwt-key-change-this-in-production" && 
	   c.Server.Environment == "production" {
		return fmt.Errorf("JWT_SECRET must be changed in production")
	}

	// Check if database credentials are set
	if c.Database.User == "" || c.Database.Password == "" {
		return fmt.Errorf("database credentials not set")
	}

	return nil
}

// GetDatabaseDSN returns PostgreSQL connection string
// DSN = Data Source Name (connection string format)
func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}

// GetRedisAddr returns Redis connection address
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", c.Redis.Host, c.Redis.Port)
}

// IsDevelopment checks if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction checks if running in production mode
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}

// Helper functions to read environment variables with defaults

// getEnv reads an environment variable or returns default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt reads an environment variable as integer or returns default
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	
	return value
}

// getEnvAsFloat reads an environment variable as float64 or returns default
func getEnvAsFloat(key string, defaultValue float64) float64 {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	
	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return defaultValue
	}
	
	return value
}

// parseDuration parses duration string (e.g., "15m", "7d") or returns default
func parseDuration(durationStr string, defaultDuration time.Duration) time.Duration {
	// Handle special case for days (Go doesn't support "d" suffix)
	if len(durationStr) > 0 && durationStr[len(durationStr)-1] == 'd' {
		// Extract number of days
		days, err := strconv.Atoi(durationStr[:len(durationStr)-1])
		if err != nil {
			return defaultDuration
		}
		return time.Duration(days) * 24 * time.Hour
	}
	
	// Parse standard duration (e.g., "15m", "2h")
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		return defaultDuration
	}
	
	return duration
}