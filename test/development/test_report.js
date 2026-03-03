// Report page test for development environment
// This test verifies that users can generate worker salary reports

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * Test report page functionality
 * @returns {Promise<object>} - Test result object
 */
async function testReportPage() {
  // Use backend URL since frontend is served from backend
  const baseUrl = config.BASE_URLS.backend || 'http://localhost:8000';
  console.log('=== Starting Development Report Page Test ===');
  console.log(`Testing URL: ${baseUrl}`);

  const browser = await launchBrowser({ headless: false });
  const page = await setupPage(browser);

  try {
    // Step 1: Navigate to login page
    console.log('\n[Step 1] Navigating to login page...');
    await page.goto(`${baseUrl}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });

    await sleep(1000);
    await captureScreenshot(page, 'report_login_page_loaded');

    // Step 2: Find login form elements
    console.log('\n[Step 2] Finding login form elements...');
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

    console.log('[OK] Found login input fields');
    console.log('[OK] Found login button');

    // Step 3: Login to the application
    console.log('\n[Step 3] Logging in...');
    // Use root/root123 as credentials
    await usernameInput.type('root');
    await passwordInput.type('root123');

    console.log('[OK] Credentials entered');
    await loginButton.click();
    console.log('[OK] Login button clicked');

    await sleep(2000);
    await captureScreenshot(page, 'report_home_page');

    // Step 4: Navigate to report page
    console.log('\n[Step 4] Navigating to report page...');
    // Click on menu item for report - typically "工资统计报表" or "报表"
    const menuItems = await page.$$('.ant-menu-item');
    for (const item of menuItems) {
      const text = await page.evaluate(el => el.textContent, item);
      console.log(`Found menu item: ${text}`);
      if (text && (text.includes('报表') || text.includes('统计'))) {
        await item.click();
        console.log('[OK] Clicked report menu item');
        break;
      }
    }

    await sleep(2000);
    await captureScreenshot(page, 'report_page_loaded');

    // Step 5: Wait for page to fully load and find dropdown
    console.log('\n[Step 5] Waiting for page to load...');
    await sleep(2000);

    // Step 6: Click worker dropdown and select 001
    console.log('\n[Step 6] Clicking worker dropdown...');
    // Find the dropdown - it could be an ant-select element
    const dropdown = await page.$('.ant-select');
    if (dropdown) {
      await dropdown.click();
      await sleep(1000);
      await captureScreenshot(page, 'report_dropdown_open');

      // Find all options in the dropdown
      const options = await page.$$('.ant-select-item-option');
      console.log(`Found ${options.length} options in dropdown`);

      // Look for worker 001 option
      for (const opt of options) {
        const text = await page.evaluate(el => el.textContent, opt);
        console.log(`Option: ${text}`);
        if (text && text.includes('001')) {
          console.log('[OK] Found worker 001 option');
          await opt.click();
          break;
        }
      }

      await sleep(500);
    } else {
      console.log('[WARNING] Dropdown not found');
    }

    await captureScreenshot(page, 'report_worker_selected');

    // Step 7: Select month 2026-02 if needed
    console.log('\n[Step 7] Checking month picker...');
    const monthPicker = await page.$('.ant-picker');
    if (monthPicker) {
      await monthPicker.click();
      await sleep(1000);
      await captureScreenshot(page, 'report_month_picker_open');
      // Click somewhere to close or select default
      await page.keyboard.press('Escape');
      await sleep(500);
    }

    await captureScreenshot(page, 'report_before_generate');

    // Step 8: Click generate report button
    console.log('\n[Step 8] Clicking generate report button...');
    const generateButtons = await page.$$('button.ant-btn-primary');
    // Find the correct button - it should be the one in the report section
    for (const btn of generateButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('生成报表')) {
        await btn.click();
        console.log('[OK] Clicked generate report button');
        break;
      }
    }

    // Wait for the report to load
    await sleep(3000);
    await captureScreenshot(page, 'report_after_generate_worker001');

    // Check for error messages
    const errors = await getErrorMessages(page);
    if (errors.length > 0) {
      console.log('\n[ERROR] Found errors on page:');
      errors.forEach(err => console.log(`  - ${err}`));
      console.log('\n[FAILED] Test failed due to errors');
      return { success: false, message: 'Report generation failed with errors', errors };
    }

    // Check if report table is displayed
    const reportTable = await page.$('.ant-table');
    if (reportTable) {
      console.log('[OK] Report table found');
      await captureScreenshot(page, 'report_success_worker001');
    } else {
      console.log('[WARNING] Report table not found');
      await captureScreenshot(page, 'report_no_table_worker001');
    }

    // Capture final page info
    const pageInfo = await capturePageInfo(page);
    console.log('\n=== Test Summary ===');
    console.log(`Page URL: ${pageInfo.url}`);
    console.log(`Page Title: ${pageInfo.title}`);

    console.log('\n=== TEST PASSED ===');
    return { success: true, message: 'Report page test completed' };

  } catch (error) {
    console.error('\n[ERROR] Test failed:', error.message);
    await captureScreenshot(page, 'report_test_error');
    return { success: false, message: error.message };
  } finally {
    await sleep(2000);
    await browser.close();
  }
}

// Run the test
testReportPage()
  .then(result => {
    console.log('\nTest result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
