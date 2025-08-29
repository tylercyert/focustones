#!/bin/bash

# Get local IP address
echo "🔍 Detecting your local IP address..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -n 1)
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address automatically"
    echo "Please run 'ifconfig' or 'ip addr' to find your IP manually"
    exit 1
fi

echo "✅ Your local IP address is: $LOCAL_IP"
echo ""
echo "🌐 Building and hosting FocusTones on your local network..."
echo "📱 You can access it from your phone at: http://$LOCAL_IP:3000"
echo "💻 Or from your computer at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Build and host the site
npm run host
