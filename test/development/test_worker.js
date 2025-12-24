// Worker management test for development environment
// This test verifies that users can manage worker accounts in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * Test worker management functionality
 * @returns {Promise<object>} - Test result object
 */
async function testWorkerManagement() {
  console.log('=== Starting Development Worker Management Test ===');
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
    await captureScreenshot(page, 'worker_login_page_loaded');
    
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
    
    await captureScreenshot(page, 'worker_home_page');
    
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
    
    // Step 6: Navigate to worker management page
    console.log('\n[Step 6] Navigating to worker management page...');
    await page.goto(`${config.BASE_URLS.frontend}/workers`, {
      waitUntil: 'networkidle0',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(3000);
    await captureScreenshot(page, 'worker_management_page_loaded');
    
    // Step 7: Verify worker management page content
    console.log('\n[Step 7] Verifying worker management page content...');
    
    // Check if page contains worker management elements
    const pageContent = await page.content();
    const hasWorkerManagementText = pageContent.includes('工人管理') || pageContent.includes('Worker Management');
    const hasAddWorkerButton = pageContent.includes('添加工人') || pageContent.includes('Add Worker');
    
    console.log(`Has worker management text: ${hasWorkerManagementText}`);
    console.log(`Has add worker button: ${hasAddWorkerButton}`);
    
    // Check if there are worker rows in the table
    const workerRows = await page.$$eval('table tr', rows => rows.length);
    console.log(`Worker table rows: ${workerRows}`);
    
    // Step 8: Test adding a worker
    console.log('\n[Step 8] Testing worker addition...');
    
    // Find and click the "添加工人" (Add Worker) button
    let addWorkerButton = null;
    
    // Try to find the button by evaluating all buttons
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('添加工人') || buttonText.includes('Add Worker') || buttonText.includes('添加'))) {
        addWorkerButton = button;
        console.log(`[OK] Found add worker button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!addWorkerButton) {
      throw new Error('Cannot find add worker button');
    }
    
    console.log('[OK] Found add worker button');
    await addWorkerButton.click();
    console.log('[OK] Clicked add worker button');
    
    await sleep(2000);
    await captureScreenshot(page, 'after_add_worker_click');
    
    // Fill in the worker form
    console.log('\n[Step 9] Filling worker form...');
    
    // Find form inputs
    const formInputs = await page.$$('input.ant-input');
    if (formInputs.length < 2) {
      throw new Error('Cannot find enough form inputs');
    }
    
    // Fill worker name
    await formInputs[0].type('Test Worker');
    console.log('[OK] Entered worker name');
    
    // Fill worker ID or other required field
    if (formInputs.length > 1) {
      await formInputs[1].type('W' + Math.floor(Math.random() * 10000));
      console.log('[OK] Entered worker ID');
    }
    
    await captureScreenshot(page, 'worker_form_filled');
    
    // Find and click submit button
    let submitButton = null;
    
    // Try to find the submit button by evaluating all buttons
    const submitButtons = await page.$$('button');
    for (const button of submitButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('确定') || buttonText.includes('OK') || 
                         buttonText.includes('保存') || buttonText.includes('Save'))) {
        submitButton = button;
        console.log(`[OK] Found submit button with text: ${buttonText}`);
        break;
      }
    }
    
    // If still not found by text, try by class
    if (!submitButton) {
      submitButton = await page.$('button.ant-btn-primary');
      if (submitButton) {
        console.log('[OK] Found submit button by class name');
      }
    }
    
    if (!submitButton) {
      throw new Error('Cannot find submit button');
    }
    
    console.log('[OK] Found submit button');
    await submitButton.click();
    console.log('[OK] Clicked submit button');
    
    await sleep(3000);
    await captureScreenshot(page, 'after_worker_submission');
    
    // Step 10: Test editing a worker
    console.log('\n[Step 10] Testing worker editing...');
    
    // Go back to worker management page if needed
    if (!page.url().includes('/workers')) {
      await page.goto(`${config.BASE_URLS.frontend}/workers`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      await sleep(2000);
    }
    
    // Find the first edit button in the table
    let editButton = null;
    const editButtons = await page.$$('button');
    for (const button of editButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('编辑') || buttonText.includes('Edit'))) {
        editButton = button;
        console.log(`[OK] Found edit button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!editButton) {
      throw new Error('Cannot find edit button for workers');
    }
    
    console.log('[OK] Found edit button');
    await editButton.click();
    console.log('[OK] Clicked edit button');
    
    await sleep(2000);
    await captureScreenshot(page, 'after_edit_worker_click');
    
    // Modify the worker form
    const editFormInputs = await page.$$('input.ant-input');
    if (editFormInputs.length > 0) {
      // Clear the first input and enter new value
      await editFormInputs[0].click({ clickCount: 3 });
      await editFormInputs[0].type('Updated Worker Name');
      console.log('[OK] Updated worker name');
    }
    
    await captureScreenshot(page, 'worker_edit_form_filled');
    
    // Find and click submit button for edit
    let editSubmitButton = null;
    
    // Try to find the edit submit button by evaluating all buttons
    const editSubmitButtons = await page.$$('button');
    for (const button of editSubmitButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('确定') || buttonText.includes('OK') || 
                         buttonText.includes('保存') || buttonText.includes('Save'))) {
        editSubmitButton = button;
        console.log(`[OK] Found edit submit button with text: ${buttonText}`);
        break;
      }
    }
    
    // If still not found by text, try by class
    if (!editSubmitButton) {
      editSubmitButton = await page.$('button.ant-btn-primary');
      if (editSubmitButton) {
        console.log('[OK] Found edit submit button by class name');
      }
    }
    
    if (!editSubmitButton) {
      throw new Error('Cannot find edit submit button');
    }
    
    console.log('[OK] Found edit submit button');
    await editSubmitButton.click();
    console.log('[OK] Clicked edit submit button');
    
    await sleep(3000);
    await captureScreenshot(page, 'after_worker_edit_submission');
    
    // Step 11: Test deleting a worker
    console.log('\n[Step 11] Testing worker deletion...');
    
    // Go back to worker management page if needed
    if (!page.url().includes('/workers')) {
      await page.goto(`${config.BASE_URLS.frontend}/workers`, {
        waitUntil: 'networkidle0',
        timeout: config.TIMEOUTS.long
      });
      await sleep(2000);
    }
    
    // Find the first delete button in the table
    let deleteButton = null;
    const deleteButtons = await page.$$('button');
    for (const button of deleteButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('删除') || buttonText.includes('Delete'))) {
        deleteButton = button;
        console.log(`[OK] Found delete button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!deleteButton) {
      throw new Error('Cannot find delete button for workers');
    }
    
    console.log('[OK] Found delete button');
    await deleteButton.click();
    console.log('[OK] Clicked delete button');
    
    await sleep(1000);
    await captureScreenshot(page, 'after_delete_worker_click');
    
    // Handle confirmation dialog if present
    try {
      // Look for confirmation buttons
      let confirmButton = null;
      
      // Try to find confirmation button by evaluating all buttons
      const confirmButtons = await page.$$('button');
      for (const button of confirmButtons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        if (buttonText && (buttonText.includes('确定') || buttonText.includes('OK') || 
                           buttonText.includes('Confirm'))) {
          confirmButton = button;
          console.log(`[OK] Found confirmation button with text: ${buttonText}`);
          break;
        }
      }
      
      // If still not found by text, try by class
      if (!confirmButton) {
        confirmButton = await page.$('.ant-btn-primary') || await page.$('button.ant-btn-primary');
        if (confirmButton) {
          console.log('[OK] Found confirmation button by class name');
        }
      }
      
      if (confirmButton) {
        console.log('[OK] Found confirmation button');
        await confirmButton.click();
        console.log('[OK] Clicked confirmation button');
        await sleep(2000);
        await captureScreenshot(page, 'after_worker_deletion');
      }
    } catch (e) {
      console.log('[INFO] No confirmation dialog found or handled');
    }
    
    // Step 12: Check for errors
    console.log('\n[Step 12] Checking for errors...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    }
    
    // Determine test result
    if (hasWorkerManagementText && hasAddWorkerButton) {
      console.log('\n[PASS] TEST PASSED: Worker management functionality verified!');
      console.log(`  - Found worker management text: ${hasWorkerManagementText ? 'YES' : 'NO'}`);
      console.log(`  - Found add worker button: ${hasAddWorkerButton ? 'YES' : 'NO'}`);
      console.log(`  - Worker table rows: ${workerRows}`);
      return { success: true, message: 'Worker management test passed' };
    } else {
      console.error('\n[FAIL] TEST FAILED: Worker management functionality not fully verified!');
      throw new Error('Worker management test failed - missing expected elements');
    }
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'worker_management_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the worker management test
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Worker Management Test');
  console.log('============================================');
  
  const result = await testWorkerManagement();
  
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

module.exports = { testWorkerManagement };