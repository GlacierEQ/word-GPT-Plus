#!/bin/bash

echo "==================================================="
echo "Word GPT Plus Installer"
echo "==================================================="
echo ""

# Check if running with sudo/root
if [ "$EUID" -ne 0 ]; then 
  echo "Error: This installation requires administrative privileges."
  echo "Please run this script with sudo: sudo ./install.sh"
  echo ""
  exit 1
fi

echo "Checking prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed or not in PATH."
  echo "Please install Node.js from https://nodejs.org/ and try again."
  echo ""
  exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed or not in PATH."
  echo "Please install Node.js (which includes npm) from https://nodejs.org/ and try again."
  echo ""
  exit 1
fi

# Get node and npm versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo "Node version: $NODE_VERSION"
echo "NPM version: $NPM_VERSION"
echo ""

# Create logs directory
mkdir -p "../logs"

echo "Starting installation..."
echo "Installation log will be saved to ../logs/install.log"
echo ""

# Run the Node.js installation script
node setup.