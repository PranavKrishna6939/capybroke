# Roast My Portfolio

A web application that provides AI-powered roasts and feedback for portfolios.

## Deployment Instructions

### STEP 1: Setup Directory Structure
```bash
cd /opt
sudo mkdir roastmyportfolio
sudo chown ec2-user:ec2-user roastmyportfolio
cd roastmyportfolio

# As ec2-user
git clone https://github.com/PranavKrishna6939/capybroke.git
cd capybroke
```

### STEP 2: Setup Backend (Go API)
```bash
cd backend

# Copy and configure your .env file
cp .env.production .env   # or create manually

# Build the Go app
go build -o portfolio-roast-prod main.go

# Run the backend (use PM2 or systemd later)
./portfolio-roast-prod &
```

#### Optional: Use PM2 for backend
```bash
pm2 start ./portfolio-roast-prod --name roast-backend
pm2 save
pm2 startup
```

### STEP 3: Setup Frontend (Next.js)
```bash
cd ../

npm install
npm run build

# Run with PM2 (or 'npm start' directly)
pm2 start npm --name roast-frontend -- start
pm2 save
```

### STEP 4: Configure NGINX
```bash
sudo nano /etc/nginx/conf.d/roastmyportfolio.conf

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### STEP 5: Make Services Auto-Start
Already done if you used:
```bash
pm2 startup
pm2 save
```

Otherwise, use `systemd` service units for backend/frontend.

## Configuration Notes

### Default Ports
- Frontend: 3000
- Backend: 8080

### Environment Variables
Make sure environment variables are set in:
- `.env.production` (frontend)
- `backend/.env` (backend)

## PM2 Management Commands

### Basic Operations
```bash
# Restart services
pm2 restart roast-frontend
pm2 restart roast-backend

# View logs
pm2 logs roast-backend

# Stop services
pm2 stop roast-backend
pm2 stop roast-frontend

# Delete services
pm2 delete roast-backend
pm2 delete roast-frontend
pm2 delete all

# List all services
pm2 list
```