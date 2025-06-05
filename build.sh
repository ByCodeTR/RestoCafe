#!/bin/bash

echo "🚀 RestoCafe Build Script"
echo "========================="

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Install main dependencies
print_status "Installing main dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install main dependencies"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Build TypeScript to JavaScript
print_status "Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build TypeScript"
    exit 1
fi

# Go back to root directory
cd ..

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Please edit .env file with your configuration before starting the application."
    else
        print_error "env.example file not found. Please create .env file manually."
    fi
fi

print_status "Build completed successfully! 🎉"
print_status ""
print_status "Next steps:"
print_status "1. Edit .env file with your database and other configurations"
print_status "2. Run database migrations: cd backend && npx prisma migrate deploy"
print_status "3. Seed the database: cd backend && npx prisma db seed"
print_status "4. Start the application: npm start"
print_status ""
print_status "For development: npm run dev" 