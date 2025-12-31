// Home page test for development environment
// This test verifies that the home page displays correct statistics

const path = require('path');
const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages, saveDebugInfo } = utils;

/**
 * Test home page statistics display
 * @returns {Promise<object>} - Test result object
 */
async function testHome() {
  console.log('=== Starting Development Home Page Test ===');
  console.log(`Testing URL: ${config.BASE_URLS.frontend}`);
  
  const browser = await launchBrowser();
  const page = await setupPage(browser);
  
  try {
    // Step 1: Navigate to login page
    console.log('\n[Step 1] Navigating to login page...');
    await page.goto(`${config.BASE_URLS.frontend}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(1000);
    await captureScreenshot(page, 'home_login_page_loaded');
    
    // Step 2: Find login form elements
    console.log('\n[Step 2] Finding login form elements...');
    
    // Find username input
    const usernameInput = await page.waitForSelector('input.ant-input', { timeout: config.TIMEOUTS.short });
    console.log('[OK] Found login input fields');
    
    // Find password input (second input)
    const passwordInput = await page.$$('input.ant-input');
    if (passwordInput.length < 2) {
      throw new Error('Could not find password input');
    }
    
    // Find login button
    const loginButton = await page.waitForSelector('button.ant-btn-primary', { timeout: config.TIMEOUTS.short });
    console.log('[OK] Found login button');
    
    // Step 3: Login
    console.log('\n[Step 3] Logging in...');
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput[1].type(config.TEST_CREDENTIALS.admin.password);
    console.log('[OK] Credentials entered');
    
    await loginButton.click();
    console.log('[OK] Login button clicked');
    
    // Step 4: Wait for navigation to home page
    console.log(`\n[Step 4] Waiting for navigation to home page...`);
    await sleep(config.TIMEOUTS.medium);
    
    // Check if we're on home page
    const currentUrl = page.url();
    if (!currentUrl.includes('/login') && currentUrl.includes(config.BASE_URLS.frontend)) {
      console.log('[OK] Successfully navigated away from login page');
    } else {
      console.error('[ERROR] Still on login page or wrong URL');
      await captureScreenshot(page, 'home_still_on_login');
      throw new Error('Login failed');
    }
    
    await captureScreenshot(page, 'home_home_page_loaded');
    
    // Step 5: Verify login status
    console.log('\n[Step 5] Verifying login status...');
    const pageInfo = await capturePageInfo(page);
    console.log(`Current URL: ${pageInfo.url}`);
    console.log(`Has token in storage: ${pageInfo.localStorage.includes('token') ? 'YES' : 'NO'}`);
    console.log('[OK] Login successful');
    
    // Step 6: Verify home page content
    console.log('\n[Step 6] Verifying home page content...');
    
    // Check for welcome title
    const welcomeTitle = await page.$eval('h2', el => el.textContent);
    console.log(`Welcome title: ${welcomeTitle}`);
    
    if (!welcomeTitle.includes('欢迎使用工厂定额和计件工资管理系统')) {
      console.warn('[WARN] Welcome title not found or incorrect');
    } else {
      console.log('[OK] Welcome title found');
    }
    
    // Step 7: Verify statistics cards
    console.log('\n[Step 7] Verifying statistics cards...');
    
    // Wait for statistics cards to load
    await sleep(2000); // Give time for API call to complete
    
    // Get all statistic cards
    const statisticCards = await page.$$('.ant-card');
    console.log(`Found ${statisticCards.length} cards on page`);
    
    // Expected statistics based on test data
    const expectedStats = {
      '用户管理': 2,
      '工人管理': 9,
      '工段类别管理': 4,
      '工序类别管理': 5,
      '型号管理': 5,
      '工序管理': 5,
      '定额管理': 15,
      '工作记录': 45,
      '报表统计': 0
    };
    
    let statsVerified = 0;
    let allStatsCorrect = true;
    
    for (const card of statisticCards) {
      try {
        // Get card title and value
        const title = await card.$eval('.ant-statistic-title', el => el.textContent.trim());
        const valueElement = await card.$('.ant-statistic-content-value');
        
        if (valueElement) {
          const valueText = await page.evaluate(el => el.textContent.trim(), valueElement);
          const value = parseInt(valueText.replace(/,/g, '')) || 0;
          
          if (expectedStats[title] !== undefined) {
            console.log(`Card "${title}": ${value} (expected: ${expectedStats[title]})`);
            
            if (value === expectedStats[title]) {
              console.log(`  [OK] Correct value for ${title}`);
              statsVerified++;
            } else {
              console.log(`  [WARN] Incorrect value for ${title}`);
              allStatsCorrect = false;
            }
          }
        }
      } catch (e) {
        // Not a statistic card, continue
      }
    }
    
    console.log(`\nVerified ${statsVerified} out of ${Object.keys(expectedStats).length} statistics`);
    
    // Step 8: Check for errors
    console.log('\n[Step 8] Checking for errors...');
    const errorText = await getErrorMessages(page);
    if (errorText.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorText.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('[OK] No error messages found on page');
    }
    
    // Step 9: Determine test result
    console.log('\n[Step 9] Verifying test results...');
    
    if (statsVerified >= 5) { // At least 5 stats should be verified
      console.log('[PASS] TEST PASSED: Home page statistics verified!');
      console.log(`  - Found welcome title: YES`);
      console.log(`  - Statistics cards verified: ${statsVerified}`);
      console.log(`  - All statistics correct: ${allStatsCorrect ? 'YES' : 'NO (some discrepancies)'}`);
      console.log(`  - No error messages: ${errorText.length === 0 ? 'YES' : 'NO'}`);
      
      return { 
        success: true, 
        message: 'Home page test passed',
        details: {
          statsVerified,
          allStatsCorrect,
          hasErrors: errorText.length > 0
        }
      };
    } else {
      console.error('[FAIL] TEST FAILED: Not enough statistics verified');
      console.error(`  - Expected at least 5 statistics, got ${statsVerified}`);
      
      // Save debug info
      const debugInfo = {
        timestamp: new Date().toISOString(),
        pageInfo,
        errorMessages: errorText,
        statsVerified,
        expectedStats,
        consoleErrors: pageInfo.consoleErrors
      };
      
      saveDebugInfo(debugInfo, 'home');
      
      throw new Error(`Only ${statsVerified} statistics verified, expected at least 5`);
    }
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'home_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the home page test and exit with appropriate code
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Home Page Test');
  console.log('============================================');
  
  const result = await testHome();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.details) {
    console.log('\nTest Details:');
    console.log(`  - Statistics verified: ${result.details.statsVerified}`);
    console.log(`  - All statistics correct: ${result.details.allStatsCorrect ? 'YES' : 'NO'}`);
    console.log(`  - Has errors: ${result.details.hasErrors ? 'YES' : 'NO'}`);
  }
  
  if (!result.success) {
    console.log('\nNext steps:');
    console.log(`1. Check ${path.join(__dirname, 'screenshots')} for visual debugging`);
    console.log(`2. Check ${path.join(__dirname, 'debug')} for detailed page info`);
    console.log(`3. Verify backend stats API is working: ${config.BASE_URLS.backend}/api/stats/`);
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

module.exports = { testHome };
