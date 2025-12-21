package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // PostgreSQL driver (imported for side effects)
)

// DB wraps the database connection
// This struct holds our database connection pool
type DB struct {
	*sqlx.DB // Embedded sqlx.DB (inherits all its methods)
}

// Config holds database connection configuration
type Config struct {
	Host            string
	Port            string
	User            string
	Password        string
	DBName          string
	SSLMode         string
	MaxConnections  int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// NewPostgresDB creates a new PostgreSQL connection
// This function establishes connection to the database
func NewPostgresDB(cfg Config) (*DB, error) {
	// Build connection string (DSN - Data Source Name)
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.SSLMode,
	)

	// Open database connection
	// "postgres" is the driver name
	db, err := sqlx.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	// Connection pool reuses database connections for efficiency
	db.SetMaxOpenConns(cfg.MaxConnections)      // Max number of open connections
	db.SetMaxIdleConns(cfg.MaxIdleConns)        // Max number of idle connections
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)  // Max lifetime of a connection

	// Test the connection with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel() // Always call cancel to free resources

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("✅ Database connection established successfully")

	return &DB{DB: db}, nil
}

// Close closes the database connection
// Always call this when your application shuts down
func (db *DB) Close() error {
	if db.DB != nil {
		log.Println("🔌 Closing database connection...")
		return db.DB.Close()
	}
	return nil
}

// Ping checks if database is still alive
func (db *DB) Ping() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	return db.PingContext(ctx)
}

// HealthCheck returns database health status
// Used by /health endpoint to verify database connectivity
func (db *DB) HealthCheck() error {
	// Try to ping database
	if err := db.Ping(); err != nil {
		return fmt.Errorf("database unhealthy: %w", err)
	}

	// Check if we can execute a simple query
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	var result int
	err := db.GetContext(ctx, &result, "SELECT 1")
	if err != nil {
		return fmt.Errorf("database query failed: %w", err)
	}

	return nil
}

// Stats returns database connection pool statistics
// Useful for monitoring and debugging
func (db *DB) Stats() map[string]interface{} {
	stats := db.DB.Stats()
	
	return map[string]interface{}{
		"max_open_connections": stats.MaxOpenConnections,
		"open_connections":     stats.OpenConnections,
		"in_use":               stats.InUse,
		"idle":                 stats.Idle,
		"wait_count":           stats.WaitCount,
		"wait_duration":        stats.WaitDuration.String(),
	}
}