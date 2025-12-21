package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient wraps the Redis client
type RedisClient struct {
	*redis.Client
}

// RedisConfig holds Redis connection configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// NewRedisClient creates a new Redis connection
func NewRedisClient(cfg RedisConfig) (*RedisClient, error) {
	// Create Redis client
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
		
		// Connection pool settings
		PoolSize:     10,               // Max number of connections
		MinIdleConns: 5,                // Min idle connections
		MaxRetries:   3,                // Retry failed commands
		DialTimeout:  5 * time.Second,  // Timeout for connecting
		ReadTimeout:  3 * time.Second,  // Timeout for read operations
		WriteTimeout: 3 * time.Second,  // Timeout for write operations
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("✅ Redis connection established successfully")

	return &RedisClient{Client: client}, nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	if r.Client != nil {
		log.Println("🔌 Closing Redis connection...")
		return r.Client.Close()
	}
	return nil
}

// HealthCheck verifies Redis is healthy
func (r *RedisClient) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := r.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("Redis unhealthy: %w", err)
	}

	return nil
}

// GetStats returns Redis connection statistics
func (r *RedisClient) GetStats() map[string]interface{} {
	stats := r.PoolStats()
	
	return map[string]interface{}{
		"hits":         stats.Hits,
		"misses":       stats.Misses,
		"timeouts":     stats.Timeouts,
		"total_conns":  stats.TotalConns,
		"idle_conns":   stats.IdleConns,
		"stale_conns":  stats.StaleConns,
	}
}