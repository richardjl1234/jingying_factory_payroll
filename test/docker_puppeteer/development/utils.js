// Utility functions for development environment tests
// This file contains helper functions that can be used across all test files

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Pause execution for the specified milliseconds
 * @param {number} ms - Time