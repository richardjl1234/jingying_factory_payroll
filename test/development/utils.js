// Utility functions for development environment tests
// This file contains helper functions that can be used across all test files

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Pause execution for the specified milliseconds
 * @param {number} ms - Time to pause in milliseconds
 * @returns {Promise<void>}
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create screenshots directory if it doesn't exist
 * @returns {string} - Path to screenshots directory
 */
function ensureScreenshotsDir() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  return screenshotsDir;
}

/**
 * Capture a screenshot and save it to the screenshots directory
 * @param {puppeteer.Page} page - Puppeteer page object
 * @param {string} name - Screenshot name prefix
 * @returns {Promise<string>} - Path to saved screenshot
 */
async function captureScreenshot(page, name) {
  const screenshotsDir = ensureScreenshotsDir();
  const screenshotPath = path.join(screenshotsDir, `${name}_${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Capture detailed page information for debugging
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<object>} - Page information object
 */
async function capturePageInfo(page) {
  const pageInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML.substring(0, 5000), // First 5000 chars
      localStorage: JSON.stringify(localStorage),
      sessionStorage: JSON.stringify(sessionStorage),
      cookies: document.cookie,
      bodyText: document.body.innerText.substring(0, 2000), // First 2000 chars
      consoleErrors: window.consoleErrors || []
    };
  });
  return pageInfo;
}

/**
 * Launch a Puppeteer browser instance
 * @param {object} options - Puppeteer launch options
 * @returns {Promise<puppeteer.Browser>} - Puppeteer browser instance
 */
async function launchBrowser(options = {}) {
  const defaultOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  };
  
  return puppeteer.launch({ ...defaultOptions, ...options });
}

/**
 * Initialize console error tracking on the page
 * @param {puppeteer.Page} page - Puppeteer page object
 */
async function setupConsoleTracking(page) {
  await page.evaluateOnNewDocument(() => {
    window.consoleErrors = [];
    const originalConsoleError = console.error;
    console.error = function(...args) {
      window.consoleErrors.push(args.join(' '));
      originalConsoleError.apply(console, args);
    };
  });
}

/**
 * Save debug information to a JSON file
 * @param {object} debugInfo - Debug information to save
 * @param {string} testName - Name of the test for filename
 */
function saveDebugInfo(debugInfo, testName) {
  const debugDir = path.join(__dirname, 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  const debugPath = path.join(debugDir, `${testName}_debug_${Date.now()}.json`);
  fs.writeFileSync(debugPath, JSON.stringify(debugInfo, null, 2));
  console.log(`Debug information saved to: ${debugPath}`);
}

/**
 * Get error messages from the page
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<string[]>} - Array of error messages
 */
async function getErrorMessages(page) {
  return await page.evaluate(() => {
    // Look for error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .ant-message-error, .ant-alert-error');
    let errors = [];
    errorElements.forEach(el => {
      if (el.innerText && el.innerText.trim()) {
        errors.push(el.innerText.trim());
      }
    });
    
    // Also check for any text containing "失败" (failure) or "错误" (error)
    const bodyText = document.body.innerText;
    if (bodyText.includes('失败') || bodyText.includes('错误') || bodyText.includes('invalid') || bodyText.includes('Invalid')) {
      const lines = bodyText.split('\n');
      lines.forEach(line => {
        if (line.includes('失败') || line.includes('错误') || line.includes('invalid') || line.includes('Invalid')) {
          errors.push(line.trim());
        }
      });
    }
    
    return errors;
  });
}

/**
 * Set up Puppeteer page with console tracking
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 * @returns {Promise<puppeteer.Page>} - Configured page object
 */
async function setupPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await setupConsoleTracking(page);
  return page;
}

module.exports = {
  sleep,
  ensureScreenshotsDir,
  captureScreenshot,
  capturePageInfo,
  launchBrowser,
  setupConsoleTracking,
  saveDebugInfo,
  getErrorMessages,
  setupPage
};
