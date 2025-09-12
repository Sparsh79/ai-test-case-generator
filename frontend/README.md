# AI Test Case Generator - Frontend

A modern web interface for generating comprehensive test cases using AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed on your system

### Running the Application

#### Option 1: Using npm scripts (Recommended)
```bash
# Start the development server
npm run start

# Start with auto-open browser
npm run dev

# Alternative using serve
npm run serve
```

#### Option 2: Direct npx commands
```bash
# Using http-server (binds to 127.0.0.1 for better UI)
npx http-server . -p 3000 -c-1 --cors -a 127.0.0.1 -o

# Using serve
npx serve . -p 3000 --cors -l 127.0.0.1

# Using live-server (with hot reload)
npx live-server --port=3000 --host=127.0.0.1 --cors
```

The application will be available at: **http://localhost:3000**

## 🛠️ Features

- **Modern UI**: Clean, professional interface with glass morphism design
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **AI-Powered**: Generates comprehensive test cases using Meta Llama AI
- **Real-time Connection**: Live backend connection status
- **Export Options**: Copy to clipboard or download as text file
- **Example Templates**: Pre-built examples for common scenarios

## 🔧 Configuration

The frontend connects to the Spring Boot backend at:
- **Backend URL**: http://localhost:8080
- **Health Check**: http://localhost:8080/api/health
- **Generate API**: http://localhost:8080/api/generate-testcases

## 📁 Project Structure

```
frontend/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Styles with modern design
├── js/
│   └── app.js         # Application logic
├── package.json       # Node.js configuration
└── README.md         # This file
```

## 🐛 Troubleshooting

### Frontend won't start
- Ensure Node.js is installed: `node --version`
- Try alternative servers: `npm run serve` or `npm run preview`

### Backend connection issues
- Ensure Spring Boot backend is running on port 8080
- Check CORS settings if needed

### Browser issues
- Clear cache and refresh
- Check browser console for errors
- Try different browser

## 🎯 Usage

1. **Start Backend**: Ensure the Spring Boot backend is running
2. **Start Frontend**: Run `npm run dev` or `npx http-server . -p 3000 --cors`
3. **Open Browser**: Navigate to http://localhost:3000
4. **Generate Test Cases**: 
   - Enter your requirements in the input field
   - Or click on example templates
   - Click "Generate Test Cases"
   - View, copy, or download the results

## ✨ Recent Fixes

- ✅ Fixed test case display to show single test cases in individual cards
- ✅ Resolved JavaScript null reference errors
- ✅ Improved CSS containment and word wrapping
- ✅ Enhanced visual styling with proper card boundaries
- ✅ Added comprehensive error handling