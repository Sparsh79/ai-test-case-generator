#!/bin/bash

# AI Test Case Generator - Frontend NPX Launch Script

echo "🚀 Starting AI Test Case Generator Frontend with NPX..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "📥 Download from: https://nodejs.org/"
    echo ""
    echo "🔄 Falling back to Python server..."
    exec ./start-frontend.sh
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Change to frontend directory
cd "$(dirname "$0")/frontend"

echo "📦 Available NPX commands:"
echo "   npm run start    - Basic HTTP server"
echo "   npm run dev      - HTTP server with auto-open browser"
echo "   npm run serve    - Using 'serve' package"
echo "   npm run preview  - Using live-server with hot reload"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend directory"
    echo "🔄 Using direct npx command..."
    echo "🌐 Frontend will be available at: http://127.0.0.1:3000"
    echo "⚡ Press Ctrl+C to stop the server"
    echo ""
    npx http-server . -p 3000 -c-1 --cors -a 127.0.0.1 -o
else
    echo "📦 Using npm scripts from package.json..."
    echo "🌐 Frontend will be available at: http://127.0.0.1:3000"
    echo "⚡ Press Ctrl+C to stop the server"
    echo ""
    
    # Default to dev script (opens browser)
    npm run dev
fi