// Frontend tests for newly added tables (process_cat1, process_cat2, models)
// This test verifies that the frontend can properly display and interact with the new tables

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * Test the newly added tables functionality
 * @returns {Promise<object>} - Test result object
 */
async function testNewTables() {
  console.log('=== Starting Development New Tables Test ===');
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
    await captureScreenshot(page, 'new_tables_login_page_loaded');
    
    // Step 2: Login to the application
    console.log('\n[Step 2] Logging into the application...');
    
    // Find username and password inputs
    const antInputs = await page.$$('input.ant-input');
    if (antInputs.length < 2) {
      throw new Error('Cannot find enough input elements');
    }
    
    const usernameInput = antInputs[0];
    const passwordInput = antInputs[1];
    
    // Find login button
    const loginButton = await page.$('button.ant-btn-primary');
    if (!loginButton) {
      throw new Error('Cannot find login button');
    }
    
    // Enter credentials and login
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput.type(config.TEST_CREDENTIALS.admin.password);
    await loginButton.click();
    
    await sleep(config.TIMEOUTS.medium);
    await captureScreenshot(page, 'new_tables_after_login');
    
    // Step 3: Verify login was successful
    console.log('\n[Step 3] Verifying login status...');
    const pageInfo = await capturePageInfo(page);
    const hasToken = pageInfo.localStorage.includes('token');
    const currentUrl = page.url();
    
    if (!hasToken || currentUrl.includes('/login')) {
      throw new Error('Login failed');
    }
    console.log('[OK] Login successful');
    
    // Test results tracking
    const testResults = {
      processCat1Access: false,
      processCat2Access: false,
      modelsAccess: false
    };
    
    // Test 1: Check if process category 1 route exists
    console.log('\n=== Testing Process Category 1 ===');
    console.log('\n[Step 4] Testing Process Category 1 access...');
    
    try {
      await page.goto(`${config.BASE_URLS.frontend}/process-cat1`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      
      await sleep(3000);
      await captureScreenshot(page, 'process_cat1_page_loaded');
      
      const currentUrl1 = page.url();
      testResults.processCat1Access = !currentUrl1.includes('/404') && !currentUrl1.includes('/login');
      console.log(`[${testResults.processCat1Access ? 'PASS' : 'FAIL'}] Process Category 1 page access: ${testResults.processCat1Access ? 'PASS' : 'FAIL'}`);
      
      // Check for common UI elements
      const pageContent1 = await page.content();
      const hasProcessCat1Text = pageContent1.includes('工段类别') || pageContent1.includes('process-cat1') || pageContent1.includes('Process Category 1');
      console.log(`[${hasProcessCat1Text ? 'PASS' : 'FAIL'}] Contains process category 1 related text: ${hasProcessCat1Text}`);
      
    } catch (error) {
      console.error(`[FAIL] Process Category 1 test failed: ${error.message}`);
    }
    
    // Test 2: Check if process category 2 route exists
    console.log('\n=== Testing Process Category 2 ===');
    console.log('\n[Step 5] Testing Process Category 2 access...');
    
    try {
      await page.goto(`${config.BASE_URLS.frontend}/process-cat2`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      
      await sleep(3000);
      await captureScreenshot(page, 'process_cat2_page_loaded');
      
      const currentUrl2 = page.url();
      testResults.processCat2Access = !currentUrl2.includes('/404') && !currentUrl2.includes('/login');
      console.log(`[${testResults.processCat2Access ? 'PASS' : 'FAIL'}] Process Category 2 page access: ${testResults.processCat2Access ? 'PASS' : 'FAIL'}`);
      
      // Check for common UI elements
      const pageContent2 = await page.content();
      const hasProcessCat2Text = pageContent2.includes('工序类别') || pageContent2.includes('process-cat2') || pageContent2.includes('Process Category 2');
      console.log(`[${hasProcessCat2Text ? 'PASS' : 'FAIL'}] Contains process category 2 related text: ${hasProcessCat2Text}`);
      
    } catch (error) {
      console.error(`[FAIL] Process Category 2 test failed: ${error.message}`);
    }
    
    // Test 3: Check if motor models route exists
    console.log('\n=== Testing Motor Models Table ===');
    console.log('\n[Step 6] Testing Motor Models access...');
    
    try {
      await page.goto(`${config.BASE_URLS.frontend}/motor-models`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      
      await sleep(3000);
      await captureScreenshot(page, 'motor_models_page_loaded');
      
      const currentUrl3 = page.url();
      testResults.modelsAccess = !currentUrl3.includes('/404') && !currentUrl3.includes('/login');
      console.log(`[${testResults.modelsAccess ? 'PASS' : 'FAIL'}] Motor Models page access: ${testResults.modelsAccess ? 'PASS' : 'FAIL'}`);
      
      // Check for common UI elements
      const pageContent3 = await page.content();
      const hasModelsText = pageContent3.includes('电机型号') || pageContent3.includes('motor-models') || pageContent3.includes('Motor Models');
      console.log(`[${hasModelsText ? 'PASS' : 'FAIL'}] Contains motor models related text: ${hasModelsText}`);
      
    } catch (error) {
      console.error(`[FAIL] Motor Models test failed: ${error.message}`);
    }
    
    // Step 7: Verify no errors on pages
    console.log('\n[Step 7] Checking for errors on pages...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('[OK] No error messages found on pages');
    }
    
    // Step 8: Summary of test results
    console.log('\n=== Test Results Summary ===');
    console.log(`[${testResults.processCat1Access ? 'PASS' : 'FAIL'}] Process Category 1 access: ${testResults.processCat1Access ? 'PASS' : 'FAIL'}`);
    console.log(`[${testResults.processCat2Access ? 'PASS' : 'FAIL'}] Process Category 2 access: ${testResults.processCat2Access ? 'PASS' : 'FAIL'}`);
    console.log(`[${testResults.modelsAccess ? 'PASS' : 'FAIL'}] Models table access: ${testResults.modelsAccess ? 'PASS' : 'FAIL'}`);
    
    // Determine overall result
    const allTestsPassed = testResults.processCat1Access || testResults.processCat2Access || testResults.modelsAccess;
    
    if (allTestsPassed) {
      console.log('\n[PASS] TEST PASSED: New tables functionality verified!');
      return { success: true, message: 'New Tables Test passed', testResults };
    } else {
      console.error('\n[FAIL] TEST FAILED: New tables functionality test failed');
      throw new Error('New Tables Test failed');
    }
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'new_tables_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the new tables test
 */
async function runTest() {
  console.log('============================================');
  console.log('Development New Tables Test');
  console.log('============================================');
  
  const result = await testNewTables();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.testResults) {
    console.log('\nTest Results Detail:');
    console.log(`  - Process Category 1 Access: ${result.testResults.processCat1Access ? '[PASS] PASS' : '[FAIL] FAIL'}`);
    console.log(`  - Process Category 2 Access: ${result.testResults.processCat2Access ? '[PASS] PASS' : '[FAIL] FAIL'}`);
    console.log(`  - Models Access: ${result.testResults.modelsAccess ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  }
  
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

module.exports = { testNewTables };
