@echo off
echo 🚀 RestoCafe Build Script for Windows
echo =====================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

:: Install main dependencies
echo [INFO] Installing main dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install main dependencies
    pause
    exit /b 1
)

:: Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

:: Generate Prisma client
echo [INFO] Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

:: Build TypeScript to JavaScript
echo [INFO] Building TypeScript...
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build TypeScript
    pause
    exit /b 1
)

:: Go back to root directory
cd ..

:: Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from example...
    if exist "env.example" (
        copy env.example .env
        echo [WARNING] Please edit .env file with your configuration before starting the application.
    ) else (
        echo [ERROR] env.example file not found. Please create .env file manually.
    )
)

echo [INFO] Build completed successfully! 🎉
echo.
echo [INFO] Next steps:
echo [INFO] 1. Edit .env file with your database and other configurations
echo [INFO] 2. Run database migrations: cd backend && npx prisma migrate deploy
echo [INFO] 3. Seed the database: cd backend && npx prisma db seed
echo [INFO] 4. Start the application: npm start
echo.
echo [INFO] For development: npm run dev
echo.
pause 