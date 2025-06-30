package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
)

type RoastRequest struct {
	Tickers []string `json:"tickers"`
}

type Stock struct {
	Company string   `json:"company"`
	Pros    []string `json:"pros"`
	Cons    []string `json:"cons"`
}

type RoastResponse struct {
	Roast  string            `json:"roast"`
	Stocks map[string]*Stock `json:"stocks"`
}

type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []Candidate `json:"candidates"`
}

type Candidate struct {
	Content Content `json:"content"`
}

// Analytics structures
type APIMetrics struct {
	Endpoint         string    `json:"endpoint"`
	RequestCount     int64     `json:"requestCount"`
	LastRequestTime  time.Time `json:"lastRequestTime"`
	RequestsToday    int64     `json:"requestsToday"`
	RequestsThisHour int64     `json:"requestsThisHour"`
	ErrorCount       int64     `json:"errorCount"`
}

type UserMetrics struct {
	UniqueUsers       int64     `json:"uniqueUsers"`
	TotalPageVisits   int64     `json:"totalPageVisits"`
	ConcurrentUsers   int64     `json:"concurrentUsers"`
	HighestConcurrent int64     `json:"highestConcurrent"`
	LastUpdate        time.Time `json:"lastUpdate"`
}

type GeminiKeyMetrics struct {
	KeyIndex     int       `json:"keyIndex"`
	KeyName      string    `json:"keyName"`
	RequestCount int64     `json:"requestCount"`
	ErrorCount   int64     `json:"errorCount"`
	LastUsed     time.Time `json:"lastUsed"`
	IsActive     bool      `json:"isActive"`
}

type AnalyticsData struct {
	APIMetrics       map[string]*APIMetrics `json:"apiMetrics"`
	UserMetrics      *UserMetrics           `json:"userMetrics"`
	GeminiKeyMetrics []*GeminiKeyMetrics    `json:"geminiKeyMetrics"`
	LastUpdate       time.Time              `json:"lastUpdate"`
}

type AnalyticsResponse struct {
	RequestsPerMinute map[string]float64  `json:"requestsPerMinute"`
	TotalRequests     map[string]int64    `json:"totalRequests"`
	RequestsToday     map[string]int64    `json:"requestsToday"`
	UniqueUsers       int64               `json:"uniqueUsers"`
	TotalPageVisits   int64               `json:"totalPageVisits"`
	ConcurrentUsers   int64               `json:"concurrentUsers"`
	HighestConcurrent int64               `json:"highestConcurrent"`
	GeminiKeyMetrics  []*GeminiKeyMetrics `json:"geminiKeyMetrics"`
	SystemUptime      float64             `json:"systemUptime"`
	LastUpdate        time.Time           `json:"lastUpdate"`
}

// APIKeyManager manages multiple API keys for load balancing
type APIKeyManager struct {
	keys    []string
	current int
	mutex   sync.Mutex
}

// Analytics manager for tracking metrics
type AnalyticsManager struct {
	data              *AnalyticsData
	mutex             sync.RWMutex
	dataFile          string
	startTime         time.Time
	activeConnections sync.Map        // Track active user connections
	uniqueIPs         map[string]bool // Track unique IP addresses
}

// Rate limiting structures
type RateLimitEntry struct {
	LastRequest  time.Time
	RequestCount int
}

type RateLimiter struct {
	requests map[string]*RateLimitEntry
	mutex    sync.RWMutex
	limit    int           // requests per window
	window   time.Duration // time window
}

// NewAnalyticsManager creates a new analytics manager
func NewAnalyticsManager(dataFile string) *AnalyticsManager {
	am := &AnalyticsManager{
		data: &AnalyticsData{
			APIMetrics:       make(map[string]*APIMetrics),
			UserMetrics:      &UserMetrics{LastUpdate: time.Now()},
			GeminiKeyMetrics: make([]*GeminiKeyMetrics, 0),
			LastUpdate:       time.Now(),
		},
		dataFile:  dataFile,
		startTime: time.Now(),
		uniqueIPs: make(map[string]bool),
	}

	// Load existing data if available
	am.loadData()

	// Start cleanup routine for expired connections
	go am.cleanupConnections()

	return am
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*RateLimitEntry),
		limit:    limit,
		window:   window,
	}

	// Start cleanup routine for expired entries
	go rl.cleanupExpiredEntries()

	return rl
}

// Track API request
func (am *AnalyticsManager) TrackAPIRequest(endpoint string, success bool) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.data.APIMetrics[endpoint] == nil {
		am.data.APIMetrics[endpoint] = &APIMetrics{
			Endpoint: endpoint,
		}
	}

	metric := am.data.APIMetrics[endpoint]
	metric.RequestCount++
	metric.LastRequestTime = time.Now()

	// Track daily requests
	today := time.Now().Truncate(24 * time.Hour)
	if metric.LastRequestTime.Truncate(24 * time.Hour).Equal(today) {
		metric.RequestsToday++
	} else {
		metric.RequestsToday = 1
	}

	// Track hourly requests
	thisHour := time.Now().Truncate(time.Hour)
	if metric.LastRequestTime.Truncate(time.Hour).Equal(thisHour) {
		metric.RequestsThisHour++
	} else {
		metric.RequestsThisHour = 1
	}

	if !success {
		metric.ErrorCount++
	}

	am.data.LastUpdate = time.Now()
	am.saveData()
}

// Track Gemini API key usage
func (am *AnalyticsManager) TrackGeminiKeyUsage(keyIndex int, keyName string, success bool) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	// Find or create key metrics
	var keyMetric *GeminiKeyMetrics
	for _, metric := range am.data.GeminiKeyMetrics {
		if metric.KeyIndex == keyIndex {
			keyMetric = metric
			break
		}
	}

	if keyMetric == nil {
		keyMetric = &GeminiKeyMetrics{
			KeyIndex: keyIndex,
			KeyName:  keyName,
			IsActive: true,
		}
		am.data.GeminiKeyMetrics = append(am.data.GeminiKeyMetrics, keyMetric)
	}

	keyMetric.RequestCount++
	keyMetric.LastUsed = time.Now()

	if !success {
		keyMetric.ErrorCount++
	}

	am.saveData()
}

// Track user connection
func (am *AnalyticsManager) TrackUserConnection(userID string) {
	am.activeConnections.Store(userID, time.Now())
	am.updateConcurrentUsers()
}

// Track page visit and unique user
func (am *AnalyticsManager) TrackPageVisit(clientIP string) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	// Increment total page visits
	am.data.UserMetrics.TotalPageVisits++

	// Track unique IP
	if !am.uniqueIPs[clientIP] {
		am.uniqueIPs[clientIP] = true
		am.data.UserMetrics.UniqueUsers++
	}

	am.data.UserMetrics.LastUpdate = time.Now()
	am.saveData()
}

// Remove user connection
func (am *AnalyticsManager) RemoveUserConnection(userID string) {
	am.activeConnections.Delete(userID)
	am.updateConcurrentUsers()
}

// Update concurrent user metrics
func (am *AnalyticsManager) updateConcurrentUsers() {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	count := int64(0)
	am.activeConnections.Range(func(key, value interface{}) bool {
		count++
		return true
	})

	am.data.UserMetrics.ConcurrentUsers = count
	if count > am.data.UserMetrics.HighestConcurrent {
		am.data.UserMetrics.HighestConcurrent = count
	}
	am.data.UserMetrics.LastUpdate = time.Now()
}

// Cleanup expired connections
func (am *AnalyticsManager) cleanupConnections() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		am.activeConnections.Range(func(key, value interface{}) bool {
			if lastSeen, ok := value.(time.Time); ok && now.Sub(lastSeen) > 5*time.Minute {
				am.activeConnections.Delete(key)
			}
			return true
		})
		am.updateConcurrentUsers()
	}
}

// IsAllowed checks if a request from the given IP is allowed
func (rl *RateLimiter) IsAllowed(ip string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	entry, exists := rl.requests[ip]

	if !exists {
		// First request from this IP
		rl.requests[ip] = &RateLimitEntry{
			LastRequest:  now,
			RequestCount: 1,
		}
		return true
	}

	// Check if we're still within the rate limit window
	if now.Sub(entry.LastRequest) >= rl.window {
		// Reset the counter for new window
		entry.LastRequest = now
		entry.RequestCount = 1
		return true
	}

	// Within the window, check if under limit
	if entry.RequestCount < rl.limit {
		entry.RequestCount++
		entry.LastRequest = now
		return true
	}

	// Rate limit exceeded
	return false
}

// GetRemainingRequests returns how many requests are left for an IP in current window
func (rl *RateLimiter) GetRemainingRequests(ip string) int {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	entry, exists := rl.requests[ip]
	if !exists {
		return rl.limit
	}

	// Check if window has expired
	if time.Since(entry.LastRequest) >= rl.window {
		return rl.limit
	}

	remaining := rl.limit - entry.RequestCount
	if remaining < 0 {
		return 0
	}
	return remaining
}

// GetRemainingTime returns how long until the rate limit resets for an IP
func (rl *RateLimiter) GetRemainingTime(ip string) time.Duration {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	entry, exists := rl.requests[ip]
	if !exists {
		return 0
	}

	elapsed := time.Since(entry.LastRequest)
	if elapsed >= rl.window {
		return 0
	}

	return rl.window - elapsed
}

// cleanupExpiredEntries removes old entries to prevent memory leaks
func (rl *RateLimiter) cleanupExpiredEntries() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mutex.Lock()
		now := time.Now()

		for ip, entry := range rl.requests {
			if now.Sub(entry.LastRequest) >= rl.window*2 {
				delete(rl.requests, ip)
			}
		}

		rl.mutex.Unlock()
	}
}

// NewAPIKeyManager creates a new API key manager
func NewAPIKeyManager() *APIKeyManager {
	var keys []string

	// Load up to 5 API keys from environment variables
	for i := 1; i <= 5; i++ {
		keyName := fmt.Sprintf("GEMINI_API_KEY_%d", i)
		if i == 1 {
			// Also check for the original GEMINI_API_KEY for backward compatibility
			if key := os.Getenv("GEMINI_API_KEY"); key != "" {
				keys = append(keys, key)
				continue
			}
		}

		if key := os.Getenv(keyName); key != "" {
			keys = append(keys, key)
		}
	}

	if len(keys) == 0 {
		log.Println("Warning: No API keys found. Please set GEMINI_API_KEY_1 through GEMINI_API_KEY_5")
	}

	log.Printf("Loaded %d API keys for load balancing", len(keys))

	return &APIKeyManager{
		keys:    keys,
		current: 0,
	}
}

// GetNextKey returns the next API key in round-robin fashion
func (m *APIKeyManager) GetNextKey() (string, int, error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if len(m.keys) == 0 {
		return "", -1, fmt.Errorf("no API keys available")
	}

	key := m.keys[m.current]
	index := m.current
	m.current = (m.current + 1) % len(m.keys)

	return key, index, nil
}

// GetKeyCount returns the number of available API keys
func (m *APIKeyManager) GetKeyCount() int {
	return len(m.keys)
}

var apiKeyManager *APIKeyManager
var analyticsManager *AnalyticsManager
var rateLimiter *RateLimiter

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// Initialize the API key manager
	apiKeyManager = NewAPIKeyManager()
	if apiKeyManager.GetKeyCount() == 0 {
		log.Fatal("No API keys found. Please set GEMINI_API_KEY_1 through GEMINI_API_KEY_5 in your environment or .env file")
	}

	// Initialize analytics manager
	analyticsManager = NewAnalyticsManager("./data/analytics.json")

	// Initialize rate limiter - 2 roast requests per minute per IP
	rateLimiter = NewRateLimiter(2, 1*time.Minute)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/roast", corsHandler(rateLimitHandler(trackingHandler("roast", roastHandler))))
	http.HandleFunc("/health", corsHandler(trackingHandler("health", healthHandler)))
	http.HandleFunc("/analytics", corsHandler(trackingHandler("analytics", analyticsHandler)))

	log.Printf("Server starting on port %s with %d API keys", port, apiKeyManager.GetKeyCount())
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func corsHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func trackingHandler(endpoint string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			userID = r.RemoteAddr + "-" + fmt.Sprintf("%d", time.Now().UnixNano())
		}

		// Get client IP for unique user tracking
		clientIP := getClientIP(r)

		// Track user connection and page visit
		analyticsManager.TrackUserConnection(userID)
		analyticsManager.TrackPageVisit(clientIP)
		defer analyticsManager.RemoveUserConnection(userID)

		// Track API request
		success := true
		defer func() {
			analyticsManager.TrackAPIRequest(endpoint, success)
		}()

		// Custom response writer to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		next(wrapped, r)

		if wrapped.statusCode >= 400 {
			success = false
		}
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func analyticsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	analytics := analyticsManager.GetAnalytics()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analytics)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func roastHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RoastRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	validTickers := validateTickers(req.Tickers)
	if len(validTickers) == 0 {
		http.Error(w, "No valid tickers provided", http.StatusBadRequest)
		return
	}

	portfolioRoast, err := generatePortfolioRoast(validTickers)
	if err != nil {
		log.Printf("Error generating portfolio roast: %v", err)
		portfolioRoast = generateFallbackRoast(validTickers)
	}

	stocksData := make(map[string]*Stock)
	for _, ticker := range validTickers {
		stockData, err := generateStockAnalysis(ticker)
		if err != nil {
			log.Printf("Error generating analysis for %s: %v", ticker, err)
			stockData = generateFallbackStock(ticker)
		}
		stocksData[ticker] = stockData
	}

	response := RoastResponse{
		Roast:  portfolioRoast,
		Stocks: stocksData,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func validateTickers(tickers []string) []string {
	var valid []string
	tickerRegex := regexp.MustCompile(`^[A-Z]{1,5}$`)

	for _, ticker := range tickers {
		cleaned := strings.TrimSpace(strings.ToUpper(ticker))
		if tickerRegex.MatchString(cleaned) && len(cleaned) <= 5 {
			valid = append(valid, cleaned)
		}
	}

	if len(valid) > 10 {
		valid = valid[:10]
	}

	return valid
}

func generatePortfolioRoast(tickers []string) (string, error) {
	apiKey, keyIndex, err := apiKeyManager.GetNextKey()
	if err != nil {
		return "", fmt.Errorf("failed to get API key: %v", err)
	}

	prompt := fmt.Sprintf(`Roast this stock portfolio in a humorous, witty, and insightful way (200-300 words): %s

Be brutally honest but entertaining. Focus on:
- Overall portfolio composition
- Risk profile
- Common investor mistakes
- Market trends and timing
- Diversification (or lack thereof)

Write like a sarcastic but knowledgeable financial advisor who isn't afraid to hurt feelings while giving solid insights.`, strings.Join(tickers, ", "))

	result, err := callGeminiAPI(prompt, apiKey)

	// Track Gemini API usage
	keyName := fmt.Sprintf("GEMINI_API_KEY_%d", keyIndex+1)
	analyticsManager.TrackGeminiKeyUsage(keyIndex, keyName, err == nil)

	return result, err
}

func generateStockAnalysis(ticker string) (*Stock, error) {
	apiKey, keyIndex, err := apiKeyManager.GetNextKey()
	if err != nil {
		return nil, fmt.Errorf("failed to get API key: %v", err)
	}

	prompt := fmt.Sprintf(`Analyze the stock %s and provide:
1. Company name
2. 2-3 pros (strengths, opportunities)  
3. 2-3 cons (weaknesses, risks)
Make the lines short, preferably less than 25 words.

Return ONLY valid JSON in this exact format (no markdown, no backticks, no extra text):
{
  "company": "Company Name",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2", "Con 3"]
}

Write like a sarcastic but factual financial advisor who isn't afraid to hurt feelings while giving solid insights. Include recent market conditions and business fundamentals.`, ticker)

	response, err := callGeminiAPI(prompt, apiKey)

	// Track Gemini API usage
	keyName := fmt.Sprintf("GEMINI_API_KEY_%d", keyIndex+1)
	analyticsManager.TrackGeminiKeyUsage(keyIndex, keyName, err == nil)

	if err != nil {
		return nil, err
	}

	// Extract JSON from markdown code blocks if present
	cleanedResponse := extractJSONFromMarkdown(response)

	var stock Stock
	if err := json.Unmarshal([]byte(cleanedResponse), &stock); err != nil {
		return nil, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	return &stock, nil
}

func extractJSONFromMarkdown(text string) string {
	// Remove markdown code block markers
	text = strings.TrimSpace(text)

	// Check for ```json or ``` markers
	if strings.HasPrefix(text, "```json") {
		text = strings.TrimPrefix(text, "```json")
		text = strings.TrimSuffix(text, "```")
	} else if strings.HasPrefix(text, "```") {
		text = strings.TrimPrefix(text, "```")
		text = strings.TrimSuffix(text, "```")
	}

	return strings.TrimSpace(text)
}

func callGeminiAPI(prompt, apiKey string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=%s", apiKey)

	reqBody := GeminiRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content in API response")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func generateFallbackRoast(tickers []string) string {
	return fmt.Sprintf(`Well, well, well... looks like someone decided to build a portfolio by throwing darts at a stock ticker board! You've managed to assemble %d stocks that scream "I read one Reddit post about investing and called it research." This collection has all the diversification of a teenager's Spotify playlist - heavy on the popular hits, light on the actual strategy. But hey, at least you're consistently following the time-honored tradition of buying high and hoping for the best. Your portfolio is like a box of chocolates, except you already know what you're gonna get: stress, sleepless nights, and the occasional pleasant surprise when one of these actually goes up!`, len(tickers))
}

func generateFallbackStock(ticker string) *Stock {
	return &Stock{
		Company: fmt.Sprintf("%s Corporation", ticker),
		Pros: []string{
			"You managed to spell the ticker correctly",
			"It's a real company that exists",
			"Could potentially make money",
			"At least it's not a cryptocurrency",
		},
		Cons: []string{
			"Your research probably consisted of a 5-second Google search",
			"Buying stocks based on name recognition isn't a strategy",
			"You might want to read an annual report sometime",
			"FOMO isn't an investment thesis",
		},
	}
}

// getClientIP extracts the real client IP from the request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for proxy/load balancer scenarios)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			// Take the first IP (original client)
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return strings.TrimSpace(xrip)
	}

	// Fallback to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// rateLimitHandler middleware for rate limiting
func rateLimitHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := getClientIP(r)

		if !rateLimiter.IsAllowed(clientIP) {
			remainingTime := rateLimiter.GetRemainingTime(clientIP)

			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-RateLimit-Limit", "2")
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(remainingTime).Unix()))
			w.WriteHeader(http.StatusTooManyRequests)

			response := map[string]interface{}{
				"error":      "Rate limit exceeded. Please wait before making another request.",
				"retryAfter": int(remainingTime.Seconds()),
				"message":    fmt.Sprintf("You can make another request in %v", remainingTime.Round(time.Second)),
			}

			json.NewEncoder(w).Encode(response)
			return
		}

		// Calculate remaining requests for this IP
		remaining := rateLimiter.GetRemainingRequests(clientIP)

		// Add rate limit headers for successful requests
		w.Header().Set("X-RateLimit-Limit", "2")
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(1*time.Minute).Unix()))

		next(w, r)
	}
}

// Get analytics response
func (am *AnalyticsManager) GetAnalytics() *AnalyticsResponse {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	requestsPerMinute := make(map[string]float64)
	totalRequests := make(map[string]int64)
	requestsToday := make(map[string]int64)

	for endpoint, metric := range am.data.APIMetrics {
		totalRequests[endpoint] = metric.RequestCount
		requestsToday[endpoint] = metric.RequestsToday

		// Calculate requests per minute based on last hour
		if metric.RequestsThisHour > 0 {
			requestsPerMinute[endpoint] = float64(metric.RequestsThisHour) / 60.0
		} else {
			requestsPerMinute[endpoint] = 0
		}
	}

	return &AnalyticsResponse{
		RequestsPerMinute: requestsPerMinute,
		TotalRequests:     totalRequests,
		RequestsToday:     requestsToday,
		UniqueUsers:       am.data.UserMetrics.UniqueUsers,
		TotalPageVisits:   am.data.UserMetrics.TotalPageVisits,
		ConcurrentUsers:   am.data.UserMetrics.ConcurrentUsers,
		HighestConcurrent: am.data.UserMetrics.HighestConcurrent,
		GeminiKeyMetrics:  am.data.GeminiKeyMetrics,
		SystemUptime:      time.Since(am.startTime).Seconds(),
		LastUpdate:        am.data.LastUpdate,
	}
}

// Save data to file
func (am *AnalyticsManager) saveData() {
	go func() {
		data, err := json.MarshalIndent(am.data, "", "  ")
		if err != nil {
			log.Printf("Error marshaling analytics data: %v", err)
			return
		}

		// Ensure directory exists
		dir := filepath.Dir(am.dataFile)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("Error creating analytics directory: %v", err)
			return
		}

		if err := os.WriteFile(am.dataFile, data, 0644); err != nil {
			log.Printf("Error saving analytics data: %v", err)
		}
	}()
}

// Load data from file
func (am *AnalyticsManager) loadData() {
	data, err := os.ReadFile(am.dataFile)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Error loading analytics data: %v", err)
		}
		return
	}

	var analyticsData AnalyticsData
	if err := json.Unmarshal(data, &analyticsData); err != nil {
		log.Printf("Error unmarshaling analytics data: %v", err)
		return
	}

	am.data = &analyticsData
	if am.data.APIMetrics == nil {
		am.data.APIMetrics = make(map[string]*APIMetrics)
	}
	if am.data.UserMetrics == nil {
		am.data.UserMetrics = &UserMetrics{LastUpdate: time.Now()}
	}
	if am.data.GeminiKeyMetrics == nil {
		am.data.GeminiKeyMetrics = make([]*GeminiKeyMetrics, 0)
	}

	// Initialize uniqueIPs map if not already done
	if am.uniqueIPs == nil {
		am.uniqueIPs = make(map[string]bool)
	}
}
