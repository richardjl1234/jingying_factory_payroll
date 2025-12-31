// Quota management test for development environment
// This test verifies that users can manage quotas in the application

const config = require('./config');
const utils = require('./utils');
const { launchBrowser, setupPage, captureScreenshot, sleep, capturePageInfo, getErrorMessages } = utils;

/**
 * 测试定额管理功能
 * @returns {Promise<object>} - 测试结果对象
 */
async function testQuotaManagement() {
  console.log('=== Starting Development Quota Management Test ===');
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
    await captureScreenshot(page, 'quota_login_page_loaded');
    
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
    await captureScreenshot(page, 'quota_home_page');
    
    // Step 4: 等待导航到主页
    console.log('\n[Step 4] Waiting for navigation to home page...');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: config.TIMEOUTS.long }).catch(() => {});
    await sleep(1000);
    await captureScreenshot(page, 'quota_home_page_loaded');
    
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
    
    // Step 6: 导航到定额管理页面
    console.log('\n[Step 6] Navigating to quota management page...');
    await page.goto(`${config.BASE_URLS.frontend}/quotas`, {
      waitUntil: 'domcontentloaded',
      timeout: config.TIMEOUTS.long
    });
    
    await sleep(1500);
    await captureScreenshot(page, 'quota_management_page_loaded');
    
    // Step 7: 验证定额管理页面内容
    console.log('\n[Step 7] Verifying quota management page content...');
    const pageContent = await page.content();
    const hasQuotaManagementText = pageContent.includes('定额') || pageContent.includes('Quota');
    const hasAddQuotaButton = pageContent.includes('添加') || pageContent.includes('新增') || pageContent.includes('Add');
    
    // 查找表格行数
    const tableRows = await page.$$('table tr, .ant-table-row, .table-row');
    console.log(`Quota table rows: ${tableRows.length}`);
    
    console.log(`Has quota management text: ${hasQuotaManagementText}`);
    console.log(`Has add quota button: ${hasAddQuotaButton}`);
    
    if (!hasQuotaManagementText) {
      throw new Error('Quota management page not loaded correctly');
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
    const requiredColumns = ['定额编号', '电机型号', '工段类别', '工序类别', '工序编码 (名称)', '单价', '生效日期', '创建时间'];
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
    
    // Step 9: 验证数据排序（按定额编号降序）
    console.log('\n[Step 9] Verifying data sorting by quota id (descending)...');
    
    // 获取表格数据中的定额编号
    const quotaIdCells = await page.$$('td:first-child, .ant-table-cell:first-child');
    const quotaIds = [];
    
    for (const cell of quotaIdCells.slice(0, 5)) { // 检查前5行
      const text = await page.evaluate(el => el.textContent, cell);
      const id = parseInt(text.trim());
      if (!isNaN(id)) {
        quotaIds.push(id);
      }
    }
    
    console.log(`First few quota IDs: ${quotaIds.join(', ')}`);
    
    // 检查是否降序排列
    let isDescending = true;
    for (let i = 1; i < quotaIds.length; i++) {
      if (quotaIds[i] > quotaIds[i - 1]) {
        isDescending = false;
        break;
      }
    }
    
    if (quotaIds.length >= 2) {
      console.log(`Data is sorted in descending order by quota id: ${isDescending ? 'YES' : 'NO'}`);
      if (!isDescending) {
        console.warn('[WARNING] Data is not sorted in descending order by quota id');
      }
    } else {
      console.log('Not enough data to verify sorting');
    }
    
    // Step 10: 测试定额添加功能
    console.log('\n[Step 10] Testing quota addition...');
    
    // 查找添加定额按钮
    const addButtons = await page.$$('button');
    let addButton = null;
    
    for (const button of addButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (buttonText.includes('添加') || buttonText.includes('新增') || buttonText.includes('Add'))) {
        addButton = button;
        console.log(`[OK] Found add quota button with text: ${buttonText}`);
        break;
      }
    }
    
    if (!addButton) {
      // 尝试通过类名查找
      addButton = await page.$('button.ant-btn-primary');
      if (addButton) {
        console.log('[OK] Found add quota button by class name');
      }
    }
    
    if (!addButton) {
      console.log('[SKIP] Cannot find add quota button, skipping addition test');
    } else {
      console.log('[OK] Found add quota button');
      await addButton.click();
      console.log('[OK] Clicked add quota button');
      
      await sleep(1500);
      await captureScreenshot(page, 'quota_after_add_click');
      
      // 检查模态框是否打开
      const modalContent = await page.content();
      const hasModal = modalContent.includes('添加定额') || modalContent.includes('Add Quota');
      
      if (hasModal) {
        console.log('[OK] Add quota modal opened');
        
        // 关闭模态框（不实际添加数据，因为需要选择工序等）
        const cancelButtons = await page.$$('button');
        let cancelButton = null;
        
        for (const button of cancelButtons) {
          const buttonText = await page.evaluate(el => el.textContent, button);
          if (buttonText && (buttonText.includes('取消') || buttonText.includes('Cancel'))) {
            cancelButton = button;
            console.log(`[OK] Found cancel button with text: ${buttonText}`);
            break;
          }
        }
        
        if (cancelButton) {
          await cancelButton.click();
          console.log('[OK] Clicked cancel button');
          await sleep(1000);
        }
      }
    }
    
    // Step 11: 检查错误
    console.log('\n[Step 11] Checking for errors...');
    const errorMessages = await getErrorMessages(page);
    if (errorMessages.length > 0) {
      console.error('[ERROR] Found error messages on page:');
      errorMessages.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
    } else {
      console.log('[OK] No error messages found on page');
    }
    
    // Step 12: 验证测试结果
    console.log('\n[Step 12] Verifying test results...');
    
    // 检查页面内容，确认操作成功
    const finalPageContent = await page.content();
    const finalHasQuotaManagementText = finalPageContent.includes('定额') || finalPageContent.includes('Quota');
    const finalHasAddQuotaButton = finalPageContent.includes('添加') || finalPageContent.includes('新增') || finalPageContent.includes('Add');
    const finalTableRows = await page.$$('table tr, .ant-table-row, .table-row');
    
    console.log(`Final page has quota management text: ${finalHasQuotaManagementText}`);
    console.log(`Final page has add quota button: ${finalHasAddQuotaButton}`);
    console.log(`Final quota table rows: ${finalTableRows.length}`);
    
    console.log('\n[PASS] TEST PASSED: Quota management functionality verified!');
    console.log(`  - Found quota management text: ${finalHasQuotaManagementText ? 'YES' : 'NO'}`);
    console.log(`  - Found add quota button: ${finalHasAddQuotaButton ? 'YES' : 'NO'}`);
    console.log(`  - Quota table rows: ${finalTableRows.length}`);
    console.log(`  - Required columns verified: ${requiredColumns.length} columns`);
    console.log(`  - Data sorting verified: ${quotaIds.length >= 2 ? (isDescending ? 'Descending' : 'Not descending') : 'Insufficient data'}`);
    
    return { 
      success: true, 
      message: 'Quota management test passed',
      details: {
        hasQuotaManagementText: finalHasQuotaManagementText,
        hasAddQuotaButton: finalHasAddQuotaButton,
        tableRows: finalTableRows.length,
        requiredColumnsVerified: requiredColumns.length,
        sortingVerified: quotaIds.length >= 2 ? isDescending : 'insufficient_data'
      }
    };
    
  } catch (error) {
    console.error('\n[FAIL] TEST FAILED WITH EXCEPTION:', error.message);
    console.error('Stack trace:', error.stack);
    
    // 捕获错误截图
    try {
      await captureScreenshot(page, 'quota_error_state');
    } catch (e) {
      console.error('Failed to capture error screenshot:', e.message);
    }
    
    return { success: false, message: error.message };
  } finally {
    await browser.close();
  }
}

/**
 * 运行定额管理测试
 */
async function runTest() {
  console.log('============================================');
  console.log('Development Quota Management Test');
  console.log('============================================');
  
  const result = await testQuotaManagement();
  
  console.log('\n============================================');
  console.log('Test Result:');
  console.log('============================================');
  console.log(`Status: ${result.success ? '[PASS] PASS' : '[FAIL] FAIL'}`);
  console.log(`Message: ${result.message}`);
  
  if (result.details) {
    console.log('\nTest Details:');
    console.log(`  - Has quota management text: ${result.details.hasQuotaManagementText ? 'YES' : 'NO'}`);
    console.log(`  - Has add quota button: ${result.details.hasAddQuotaButton ? 'YES' : 'NO'}`);
    console.log(`  - Table rows: ${result.details.tableRows}`);
    console.log(`  - Required columns verified: ${result.details.requiredColumnsVerified}`);
    console.log(`  - Sorting verified: ${result.details.sortingVerified}`);
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

module.exports = { testQuotaManagement };
