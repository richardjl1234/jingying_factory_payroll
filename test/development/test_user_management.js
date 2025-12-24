// User management test for development environment
// This test verifies that users can manage user accounts in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * Test user management functionality
 * @returns {Promise<object>} - Test result object
 */
async function testUserManagement() {
  console.log('=== Starting Development User Management Test ===');
  console.log(`Testing URL: ${config.BASE_URLS.frontend}`);
  
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
    await captureScreenshot(page, 'user_management_login_page_loaded');
    
    // Step 2: Find login form elements
    console.log('\n[Step 2] Finding login form elements...');
    
    // Find username and password inputs
    const antInputs = await page.$$('input.ant-input');
    if (antInputs.length < 2) {
      throw new Error('Cannot find enough input elements');
    }
    
    const usernameInput = antInputs[0];
    const passwordInput = antInputs[1];
    console.log('[OK] Found login input fields');
    
    // Find login button
    const loginButton = await page.$('button.ant-btn-primary');
    if (!loginButton) {
      throw new Error('Cannot find login button');
    }
    console.log('[OK] Found login button');
    
    // Step 3: Enter credentials and login
    console.log('\n[Step 3] Logging in...');
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput.type(config.TEST_CREDENTIALS.admin.password);
    console.log('[OK] Credentials entered');
    
    await loginButton.click();
    console.log('[OK] Login button clicked');
    
    // Step 4: Wait for navigation to home page
    console.log('\n[Step 4] Waiting for navigation to home page...');
    await sleep(config.TIMEOUTS.medium);
    
    await captureScreenshot(page, 'user_management_home_page');
    
    // Step 5: Check if login was successful
    console.log('\n[Step 5] Verifying login status...');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    const pageInfo = await capturePageInfo(page);
    const hasToken = pageInfo.localStorage.includes('token');
    console.log(`Has token in storage: ${hasToken ? 'YES' : 'NO'}`);
    
    if (!hasToken || currentUrl.includes('/login')) {
      throw new Error('Login failed');
    }
    console.log('[OK] Login successful');
    
    // Step 6: Navigate to user management page
    console.log('\n[Step 6] Navigating to user management page...');
    await page.goto(`${config.BASE_URLS.frontend}/users`, {
      waitUntil: 'networkidle0',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(3000);
    await captureScreenshot(page, 'user_management_page_loaded');
    
    // Step 7: Verify user management page content
    console.log('\n[Step 7] Verifying user management page content...');
    
    // Check if page contains user management elements
    const pageContent = await page.content();
    const hasUserManagementText = pageContent.includes('用户管理') || pageContent.includes('User Management');
    const hasAddUserButton = pageContent.includes('添加用户') || pageContent.includes('Add User');
    
    console.log(`Has user management text: ${hasUserManagementText}`);
    console.log(`Has add user button: ${hasAddUserButton}`);
    
    // Check if there are user rows in the table
    const userRows = await page.$$eval('table tr', rows => rows.length);
    console.log(`User table rows: ${userRows}`);
    
    // Step 8: Check for errors
    console.log('\n[Step 8] Checking for errors...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    }
    
    // Determine test result
    if (hasUserManagementText && hasAddUserButton && userRows > 0) {
      console.log('\n[PASS] TEST PASSED: User management functionality verified!');
      console.log(`  - Found user management text: ${hasUserManagementText ? 'YES' : 'NO'}`);
      console.log(`  - Found add user button: ${hasAddUserButton ? 'YES' : 'NO'}`);
      console.log(`  - User table rows: ${userRows}`);
      return { success: true, message: 'User management test passed' };
    } else {
      console.error('\n[FAIL] TEST FAILED: User management functionality not fully verified!');
      throw new Error('User management test failed - missing expected elements');
    }
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'user_management_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the user management test
 */
async function runTest() {
  console.log('============================================');
  console.log('Development User Management Test');
  console.log('============================================');
  
  const result = await testUserManagement();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (!result.success) {
    console.log('\nNext steps:');
    console.log('1. Check screenshots for visual debugging');
    console.log('2. Verify frontend is running on', config.BASE_URLS.frontend);
    console.log('3. Verify backend is running on', config.BASE_URLS.backend);
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

module.exports = { testUserManagement };
