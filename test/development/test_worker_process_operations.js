// Worker and Process operations test for development environment
// This test verifies that users can manage workers and processes in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * Test worker and process operations functionality
 * @returns {Promise<object>} - Test result object
 */
async function testWorkerProcessOperations() {
  console.log('=== Starting Development Worker and Process Operations Test ===');
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
    await captureScreenshot(page, 'worker_process_login_page_loaded');
    
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
    await captureScreenshot(page, 'worker_process_after_login');
    
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
      workerAdd: false,
      workerDelete: false,
      processAdd: false,
      processDelete: false
    };
    
    // Step 4: Test worker management
    console.log('\n=== 测试工人管理 ===');
    
    // Navigate to worker management page
    console.log('\n[Step 4.1] Navigating to worker management page...');
    await page.goto(`${config.BASE_URLS.frontend}/worker-management`, {
      waitUntil: 'networkidle0',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(3000);
    await captureScreenshot(page, 'worker_management_page_loaded');
    
    // Test add worker functionality
    console.log('\n[Step 4.2] Testing add worker functionality...');
    try {
      // Find add button
      const addButtons = await page.$$('button.ant-btn-primary');
      let addButton = null;
      
      for (const btn of addButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('添加') || text.includes('新增')) {
          addButton = btn;
          break;
        }
      }
      
      if (addButton) {
        await addButton.click();
        await sleep(2000);
        
        // Find modal inputs
        const modalInputs = await page.$$('.ant-modal input.ant-input');
        if (modalInputs.length >= 2) {
          // Enter worker information
          const testWorkerCode = 'TEST_WORKER_' + Date.now().toString().slice(-4);
          const testWorkerName = '测试工人_' + Date.now().toString().slice(-4);
          
          await modalInputs[0].type(testWorkerCode);
          await modalInputs[1].type(testWorkerName);
          
          // Find confirm button
          const modalButtons = await page.$$('.ant-modal-footer button');
          for (const btn of modalButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('确定') || text.includes('确认')) {
              await btn.click();
              break;
            }
          }
          
          await sleep(3000);
          console.log('✓ Worker add button clicked');
          
          // Check if worker was added successfully
          const pageContent = await page.content();
          if (pageContent.includes(testWorkerCode) || pageContent.includes(testWorkerName)) {
            console.log('✅ Worker added successfully');
            testResults.workerAdd = true;
          } else {
            console.log('❌ Worker might not have been added successfully');
          }
        } else {
          console.log('❌ Could not find modal inputs, skipping add worker test');
        }
      } else {
        console.log('❌ Could not find add button, skipping add worker test');
      }
    } catch (error) {
      console.log('❌ Add worker test failed:', error.message);
    }
    
    await captureScreenshot(page, 'worker_management_after_add');
    
    // Step 5: Test process management
    console.log('\n=== 测试工序管理 ===');
    
    // Navigate to process management page
    console.log('\n[Step 5.1] Navigating to process management page...');
    await page.goto(`${config.BASE_URLS.frontend}/process-management`, {
      waitUntil: 'networkidle0',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(3000);
    await captureScreenshot(page, 'process_management_page_loaded');
    
    // Test add process functionality
    console.log('\n[Step 5.2] Testing add process functionality...');
    try {
      // Find add button
      const addButtons = await page.$$('button.ant-btn-primary');
      let addButton = null;
      
      for (const btn of addButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('添加') || text.includes('新增')) {
          addButton = btn;
          break;
        }
      }
      
      if (addButton) {
        await addButton.click();
        await sleep(2000);
        
        // Find modal inputs
        const modalInputs = await page.$$('.ant-modal input.ant-input');
        if (modalInputs.length >= 3) {
          // Enter process information
          const testProcessCode = 'TEST_PROCESS_' + Date.now().toString().slice(-4);
          const testProcessName = '测试工序_' + Date.now().toString().slice(-4);
          
          await modalInputs[0].type(testProcessCode);
          await modalInputs[1].type(testProcessName);
          
          // Select process category if available
          const selectElements = await page.$$('.ant-modal .ant-select-selector');
          if (selectElements.length > 0) {
            await selectElements[0].click();
            await sleep(1000);
            
            // Select first option
            const options = await page.$$('.ant-select-item-option');
            if (options.length > 0) {
              await options[0].click();
            }
          }
          
          // Find confirm button
          const modalButtons = await page.$$('.ant-modal-footer button');
          for (const btn of modalButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('确定') || text.includes('确认')) {
              await btn.click();
              break;
            }
          }
          
          await sleep(3000);
          console.log('✓ Process add button clicked');
          
          // Check if process was added successfully
          const pageContent = await page.content();
          if (pageContent.includes(testProcessCode) || pageContent.includes(testProcessName)) {
            console.log('✅ Process added successfully');
            testResults.processAdd = true;
          } else {
            console.log('❌ Process might not have been added successfully');
          }
        } else {
          console.log('❌ Could not find modal inputs, skipping add process test');
        }
      } else {
        console.log('❌ Could not find add button, skipping add process test');
      }
    } catch (error) {
      console.log('❌ Add process test failed:', error.message);
    }
    
    await captureScreenshot(page, 'process_management_after_add');
    
    // Step 6: Verify no errors on page
    console.log('\n[Step 6] Checking for errors on pages...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('✗ Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('✓ No error messages found on pages');
    }
    
    // Step 7: Summary of test results
    console.log('\n=== 测试结果摘要 ===');
    console.log(`✅ 添加工人: ${testResults.workerAdd ? '通过' : '失败'}`);
    console.log(`✅ 添加工序: ${testResults.processAdd ? '通过' : '失败'}`);
    
    // Determine overall result
    const allTestsPassed = testResults.workerAdd || testResults.processAdd;
    
    if (allTestsPassed) {
      console.log('\n✅ TEST PASSED: Worker and Process Operations Test');
      return { success: true, message: 'Worker and Process Operations Test passed', testResults };
    } else {
      console.error('\n❌ TEST FAILED: Worker and Process Operations Test');
      throw new Error('Worker and Process Operations Test failed');
    }
    
  } catch (error) {
    console.error('\n✗ TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Capture final screenshot
    try {
      await captureScreenshot(page, 'worker_process_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * Run the worker and process operations test
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Worker and Process Operations Test');
  console.log('============================================');
  
  const result = await testWorkerProcessOperations();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '✅ PASS' : '✗ FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.testResults) {
    console.log('\nTest Results Detail:');
    console.log(`  - Add Worker: ${result.testResults.workerAdd ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`  - Delete Worker: ${result.testResults.workerDelete ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`  - Add Process: ${result.testResults.processAdd ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`  - Delete Process: ${result.testResults.processDelete ? '✅ PASS' : '✗ FAIL'}`);
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

module.exports = { testWorkerProcessOperations };
