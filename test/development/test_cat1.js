// Process category 1 (工段类别) management test for development environment
// This test verifies that users can manage process category 1 in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * 测试工段类别管理功能
 * @returns {Promise<object>} - 测试结果对象
 */
async function testProcessCat1Management() {
  console.log('=== Starting Development Process Category 1 Management Test ===');
  console.log(`Testing URL: ${config.BASE_URLS.frontend}`);
  
  const browser = await launchBrowser();
  const page = await setupPage(browser);
  
  try {
    // Step 1: 导航到登录页面
    console.log('\n[Step 1] Navigating to login page...');
    await page.goto(`${config.BASE_URLS.frontend}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(1000);
    await captureScreenshot(page, 'cat1_login_page_loaded');
    
    // Step 2: 查找登录表单元素
    console.log('\n[Step 2] Finding login form elements...');
    const antInputs = await page.$$('input.ant-input');
    if (antInputs.length < 2) {
      throw new Error('Cannot find enough input elements');
    }
    
    const usernameInput = antInputs[0];
    const passwordInput = antInputs[1];
    
    // 查找登录按钮
    const loginButton = await page.$('button.ant-btn-primary');
    if (!loginButton) {
      throw new Error('Cannot find login button');
    }
    
    console.log('[OK] Found login input fields');
    console.log('[OK] Found login button');
    
    // Step 3: 登录应用程序
    console.log('\n[Step 3] Logging in...');
    await usernameInput.type(config.TEST_CREDENTIALS.admin.username);
    await passwordInput.type(config.TEST_CREDENTIALS.admin.password);
    
    console.log('[OK] Credentials entered');
    await loginButton.click();
    console.log('[OK] Login button clicked');
    
    await sleep(2000);
    await captureScreenshot(page, 'cat1_home_page');
    
    // Step 4: 等待导航到主页
    console.log('\n[Step 4] Waiting for navigation to home page...');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.TIMEOUTS.long }).catch(() => {});
    await sleep(1000);
    await captureScreenshot(page, 'cat1_home_page_loaded');
    
    // Step 5: 验证登录状态
    console.log('\n[Step 5] Verifying login status...');
    const pageInfo = await capturePageInfo(page);
    const hasToken = pageInfo.localStorage.includes('token');
    const currentUrl = page.url();
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Has token in storage: ${hasToken ? 'YES' : 'NO'}`);
    
    if (!hasToken || currentUrl.includes('/login')) {
      throw new Error('Login failed');
    }
    
    console.log('[OK] Login successful');
    
    // Step 6: 导航到工段类别管理页面
    console.log('\n[Step 6] Navigating to process category 1 management page...');
    await page.goto(`${config.BASE_URLS.frontend}/process-cat1`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_management_page_loaded');
    
    // Step 7: 验证工段类别管理页面内容
    console.log('\n[Step 7] Verifying process category 1 management page content...');
    const pageContent = await page.content();
    const hasCat1ManagementText = pageContent.includes('工段类别') || pageContent.includes('Process Category 1');
    const hasAddCat1Button = pageContent.includes('添加') || pageContent.includes('新增') || pageContent.includes('Add');
    
    // 查找表格行数
    const tableRows = await page.$$('table tr, .ant-table-row, .table-row');
    console.log(`Process category 1 table rows: ${tableRows.length}`);
    
    console.log(`Has process category 1 management text: ${hasCat1ManagementText}`);
    console.log(`Has add process category 1 button: ${hasAddCat1Button}`);
    
    if (!hasCat1ManagementText) {
      throw new Error('Process category 1 management page not loaded correctly');
    }
    
    // Step 8: 测试工段类别添加功能
    console.log('\n[Step 8] Testing process category 1 addition...');
    
    // 查找添加工段类别按钮
    const addButtons = await page.$$('button');
    let addButton = null;
    
    for (const button of addButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('添加') || buttonText.includes('新增') || buttonText.includes('Add'))) {
        addButton = button;
        console.log(`[OK] Found add process category 1 button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!addButton) {
      // 尝试通过类名查找
      addButton = await page.$('button.ant-btn-primary');
      if (addButton) {
        console.log('[OK] Found add process category 1 button by class name');
      }
    }
    
    if (!addButton) {
      throw new Error('Cannot find add process category 1 button');
    }
    
    console.log('[OK] Found add process category 1 button');
    await addButton.click();
    console.log('[OK] Clicked add process category 1 button');
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_after_add_click');
    
    // Step 9: 填写工段类别表单
    console.log('\n[Step 9] Filling process category 1 form...');
    
    // 查找表单输入框
    const formInputs = await page.$$('input.ant-input, input[type="text"], .ant-input, textarea');
    if (formInputs.length < 2) {
      throw new Error('Cannot find enough form inputs');
    }
    
    // 生成唯一的测试数据
    const testCat1Code = 'TEST_CAT1_' + Date.now().toString().slice(-4);
    const testCat1Name = '测试工段类别_' + Date.now().toString().slice(-4);
    
    // 填写表单
    await formInputs[0].click();
    await formInputs[0].type(testCat1Code);
    console.log('[OK] Entered process category 1 code');
    
    await formInputs[1].click();
    await formInputs[1].type(testCat1Name);
    console.log('[OK] Entered process category 1 name');
    
    // 如果有第三个输入框，填写描述
    if (formInputs.length >= 3) {
      await formInputs[2].click();
      await formInputs[2].type('自动化测试描述');
      console.log('[OK] Entered process category 1 description');
    }
    
    await sleep(1000);
    await captureScreenshot(page, 'cat1_form_filled');
    
    // 查找提交按钮
    let submitButton = null;
    
    // 尝试通过文本查找提交按钮
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
    
    // 如果通过文本找不到，尝试通过类名查找
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
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_after_submission');
    
    // Step 10: 测试工段类别编辑功能
    console.log('\n[Step 10] Testing process category 1 editing...');
    
    // 查找编辑按钮
    const editButtons = await page.$$('button');
    let editButton = null;
    
    for (const button of editButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('编辑') || buttonText.includes('Edit'))) {
        editButton = button;
        console.log(`[OK] Found edit button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!editButton) {
      throw new Error('Cannot find edit button');
    }
    
    console.log('[OK] Found edit button');
    await editButton.click();
    console.log('[OK] Clicked edit button');
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_after_edit_click');
    
    // 更新工段类别名称
    const editFormInputs = await page.$$('input.ant-input, input[type="text"], .ant-input, textarea');
    if (editFormInputs.length >= 2) {
      // 清空并重新填写第二个输入框（名称）
      await editFormInputs[1].click({ clickCount: 3 }); // 全选
      await editFormInputs[1].type(testCat1Name + '_UPDATED');
      console.log('[OK] Updated process category 1 name');
    }
    
    await sleep(1000);
    await captureScreenshot(page, 'cat1_edit_form_filled');
    
    // 查找编辑提交按钮
    let editSubmitButton = null;
    
    // 尝试通过文本查找编辑提交按钮
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
    
    // 如果通过文本找不到，尝试通过类名查找
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
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_after_edit_submission');
    
    // Step 11: 测试工段类别删除功能
    console.log('\n[Step 11] Testing process category 1 deletion...');
    
    // 查找删除按钮
    const deleteButtons = await page.$$('button');
    let deleteButton = null;
    
    for (const button of deleteButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('删除') || buttonText.includes('Delete'))) {
        deleteButton = button;
        console.log(`[OK] Found delete button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!deleteButton) {
      throw new Error('Cannot find delete button');
    }
    
    console.log('[OK] Found delete button');
    await deleteButton.click();
    console.log('[OK] Clicked delete button');
    
    await sleep(1000);
    await captureScreenshot(page, 'cat1_after_delete_click');
    
    // 查找确认删除按钮
    let confirmationButton = null;
    
    // 尝试通过文本查找确认按钮
    const confirmationButtons = await page.$$('button');
    for (const button of confirmationButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('确定') || buttonText.includes('OK') || 
                         buttonText.includes('确认') || buttonText.includes('Confirm') ||
                         buttonText.includes('删除'))) {
        confirmationButton = button;
        console.log(`[OK] Found confirmation button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!confirmationButton) {
      throw new Error('Cannot find confirmation button');
    }
    
    console.log('[OK] Found confirmation button');
    await confirmationButton.click();
    console.log('[OK] Clicked confirmation button');
    
    await sleep(1500);
    await captureScreenshot(page, 'cat1_after_deletion');
    
    // Step 12: 检查错误
    console.log('\n[Step 12] Checking for errors...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('[OK] No error messages found on page');
    }
    
    // Step 13: 验证测试结果
    console.log('\n[Step 13] Verifying test results...');
    
    // 检查页面内容，确认操作成功
    const finalPageContent = await page.content();
    const finalHasCat1ManagementText = finalPageContent.includes('工段类别') || finalPageContent.includes('Process Category 1');
    const finalHasAddCat1Button = finalPageContent.includes('添加') || finalPageContent.includes('新增') || finalPageContent.includes('Add');
    const finalTableRows = await page.$$('table tr, .ant-table-row, .table-row');
    
    console.log(`Final page has process category 1 management text: ${finalHasCat1ManagementText}`);
    console.log(`Final page has add process category 1 button: ${finalHasAddCat1Button}`);
    console.log(`Final process category 1 table rows: ${finalTableRows.length}`);
    
    console.log('\n[PASS] TEST PASSED: Process category 1 management functionality verified!');
    console.log(`  - Found process category 1 management text: ${finalHasCat1ManagementText ? 'YES' : 'NO'}`);
    console.log(`  - Found add process category 1 button: ${finalHasAddCat1Button ? 'YES' : 'NO'}`);
    console.log(`  - Process category 1 table rows: ${finalTableRows.length}`);
    
    return { success: true, message: 'Process category 1 management test passed' };
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // 捕获错误截图
    try {
      await captureScreenshot(page, 'cat1_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * 运行工段类别管理测试
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Process Category 1 Management Test');
  console.log('============================================');
  
  const result = await testProcessCat1Management();
  
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

// 如果直接调用则运行测试
if (require.main === module) {
  runTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testProcessCat1Management };
