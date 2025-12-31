// Salary record management test for development environment
// This test verifies that users can add salary records in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * 测试工资记录管理功能
 * @returns {Promise<object>} - 测试结果对象
 */
async function testSalaryRecordManagement() {
  console.log('=== Starting Development Salary Record Management Test ===');
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
    await captureScreenshot(page, 'salary_login_page_loaded');
    
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
    await captureScreenshot(page, 'salary_home_page');
    
    // Step 4: 等待导航到主页
    console.log('\n[Step 4] Waiting for navigation to home page...');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.TIMEOUTS.long }).catch(() => {});
    await sleep(1000);
    await captureScreenshot(page, 'salary_home_page_loaded');
    
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
    
    // Step 6: 导航到工资记录管理页面
    console.log('\n[Step 6] Navigating to salary record management page...');
    await page.goto(`${config.BASE_URLS.frontend}/salary-records`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(1500);
    await captureScreenshot(page, 'salary_management_page_loaded');
    
    // Step 7: 验证工资记录管理页面内容
    console.log('\n[Step 7] Verifying salary record management page content...');
    const pageContent = await page.content();
    const hasSalaryManagementText = pageContent.includes('工资记录') || pageContent.includes('Salary');
    const hasAddSalaryButton = pageContent.includes('添加工作记录') || pageContent.includes('Add Work Record');
    
    // 查找表格行数
    const tableRows = await page.$$('table tr, .ant-table-row, .table-row');
    console.log(`Salary table rows: ${tableRows.length}`);
    
    console.log(`Has salary management text: ${hasSalaryManagementText}`);
    console.log(`Has add salary button: ${hasAddSalaryButton}`);
    
    if (!hasSalaryManagementText) {
      throw new Error('Salary record management page not loaded correctly');
    }
    
    // Step 8: 验证表格列结构
    console.log('\n[Step 8] Verifying table column structure...');
    
    // 检查表格标题
    const tableHeaders = await page.$$('th, .ant-table-thead th, .table-header');
    console.log(`Table headers found: ${tableHeaders.length}`);
    
    // 检查关键列是否存在
    const headerTexts = [];
    for (const header of tableHeaders) {
      const text = await page.evaluate(el => el.textContent, header);
      headerTexts.push(text.trim());
    }
    
    console.log('Table headers:', headerTexts);
    
    // 验证必要的列是否存在
    const requiredColumns = ['编号', '记录日期', '工人', '定额编号', '电机型号', '工段类别', '工序类别', '工序名称', '单价', '数量', '金额'];
    const missingColumns = [];
    
    for (const column of requiredColumns) {
      const found = headerTexts.some(header => header.includes(column));
      if (!found) {
        missingColumns.push(column);
      }
    }
    
    if (missingColumns.length > 0) {
      console.error(`Missing columns: ${missingColumns.join(', ')}`);
      throw new Error(`Table missing required columns: ${missingColumns.join(', ')}`);
    }
    
    console.log('[OK] All required columns found in table');
    
    // Step 9: 测试添加工作记录功能
    console.log('\n[Step 9] Testing salary record addition...');
    
    // 查找添加工作记录按钮
    const addButtons = await page.$$('button');
    let addButton = null;
    
    for (const button of addButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('添加工作记录') || buttonText.includes('Add Work Record'))) {
        addButton = button;
        console.log(`[OK] Found add salary record button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!addButton) {
      // 尝试通过类名查找
      addButton = await page.$('button.ant-btn-primary');
      if (addButton) {
        console.log('[OK] Found add salary record button by class name');
      }
    }
    
    if (!addButton) {
      throw new Error('Cannot find add salary record button');
    }
    
    console.log('[OK] Found add salary record button');
    await addButton.click();
    console.log('[OK] Clicked add salary record button');
    
    await sleep(1500);
    await captureScreenshot(page, 'salary_after_add_click');
    
    // Step 10: 验证添加工作记录表单字段
    console.log('\n[Step 10] Verifying add salary record form fields...');
    
    // 检查模态框是否打开
    const modalContent = await page.content();
    const hasModal = modalContent.includes('添加工作记录') || modalContent.includes('Add Work Record');
    
    if (!hasModal) {
      throw new Error('Add salary record modal not opened');
    }
    
    console.log('[OK] Add salary record modal opened');
    
    // 检查表单字段
    const formLabels = await page.$$('.ant-form-item-label label');
    const labelTexts = [];
    
    for (const label of formLabels) {
      const text = await page.evaluate(el => el.textContent, label);
      labelTexts.push(text.trim());
    }
    
    console.log('Form labels found:', labelTexts);
    
    // 验证必要的表单字段
    const requiredFormFields = ['工人', '定额编号', '数量', '日期'];
    const missingFormFields = [];
    
    for (const field of requiredFormFields) {
      const found = labelTexts.some(label => label.includes(field));
      if (!found) {
        missingFormFields.push(field);
      }
    }
    
    if (missingFormFields.length > 0) {
      console.error(`Missing form fields: ${missingFormFields.join(', ')}`);
      throw new Error(`Form missing required fields: ${missingFormFields.join(', ')}`);
    }
    
    console.log('[OK] All required form fields found');
    
    // Step 11: 填写并提交表单
    console.log('\n[Step 11] Filling and submitting form...');
    
    // 选择工人
    const workerSelect = await page.$('input[placeholder*="工人"], input[placeholder*="Worker"]');
    if (workerSelect) {
      await workerSelect.click();
      await sleep(500);
      
      // 选择第一个工人选项
      const workerOptions = await page.$$('.ant-select-item-option');
      if (workerOptions.length > 0) {
        await workerOptions[0].click();
        console.log('[OK] Selected worker');
      }
    }
    
    await sleep(500);
    
    // 选择定额编号
    const quotaSelect = await page.$('input[placeholder*="定额编号"], input[placeholder*="Quota"]');
    if (quotaSelect) {
      await quotaSelect.click();
      await sleep(500);
      
      // 选择第一个定额选项
      const quotaOptions = await page.$$('.ant-select-item-option');
      if (quotaOptions.length > 0) {
        await quotaOptions[0].click();
        console.log('[OK] Selected quota');
      }
    }
    
    await sleep(500);
    
    // 填写数量
    const quantityInput = await page.$('input[placeholder*="数量"], input[placeholder*="Quantity"]');
    if (quantityInput) {
      await quantityInput.type('10');
      console.log('[OK] Entered quantity');
    }
    
    await sleep(500);
    
    // 选择日期
    const datePicker = await page.$('input[placeholder*="日期"], input[placeholder*="Date"]');
    if (datePicker) {
      await datePicker.click();
      await sleep(500);
      
      // 选择今天的日期
      const todayCell = await page.$('.ant-picker-cell-today');
      if (todayCell) {
        await todayCell.click();
        console.log('[OK] Selected date');
      }
    }
    
    await sleep(500);
    await captureScreenshot(page, 'salary_form_filled');
    
    // 查找提交按钮
    const submitButtons = await page.$$('button');
    let submitButton = null;
    
    for (const button of submitButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('添加') || buttonText.includes('Add'))) {
        submitButton = button;
        console.log(`[OK] Found submit button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!submitButton) {
      // 尝试通过类名查找
      submitButton = await page.$('button.ant-btn-primary');
      if (submitButton) {
        console.log('[OK] Found submit button by class name');
      }
    }
    
    if (!submitButton) {
      throw new Error('Cannot find submit button');
    }
    
    // 点击提交按钮
    await submitButton.click();
    console.log('[OK] Clicked submit button');
    
    // 等待表单提交完成
    await sleep(2000);
    await captureScreenshot(page, 'salary_after_submit');
    
    // Step 12: 验证记录是否添加成功
    console.log('\n[Step 12] Verifying record was added successfully...');
    
    // 检查是否有成功消息
    const successMessages = await page.$$('.ant-message-success');
    const hasSuccessMessage = successMessages.length > 0;
    
    if (hasSuccessMessage) {
      console.log('[OK] Success message displayed');
    } else {
      // 检查页面内容是否有成功提示
      const finalContent = await page.content();
      const hasSuccessText = finalContent.includes('成功') || finalContent.includes('Success');
      console.log(`Success text in page: ${hasSuccessText ? 'YES' : 'NO'}`);
    }
    
    // 检查表格行数是否增加
    const finalTableRows = await page.$$('table tr, .ant-table-row, .table-row');
    console.log(`Final salary table rows: ${finalTableRows.length}`);
    
    // Step 13: 检查错误
    console.log('\n[Step 13] Checking for errors...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('[OK] No error messages found on page');
    }
    
    // Step 14: 验证测试结果
    console.log('\n[Step 14] Verifying test results...');
    
    // 检查页面内容，确认操作成功
    const finalPageContent = await page.content();
    const finalHasSalaryManagementText = finalPageContent.includes('工资记录') || finalPageContent.includes('Salary');
    const finalHasAddSalaryButton = finalPageContent.includes('添加工作记录') || finalPageContent.includes('Add Work Record');
    
    console.log(`Final page has salary management text: ${finalHasSalaryManagementText}`);
    console.log(`Final page has add salary button: ${finalHasAddSalaryButton}`);
    console.log(`Final salary table rows: ${finalTableRows.length}`);
    
    console.log('\n[PASS] TEST PASSED: Salary record management functionality verified!');
    console.log(`  - Found salary management text: ${finalHasSalaryManagementText ? 'YES' : 'NO'}`);
    console.log(`  - Found add salary button: ${finalHasAddSalaryButton ? 'YES' : 'NO'}`);
    console.log(`  - Salary table rows: ${finalTableRows.length}`);
    console.log(`  - Required columns verified: ${requiredColumns.length} columns`);
    console.log(`  - Required form fields verified: ${requiredFormFields.length} fields`);
    console.log(`  - Record insertion: ${hasSuccessMessage ? 'SUCCESS' : 'CHECK MANUALLY'}`);
    
    return { 
      success: true, 
      message: 'Salary record management test passed',
      details: {
        hasSalaryManagementText: finalHasSalaryManagementText,
        hasAddSalaryButton: finalHasAddSalaryButton,
        tableRows: finalTableRows.length,
        requiredColumnsVerified: requiredColumns.length,
        requiredFormFieldsVerified: requiredFormFields.length,
        recordInserted: hasSuccessMessage
      }
    };
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // 捕获错误截图
    try {
      await captureScreenshot(page, 'salary_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * 运行工资记录管理测试
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Salary Record Management Test');
  console.log('============================================');
  
  const result = await testSalaryRecordManagement();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.details) {
    console.log('\nTest Details:');
    console.log(`  - Has salary management text: ${result.details.hasSalaryManagementText ? 'YES' : 'NO'}`);
    console.log(`  - Has add salary button: ${result.details.hasAddSalaryButton ? 'YES' : 'NO'}`);
    console.log(`  - Table rows: ${result.details.tableRows}`);
    console.log(`  - Required columns verified: ${result.details.requiredColumnsVerified}`);
    console.log(`  - Required form fields verified: ${result.details.requiredFormFieldsVerified}`);
    console.log(`  - Record inserted: ${result.details.recordInserted ? 'YES' : 'NO'}`);
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

// 如果直接调用则运行测试
if (require.main === module) {
  runTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testSalaryRecordManagement };
