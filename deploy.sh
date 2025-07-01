#!/bin/bash

# Amazon Linux Deployment Script for roastmyportfolio.xyz
# Run this script on your Amazon Linux server (43.205.196.254)

set -e

echo "Deploying Roast My Portfolio to Amazon Linux..."
echo "Domain: roastmyportfolio.xyz"
echo "Server: 43.205.196.254"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Updating system packages..."
yum update -y

print_status "Installing required packages..."
yum install -y docker nginx certbot python3-certbot-nginx git

# Install Docker Compose
print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
print_status "Starting Docker service..."
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

print_status "Setting up firewall rules..."
# Open required ports
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload
else
    print_warning "Firewall not found. Make sure ports 80, 443, and 8080 are open in your security group."
fi

# Create application directory
print_status "Creating application directory..."
APP_DIR="/opt/roastmyportfolio"
mkdir -p $APP_DIR
chown ec2-user:ec2-user $APP_DIR

print_status "Configuring Nginx (HTTP only initially)..."
cat > /etc/nginx/conf.d/roastmyportfolio.conf << 'EOF'
server {
    listen 80;
    server_name roastmyportfolio.xyz www.roastmyportfolio.xyz;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API endpoints
    location ~ ^/(health|analytics|roast)$ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Test Nginx configuration
nginx -t

print_status "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

print_status "Creating deployment script for ec2-user..."
cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash

# Deployment script for ec2-user
set -e

APP_DIR="/opt/roastmyportfolio"
REPO_URL="https://github.com/PranavKrishna6939/capybroke.git"  # Update this with your actual repo

echo "Pulling latest code..."
cd $APP_DIR

if [ -d "capybroke" ]; then
    cd capybroke
    git pull
else
    git clone $REPO_URL capybroke
    cd capybroke
fi

echo "Building and starting application..."
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

echo "Waiting for services to start..."
sleep 30

echo "Checking service health..."
curl -f http://localhost:8080/health || echo "Backend health check failed"
curl -f http://localhost:3000 || echo "Frontend health check failed"

echo "Deployment completed!"
echo "Your site should be available at: http://roastmyportfolio.xyz"
EOF

chmod +x $APP_DIR/deploy.sh
chown ec2-user:ec2-user $APP_DIR/deploy.sh

print_status "Setting up SSL certificates automatically..."
print_warning "Generating Let's Encrypt SSL certificate..."

# Wait for DNS to propagate and services to be ready
print_status "Waiting for services to be ready for SSL setup..."
sleep 30

# Generate SSL certificates automatically
if certbot --nginx -d roastmyportfolio.xyz -d www.roastmyportfolio.xyz --non-interactive --agree-tos --email admin@roastmyportfolio.xyz --redirect; then
    print_status "SSL certificates generated successfully!"
    print_status "HTTPS redirect enabled automatically by certbot"
    
    # Add additional security configuration
    print_status "Adding enhanced security configuration..."
    cat >> /etc/nginx/conf.d/roastmyportfolio.conf << 'SECURITY_EOF'

# Enhanced SSL Security Settings for HTTPS server block
# This will be applied to the HTTPS server block created by certbot

# Security headers (add to location blocks)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;

# SSL Security Settings
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;
SECURITY_EOF
    
    # Reload nginx to apply changes
    systemctl reload nginx
    
    print_status "Enhanced SSL security configuration applied"
else
    print_warning "SSL certificate generation failed. You can run it manually later:"
    echo "sudo certbot --nginx -d roastmyportfolio.xyz -d www.roastmyportfolio.xyz"
fi

print_status "Creating systemd service for auto-start..."
cat > /etc/systemd/system/roastmyportfolio.service << 'EOF'
[Unit]
Description=Roast My Portfolio Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/roastmyportfolio/capybroke
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOF

systemctl enable roastmyportfolio.service

echo ""
print_status "=== DEPLOYMENT SUMMARY ==="
echo "System packages installed"
echo "Docker and Docker Compose installed"
echo "Nginx configured for roastmyportfolio.xyz"
echo "Firewall rules configured"
echo "Application directory created: $APP_DIR"
echo "Deployment script created: $APP_DIR/deploy.sh"
echo "Systemd service configured"
echo ""
print_warning "=== NEXT STEPS ==="
echo "1. Switch to ec2-user: sudo su - ec2-user"
echo "2. Upload your code to: $APP_DIR/capybroke"
echo "3. Configure your environment files"
echo "4. Run deployment: $APP_DIR/deploy.sh"
echo "5. Your site should be available at: https://roastmyportfolio.xyz"
echo ""
echo "Note: SSL certificates are automatically generated during this setup"
echo "If SSL setup failed, you can retry with:"
echo "sudo certbot --nginx -d roastmyportfolio.xyz -d www.roastmyportfolio.xyz"
echo ""
echo "Amazon Linux deployment setup completed!"
