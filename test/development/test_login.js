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
    
    // Step 3: Find login form elements
    console.log('\n[Step 3] Finding login form elements...');
    
    let usernameInput = null;
    let passwordInput = null;
    let loginButton = null;
    
    // Method 1: Try Ant Design inputs
    const antInputs = await page.$$('input.ant-input');
    if (antInputs.length >= 2) {
      usernameInput = antInputs[0];
      passwordInput = antInputs[1];
      console.log('✓ Found Ant Design inputs');
    }
    
    // Method 2: Try by placeholder
    if (!usernameInput || !passwordInput) {
      const allInputs = await page.$$('input');
      for (const input of allInputs) {
        const placeholder = await page.evaluate(el => el.placeholder, input);
        const type = await page.evaluate(el => el.type, input);
        
        if (placeholder && (placeholder.toLowerCase().includes('user') || 
                           placeholder.toLowerCase().includes('name') ||
                           placeholder.toLowerCase().includes('用户名'))) {
          usernameInput = input;
        } else if (type === 'password') {
          passwordInput = input;
        }
      }
      if (usernameInput || passwordInput) {
        console.log('✓ Found inputs by placeholder/type');
      }
    }
    
    // Method 3: Try any input
    if (!usernameInput || !passwordInput) {
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        usernameInput = inputs[0];
        passwordInput = inputs[1];
        console.log('✓ Found inputs by position');
      }
    }
    
    if (!usernameInput) {
      console.error('✗ ERROR: Could not find username input');
      console.error('Available inputs:', await page.$$eval('input', inputs => inputs.map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        className: i.className,
        id: i.id,
        name: i.name
      }))));
      throw new Error('Username input not found');
    }
    
    if (!passwordInput) {
      console.error('✗ ERROR: Could not find password input');
      console.error('Available inputs:', await page.$$eval('input', inputs => inputs.map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        className: i.className
      }))));
      throw new Error('Password input not found');
    }
    
    // Find login button
    // Method 1: Ant Design primary button
    const primaryButtons = await page.$$('button.ant-btn-primary');
    if (primaryButtons.length > 0) {
      loginButton = primaryButtons[0];
      console.log('✓ Found Ant Design primary button');
    }
    
    // Method 2: Button with login text
    if (!loginButton) {
      const loginButtons = await page.$x("//button[contains(text(), '登录')]");
      if (loginButtons.length > 0) {
        loginButton = loginButtons[0];
        console.log('✓ Found button with "登录" text');
      }
    }
    
    // Method 3: Button with type submit
    if (!loginButton) {
      const submitButtons = await page.$$('button[type="submit"]');
      if (submitButtons.length > 0) {
        loginButton = submitButtons[0];
        console.log('✓ Found submit button');
      }
    }
    
    // Method 4: Any button
    if (!loginButton) {
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        loginButton = buttons[buttons.length - 1];
        console.log('✓ Found any button (last one)');
      }
    }
    
    if (!loginButton) {
      console.error('✗ ERROR: Could not find login button');
      console.error('Available buttons:', await page.$$eval('button', buttons => buttons.map(b => ({
        text: b.innerText,
        type: b.type,
        className: b.className
      }))));
      throw new Error('Login button not found');
    }
    
    // Step 4: Enter credentials
    console.log('\n[Step 4] Entering credentials...');
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput.type(config.TEST_CREDENTIALS.admin.password);
    console.log('✓ Credentials entered');
    
    await captureScreenshot(page, 'credentials_entered');
    
    // Step 5: Click login button
    console.log('\n[Step 5] Clicking login button...');
    await loginButton.click();
    console.log('✓ Login button clicked');
    
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
      console.error('✗ ERROR: Found error messages on page:');
      errorText.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    }
    
    // Determine test result
    if (currentUrl.includes('/login') || currentUrl.endsWith('/login')) {
      console.error('\n✗ TEST FAILED: Still on login page');
      
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
      console.warn('⚠️ WARNING: Not on login page but no token found in storage');
      console.log('✓ TEST PARTIALLY PASSED: Navigated away from login page');
      return { success: true, message: 'Navigated from login page but no token found' };
    } else {
      console.log('\n✅ TEST PASSED: Successfully logged in!');
      console.log(`  - Redirected to: ${currentUrl}`);
      console.log(`  - Token found in storage: YES`);
      return { success: true, message: 'Login successful' };
    }
    
  } catch (error) {
    console.error('\n✗ TEST FAILED WITH EXCEPTION:', error.message);
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
  console.log(`Status: ${result.success ? '✅ PASS' : '✗ FAIL'}`);
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
