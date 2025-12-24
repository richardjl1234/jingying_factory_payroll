// Login test for development environment
// This test verifies that users can successfully log in to the application

const path = require('path');
const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages, saveDebugInfo } = utils;

/**
 * Test basic login functionality
 * @returns {Promise<object>} - Test result object
 */
async function testLogin() {
  console.log('=== Starting Development Login Test ===');
  console.log(`Testing URL: ${config.BASE_URLS.frontend}/login`);
  console.log(`Credentials: ${config.TEST_CREDENTIALS.admin.username} / ${config.TEST_CREDENTIALS.admin.password}`);
  
  const browser = await launchBrowser();
  const page = await setupPage(browser);
  
  try {
    // Step 1: Navigate to login page
    console.log('\n[Step 1] Navigating to login page...');
    await page.goto(`${config.BASE_URLS.frontend}/login`, {
      waitUntil: 'networkidle0',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(3000);
    await captureScreenshot(page, 'login_page_loaded');
    
    // Step 2: Analyze page structure
    console.log('\n[Step 2] Analyzing page structure...');
    const pageInfo = await capturePageInfo(page);
    console.log(`Current URL: ${pageInfo.url}`);
    console.log(`Page title: ${pageInfo.title}`);
    console.log(`Has token in storage: ${pageInfo.localStorage.includes('token') ? 'YES' : 'NO'}`);
    
    // Step 3: Wait for login form and find elements
    console.log('\n[Step 3] Waiting for login form elements...');
    
    // Wait for the login form to be present
    try {
      await page.waitForSelector('form[name="login"]', { timeout: config.TIMEOUTS.short });
      console.log('[OK] Login form found');
    } catch (e) {
      console.log('Form not found by name, trying other selectors...');
      await page.waitForSelector('form', { timeout: config.TIMEOUTS.short });
      console.log('[OK] Found a form element');
    }
    
    // Wait for input fields with multiple possible selectors
    const inputSelectors = [
      'input.ant-input',
      'input[placeholder*="用户"]',
      'input[placeholder*="name"]',
      'input[placeholder*="Name"]',
      'input[type="text"]',
      'input'
    ];
    
    let usernameInput = null;
    let passwordInput = null;
    
    for (const selector of inputSelectors) {
      const inputs = await page.$$(selector);
      if (inputs.length >= 2) {
        // Try to identify which is username and which is password
        for (const input of inputs) {
          const type = await page.evaluate(el => el.type, input);
          const placeholder = await page.evaluate(el => el.placeholder, input);
          
          if (type === 'password') {
            passwordInput = input;
          } else if (placeholder && (placeholder.includes('用户') || placeholder.toLowerCase().includes('name'))) {
            usernameInput = input;
          } else if (!usernameInput && type !== 'password') {
            usernameInput = input;
          }
        }
        
        if (usernameInput && passwordInput) {
          console.log(`[OK] Found inputs using selector: ${selector}`);
          break;
        }
      }
    }
    
    // If still not found, try to find by position
    if (!usernameInput || !passwordInput) {
      const allInputs = await page.$$('input');
      if (allInputs.length >= 2) {
        usernameInput = allInputs[0];
        // Find password input by type
        for (const input of allInputs) {
          const type = await page.evaluate(el => el.type, input);
          if (type === 'password') {
            passwordInput = input;
            break;
          }
        }
        if (!passwordInput && allInputs.length > 1) {
          passwordInput = allInputs[1];
        }
        console.log('[OK] Found inputs by position');
      }
    }
    
    if (!usernameInput) {
      console.error('[ERROR] Could not find username input');
      // Take screenshot for debugging
      await captureScreenshot(page, 'debug_no_username_input');
      const allInputs = await page.$$eval('input', inputs => inputs.map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        className: i.className,
        id: i.id,
        name: i.name,
        outerHTML: i.outerHTML.substring(0, 200)
      })));
      console.error('Available inputs:', JSON.stringify(allInputs, null, 2));
      throw new Error('Username input not found');
    }
    
    if (!passwordInput) {
      console.error('[ERROR] Could not find password input');
      await captureScreenshot(page, 'debug_no_password_input');
      const allInputs = await page.$$eval('input', inputs => inputs.map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        className: i.className
      })));
      console.error('Available inputs:', JSON.stringify(allInputs, null, 2));
      throw new Error('Password input not found');
    }
    
    // Find login button
    let loginButton = null;
    const buttonSelectors = [
      'button.ant-btn-primary',
      'button[type="submit"]',
      'button',
      'input[type="submit"]'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          // Prefer buttons with text "Login", "登录", or primary style
          for (const button of buttons) {
            const buttonText = await page.evaluate(el => el.textContent || el.value || '', button);
            if (buttonText.includes('Login') || buttonText.includes('登录') || selector === 'button.ant-btn-primary') {
              loginButton = button;
              console.log(`[OK] Found login button using selector: ${selector}`);
              break;
            }
          }
          if (loginButton) break;
          // Otherwise take the first button
          loginButton = buttons[0];
          console.log(`[OK] Found a button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue with next selector
      }
    }
    
    // Also try XPath for login text
    if (!loginButton) {
      try {
        const loginButtons = await page.$x(`//button[contains(text(), 'Login') or contains(text(), '登录')]`);
        if (loginButtons.length > 0) {
          loginButton = loginButtons[0];
          console.log(`[OK] Found login button using XPath`);
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!loginButton) {
      console.error('[ERROR] Could not find login button');
      const allButtons = await page.$$eval('button', buttons => buttons.map(b => ({
        text: b.textContent,
        type: b.type,
        className: b.className,
        outerHTML: b.outerHTML.substring(0, 200)
      })));
      console.error('Available buttons:', JSON.stringify(allButtons, null, 2));
      throw new Error('Login button not found');
    }
    
    // Step 4: Enter credentials
    console.log('\n[Step 4] Entering credentials...');
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput.type(config.TEST_CREDENTIALS.admin.password);
    console.log('[OK] Credentials entered');
    
    await captureScreenshot(page, 'credentials_entered');
    
    // Step 5: Click login button
    console.log('\n[Step 5] Clicking login button...');
    await loginButton.click();
    console.log('[OK] Login button clicked');
    
    // Step 6: Wait for navigation
    console.log(`\n[Step 6] Waiting for navigation (${config.TIMEOUTS.medium / 1000} seconds)...`);
    await sleep(config.TIMEOUTS.medium);
    
    await captureScreenshot(page, 'after_login_click');
    
    // Step 7: Check login result
    console.log('\n[Step 7] Checking login result...');
    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    const pageInfoAfter = await capturePageInfo(page);
    const hasToken = pageInfoAfter.localStorage.includes('token');
    console.log(`Has token in storage: ${hasToken ? 'YES' : 'NO'}`);
    
    // Check for error messages on page
    const errorText = await getErrorMessages(page);
    if (errorText.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorText.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    }
    
    // Determine test result
    if (currentUrl.includes('/login') || currentUrl.endsWith('/login')) {
      console.error('\n[FAIL] TEST FAILED: Still on login page');
      
      // Save detailed debug info
      const debugInfo = {
        timestamp: new Date().toISOString(),
        initialPageInfo: pageInfo,
        afterLoginPageInfo: pageInfoAfter,
        errorMessages: errorText,
        consoleErrors: pageInfoAfter.consoleErrors,
        screenshots: {
          loginPage: await captureScreenshot(page, 'debug_login_page'),
          afterClick: await captureScreenshot(page, 'debug_after_click')
        }
      };
      
      saveDebugInfo(debugInfo, 'login');
      
      throw new Error('Login failed - still on login page');
    } else if (!hasToken) {
      console.warn('[WARN] Not on login page but no token found in storage');
      console.log('[OK] TEST PARTIALLY PASSED: Navigated away from login page');
      return { success: true, message: 'Navigated from login page but no token found' };
    } else {
      console.log('\n[PASS] TEST PASSED: Successfully logged in!');
      console.log(`  - Redirected to: ${currentUrl}`);
      console.log(`  - Token found in storage: YES`);
      return { success: true, message: 'Login successful' };
    }
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the login test and exit with appropriate code
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Login Test');
  console.log('============================================');
  
  const result = await testLogin();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (!result.success) {
    console.log('\nNext steps:');
    console.log(`1. Check ${path.join(__dirname, 'screenshots')} for visual debugging`);
    console.log(`2. Check ${path.join(__dirname, 'debug')} for detailed page info`);
    console.log(`3. Verify backend is running on ${config.BASE_URLS.backend}`);
    console.log(`4. Verify frontend is running on ${config.BASE_URLS.frontend}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run test if called directly
if (require.main === module) {
  runTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testLogin };
