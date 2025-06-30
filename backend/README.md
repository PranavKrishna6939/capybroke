# Portfolio Roast Backend

Simple Go backend for the Portfolio Roast application with load-balanced API key support.

## Setup

1. Copy `.env.example` to `.env` and add your Gemini API keys:
   ```
   GEMINI_API_KEY_1=your_first_api_key_here
   GEMINI_API_KEY_2=your_second_api_key_here
   GEMINI_API_KEY_3=your_third_api_key_here
   GEMINI_API_KEY_4=your_fourth_api_key_here
   GEMINI_API_KEY_5=your_fifth_api_key_here
   ```

2. Run both frontend and backend:
   ```bash
   npm run start:all
   ```

Or run just the backend:
```bash
cd backend
go run main.go
```

## API Endpoints

- `POST /roast` - Submit tickers for roasting
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 8080)
- `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5` - Google Gemini API keys for load balancing
- `GEMINI_API_KEY` - Legacy single API key (will be used as GEMINI_API_KEY_1 if set)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Load Balancing

The backend automatically distributes API requests across all configured API keys using round-robin load balancing. This helps:
- Increase rate limits by spreading requests across multiple keys
- Improve reliability in case one key fails
- Better performance under high load

You can configure anywhere from 1 to 5 API keys. The system will automatically detect and use all available keys.
