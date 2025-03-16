#!/bin/bash

# Start the backend
echo "Starting the backend server..."
cd backend
python run.py &
BACKEND_PID=$!

# Wait for the backend to start
echo "Waiting for the backend to start..."
sleep 5

# Start the frontend
echo "Starting the frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

echo "Both servers are running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000 (or another port if 3000 is in use)"
echo "Press Ctrl+C to stop both servers."

# Keep the script running
wait 