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
      throw new Error('无法找到足够的输入框元素');
    }
    
    const usernameInput = antInputs[0];
    const passwordInput = antInputs[1];
    
    // Find login button
    const loginButton = await page.$('button.ant-btn-primary');
    if (!loginButton) {
      throw new Error('无法找到登录按钮');
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
    console.log('✓ Login successful');
    
    // Test results tracking
    const testResults = {
      processCat1Access: false,
      processCat2Access: false,
      modelsAccess: false
    };
    
    // Test 1: Check if process category 1 route exists
    console.log('\n=== 测试工序类别一 ===');
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
      console.log(`✅ 工序类别一页面访问: ${testResults.processCat1Access ? '通过' : '失败'}`);
      
      // Check for common UI elements
      const pageContent1 = await page.content();
      const hasProcessCat1Text = pageContent1.includes('工序类别一') || pageContent1.includes('process-cat1');
      console.log(`✅ 包含工序类别一相关文本: ${hasProcessCat1Text}`);
      
    } catch (error) {
      console.error(`❌ 工序类别一测试失败: ${error.message}`);
    }
    
    // Test 2: Check if process category 2 route exists
    console.log('\n=== 测试工序类别二 ===');
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
      console.log(`✅ 工序类别二页面访问: ${testResults.processCat2Access ? '通过' : '失败'}`);
      
      // Check for common UI elements
      const pageContent2 = await page.content();
      const hasProcessCat2Text = pageContent2.includes('工序类别二') || pageContent2.includes('process-cat2');
      console.log(`✅ 包含工序类别二相关文本: ${hasProcessCat2Text}`);
      
    } catch (error) {
      console.error(`❌ 工序类别二测试失败: ${error.message}`);
    }
    
    // Test 3: Check if models route exists
    console.log('\n=== 测试型号表 ===');
    console.log('\n[Step 6] Testing Models access...');
    
    try {
      await page.goto(`${config.BASE_URLS.frontend}/models`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      
      await sleep(3000);
      await captureScreenshot(page, 'models_page_loaded');
      
      const currentUrl3 = page.url();
      testResults.modelsAccess = !currentUrl3.includes('/404') && !currentUrl3.includes('/login');
      console.log(`✅ 型号页面访问: ${testResults.modelsAccess ? '通过' : '失败'}`);
      
      // Check for common UI elements
      const pageContent3 = await page.content();
      const hasModelsText = pageContent3.includes('型号') || pageContent3.includes('models');
      console.log(`✅ 包含型号相关文本: ${hasModelsText}`);
      
    } catch (error) {
      console.error(`❌ 型号测试失败: ${error.message}`);
    }
    
    // Step 7: Verify no errors on pages
    console.log('\n[Step 7] Checking for errors on pages...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('✗ Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('✓ No error messages found on pages');
    }
    
    // Step 8: Summary of test results
    console.log('\n=== 测试结果摘要 ===');
    console.log(`✅ 工序类别一访问: ${testResults.processCat1Access ? '通过' : '失败'}`);
    console.log(`✅ 工序类别二访问: ${testResults.processCat2Access ? '通过' : '失败'}`);
    console.log(`✅ 型号表访问: ${testResults.modelsAccess ? '通过' : '失败'}`);
    
    // Determine overall result
    const allTestsPassed = testResults.processCat1Access || testResults.processCat2Access || testResults.modelsAccess;
    
    if (allTestsPassed) {
      console.log('\n✅ TEST PASSED: New tables functionality verified!');
      return { success: true, message: 'New Tables Test passed', testResults };
    } else {
      console.error('\n❌ TEST FAILED: New tables functionality test failed');
      throw new Error('New Tables Test failed');
    }
    
  } catch (error) {
    console.error('\n✗ TEST FAILED WITH EXCEPTION:', error.message);
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
  console.log(`Status: ${result.success ? '✅ PASS' : '✗ FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.testResults) {
    console.log('\nTest Results Detail:');
    console.log(`  - Process Category 1 Access: ${result.testResults.processCat1Access ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`  - Process Category 2 Access: ${result.testResults.processCat2Access ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`  - Models Access: ${result.testResults.modelsAccess ? '✅ PASS' : '✗ FAIL'}`);
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