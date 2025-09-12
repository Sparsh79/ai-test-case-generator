#!/bin/bash

echo "🚀 Starting AI Test Case Generator Backend..."

# Kill any existing process on port 8080
echo "📦 Checking for existing processes on port 8080..."
PID=$(lsof -ti :8080)
if [ ! -z "$PID" ]; then
    echo "⚡ Killing existing process $PID..."
    kill $PID
    sleep 2
fi

# Start the backend
echo "🌟 Starting Spring Boot application..."
cd backend
mvn spring-boot:run