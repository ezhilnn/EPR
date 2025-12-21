package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	// Import our packages (adjust path to match your go.mod)

	"github.com/ezhilnn/epr-backend/config"
	"github.com/ezhilnn/epr-backend/internal/database"
	"github.com/ezhilnn/epr-backend/internal/handlers"
	"github.com/ezhilnn/epr-backend/internal/middleware"
	"github.com/ezhilnn/epr-backend/internal/models"
	"github.com/ezhilnn/epr-backend/internal/repository"
	"github.com/ezhilnn/epr-backend/internal/services"
)

func main() {
	// Load configuration from .env
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	log.Printf("🚀 Starting Bill Verification System in %s mode...", cfg.Server.Environment)

	// Connect to PostgreSQL
	db, err := database.NewPostgresDB(database.Config{
		Host:            cfg.Database.Host,
		Port:            cfg.Database.Port,
		User:            cfg.Database.User,
		Password:        cfg.Database.Password,
		DBName:          cfg.Database.DBName,
		SSLMode:         cfg.Database.SSLMode,
		MaxConnections:  cfg.Database.MaxConnections,
		MaxIdleConns:    cfg.Database.MaxIdleConns,
		ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Connect to Redis
	redisClient, err := database.NewRedisClient(database.RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	billRepo := repository.NewBillRepository(db.DB)
	verificationRepo := repository.NewVerificationRepository(db.DB)

	// Initialize services
	billService := services.NewBillService(billRepo, userRepo, cfg)
	verificationService := services.NewVerificationService(verificationRepo, billRepo, userRepo, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo, cfg)
	billHandler := handlers.NewBillHandler(billService)
	verificationHandler := handlers.NewVerificationHandler(verificationService)
	dashboardHandler := handlers.NewDashboardHandler(billService, verificationService)

	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Create Gin router
	router := gin.Default()

	// Apply global middleware
	router.Use(middleware.CORSMiddleware([]string{cfg.App.FrontendURL, "*"}))

	// Setup routes
	setupRoutes(router, db, redisClient, cfg, authHandler, billHandler, verificationHandler, dashboardHandler, billRepo, verificationRepo, userRepo)

	// Create HTTP server
	srv := &http.Server{
		Addr:           fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:        router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start server in goroutine
	go func() {
		log.Printf("🌐 Server listening on http://%s:%s", cfg.Server.Host, cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("❌ Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}

// setupRoutes configures all API routes
func setupRoutes(
	router *gin.Engine,
	db *database.DB,
	redis *database.RedisClient,
	cfg *config.Config,
	authHandler *handlers.AuthHandler,
	billHandler *handlers.BillHandler,
	verificationHandler *handlers.VerificationHandler,
	dashboardHandler *handlers.DashboardHandler,
	billRepo *repository.BillRepository,
	verificationRepo *repository.VerificationRepository,
	userRepo *repository.UserRepository,
) {
	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Health check endpoint (public)
		v1.GET("/health", func(c *gin.Context) {
			dbErr := db.HealthCheck()
			dbStatus := "healthy"
			if dbErr != nil {
				dbStatus = fmt.Sprintf("unhealthy: %v", dbErr)
			}

			redisErr := redis.HealthCheck()
			redisStatus := "healthy"
			if redisErr != nil {
				redisStatus = fmt.Sprintf("unhealthy: %v", redisErr)
			}

			overallStatus := "healthy"
			statusCode := http.StatusOK
			if dbErr != nil || redisErr != nil {
				overallStatus = "degraded"
				statusCode = http.StatusServiceUnavailable
			}

			c.JSON(statusCode, gin.H{
				"status":      overallStatus,
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
				"environment": cfg.Server.Environment,
				"services": gin.H{
					"database": gin.H{
						"status": dbStatus,
						"stats":  db.Stats(),
					},
					"redis": gin.H{
						"status": redisStatus,
						"stats":  redis.GetStats(),
					},
				},
			})
		})

		// Ping endpoint (public)
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "pong",
				"time":    time.Now().UTC().Format(time.RFC3339),
			})
		})

		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)

			// Protected route - requires authentication
			auth.GET("/me", middleware.AuthMiddleware(cfg.JWT.Secret), authHandler.GetMe)
			auth.POST("/wallet/topup", middleware.AuthMiddleware(cfg.JWT.Secret), authHandler.TopupWallet)
		}

		// Bill verification (public - no auth required)
		v1.GET("/bills/verify/:bill_number", billHandler.VerifyBill)

		// Verification endpoints
		verify := v1.Group("/verify")
		{
			// Public verification (optional auth - can work without login)
			verify.POST("", func(c *gin.Context) {
				// Try to get auth, but don't require it
				authHeader := c.GetHeader("Authorization")
				if authHeader != "" {
					// If auth provided, validate it
					middleware.AuthMiddleware(cfg.JWT.Secret)(c)
					if c.IsAborted() {
						return
					}
				}
				verificationHandler.VerifyBill(c)
			})

			// Protected verification endpoints (require auth)
			verify.GET("/history", middleware.AuthMiddleware(cfg.JWT.Secret), verificationHandler.GetVerificationHistory)
			verify.GET("/stats", middleware.AuthMiddleware(cfg.JWT.Secret), verificationHandler.GetVerificationStats)
			verify.GET("/search", middleware.AuthMiddleware(cfg.JWT.Secret), verificationHandler.SearchVerifications)
		}

		// Dashboard endpoints (protected)
		dashboard := v1.Group("/dashboard")
		dashboard.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			// Public user dashboard
			dashboard.GET("", dashboardHandler.GetPublicDashboard)

			// Institution dashboard
			dashboard.GET("/institution", middleware.RequireRole(
				string(models.RoleInstitutionUser),
				string(models.RoleInstitutionAdmin),
				string(models.RoleMasterAdmin),
			), dashboardHandler.GetInstitutionDashboard)

			// Verifier dashboard
			dashboard.GET("/verifier", middleware.RequireRole(
				string(models.RoleVerifier),
				string(models.RoleMasterAdmin),
			), dashboardHandler.GetVerifierDashboard)
		}

		// Bill routes (protected - requires authentication)
		bills := v1.Group("/bills")
		bills.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		{
			// Only institutions can generate bills
			bills.POST("", middleware.RequireRole(
				string(models.RoleInstitutionUser),
				string(models.RoleInstitutionAdmin),
				string(models.RoleMasterAdmin),
			), billHandler.CreateBill)

			// Get user's bills
			bills.GET("", billHandler.ListBills)
			bills.GET("/search", billHandler.SearchBills)
			bills.GET("/stats", billHandler.GetBillStats)

			// Single bill operations
			bills.GET("/:id", billHandler.GetBill)
			bills.GET("/number/:bill_number", billHandler.GetBillByNumber)
			bills.GET("/:id/qrcode", billHandler.DownloadBillQR)
			bills.GET("/:id/verifications", func(c *gin.Context) {
				handlers.GetBillVerificationLogs(c, billRepo, verificationRepo, userRepo)
			})
			bills.DELETE("/:id", billHandler.DeleteBill)
		}

		// Protected routes example (we'll add more later)
		// protected := v1.Group("")
		// protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		// {
		// 	// Example: Only authenticated users can access this
		// 	protected.GET("/dashboard", func(c *gin.Context) {
		// 		userID, _ := c.Get("user_id")
		// 		email, _ := c.Get("email")
		// 		role, _ := c.Get("role")

		// 		c.JSON(http.StatusOK, gin.H{
		// 			"message": "Welcome to your dashboard!",
		// 			"user": gin.H{
		// 				"id":    userID,
		// 				"email": email,
		// 				"role":  role,
		// 			},
		// 		})
		// 	})
		// }

		// Admin-only routes example
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
		admin.Use(middleware.RequireRole("master_admin"))
		{
			admin.GET("/stats", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "Admin statistics",
				})
			})
		}
	}

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Bill Verification System API",
			"version": "1.0.0",
			"docs":    "/api/v1/health",
			"endpoints": gin.H{
				"health":  "/api/v1/health",
				"signup":  "POST /api/v1/auth/signup",
				"login":   "POST /api/v1/auth/login",
				"refresh": "POST /api/v1/auth/refresh",
				"me":      "GET /api/v1/auth/me (requires auth)",
			},
		})
	})
}
