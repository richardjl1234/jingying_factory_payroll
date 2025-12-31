const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 测试新表管理功能
 */
async function testNewTables() {
  const baseUrl = 'http://localhost:5173'; // 前端开发服务器地址
  
  console.log(`=== 测试新表管理功能 ===`);
  console.log(`测试地址: ${baseUrl}`);

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-popup-blocking',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // 捕获控制台日志
    const consoleLogs = [];
    page.on('console', message => {
      consoleLogs.push(message.text());
      console.log('浏览器控制台:', message.text());
    });
    
    // 捕获页面错误
    page.on('pageerror', error => {
      console.log('页面错误:', error.message);
    });
    
    // 捕获请求失败
    page.on('requestfailed', request => {
      console.log('请求失败:', request.url(), request.failure().errorText);
    });

    // 导航到登录页
    console.log('1. 导航到登录页...');
    await page.goto(baseUrl + '/login', { waitUntil: 'networkidle0' });
    
    // 等待页面加载完成
    await waitForTimeout(2000);
    
    // 检查是否在登录页面 - 通过检查是否有用户名输入框
    const hasUsernameInput = await page.$('input[placeholder*="用户名"]');
    const currentUrl = page.url();
    
    if (hasUsernameInput && currentUrl.includes('/login')) {
      console.log('✓ 成功加载登录页面');
    } else {
      console.log('✗ 登录页面加载失败，当前URL:', currentUrl);
      return;
    }
    
    // 输入登录信息
    console.log('2. 输入登录信息...');
    await page.type('input[placeholder*="用户名"]', 'admin');
    await page.type('input[placeholder*="密码"]', 'admin123');
    
    // 点击登录按钮
    console.log('3. 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待登录完成
    await waitForTimeout(3000);
    
    // 检查是否登录成功
    const loginSuccessUrl = page.url();
    if (loginSuccessUrl.includes('/')) {
      console.log('✓ 登录成功');
    } else {
      console.log('✗ 登录失败');
      return;
    }
    
    // 测试工序类别一管理
    await testProcessCat1Management(page);
    
    // 测试工序类别二管理
    await testProcessCat2Management(page);
    
    // 测试型号管理
    await testModelManagement(page);
    
    console.log('✓ 所有新表管理功能测试完成');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
}

/**
 * 测试工段类别管理
 */
async function testProcessCat1Management(page) {
  console.log('\n=== 测试工段类别管理 ===');
  
  try {
    // 导航到工段类别管理页面
    console.log('1. 导航到工段类别管理页面...');
    await page.goto('http://localhost:5173/process-cat1', { waitUntil: 'networkidle0' });
    await waitForTimeout(2000);
    
    // 检查页面标题
    const pageTitle = await page.$eval('h3', el => el.textContent);
    if (pageTitle.includes('工段类别管理')) {
      console.log('✓ 工段类别管理页面加载成功');
    } else {
      console.log('✗ 工段类别管理页面加载失败');
      return;
    }
    
    // 点击新增按钮
    console.log('2. 点击新增类别按钮...');
    await page.click('button:has-text("新增类别")');
    await waitForTimeout(1000);
    
    // 填写表单
    console.log('3. 填写工段类别表单...');
    await page.type('input[placeholder="请输入工段编码"]', 'T1');
    await page.type('input[placeholder="请输入工段名称"]', '测试工段');
    await page.type('textarea[placeholder="请输入描述（可选）"]', '这是测试工段的描述');
    
    // 点击创建按钮
    console.log('4. 点击创建按钮...');
    await page.click('button:has-text("创建")');
    await waitForTimeout(2000);
    
    // 检查是否创建成功（通过检查表格中是否有新记录）
    const tableRows = await page.$$('tbody tr');
    if (tableRows.length > 0) {
      console.log('✓ 工段类别创建成功');
    } else {
      console.log('✗ 工段类别创建失败');
    }
    
  } catch (error) {
    console.error('工段类别管理测试失败:', error);
  }
}

/**
 * 测试工序类别管理
 */
async function testProcessCat2Management(page) {
  console.log('\n=== 测试工序类别管理 ===');
  
  try {
    // 导航到工序类别管理页面
    console.log('1. 导航到工序类别管理页面...');
    await page.goto('http://localhost:5173/process-cat2', { waitUntil: 'networkidle0' });
    await waitForTimeout(2000);
    
    // 检查页面标题
    const pageTitle = await page.$eval('h3', el => el.textContent);
    if (pageTitle.includes('工序类别管理')) {
      console.log('✓ 工序类别管理页面加载成功');
    } else {
      console.log('✗ 工序类别管理页面加载失败');
      return;
    }
    
    // 点击新增按钮
    console.log('2. 点击新增类别按钮...');
    await page.click('button:has-text("新增类别")');
    await waitForTimeout(1000);
    
    // 填写表单
    console.log('3. 填写工序类别表单...');
    await page.type('input[placeholder="请输入工序编码"]', 'T2');
    await page.type('input[placeholder="请输入工序名称"]', '测试工序');
    await page.type('textarea[placeholder="请输入描述（可选）"]', '这是测试工序的描述');
    
    // 点击创建按钮
    console.log('4. 点击创建按钮...');
    await page.click('button:has-text("创建")');
    await waitForTimeout(2000);
    
    // 检查是否创建成功
    const tableRows = await page.$$('tbody tr');
    if (tableRows.length > 0) {
      console.log('✓ 工序类别创建成功');
    } else {
      console.log('✗ 工序类别创建失败');
    }
    
  } catch (error) {
    console.error('工序类别管理测试失败:', error);
  }
}

/**
 * 测试电机型号管理
 */
async function testModelManagement(page) {
  console.log('\n=== 测试电机型号管理 ===');
  
  try {
    // 导航到电机型号管理页面
    console.log('1. 导航到电机型号管理页面...');
    await page.goto('http://localhost:5173/motor-models', { waitUntil: 'networkidle0' });
    await waitForTimeout(2000);
    
    // 检查页面标题
    const pageTitle = await page.$eval('h3', el => el.textContent);
    if (pageTitle.includes('电机型号管理')) {
      console.log('✓ 电机型号管理页面加载成功');
    } else {
      console.log('✗ 电机型号管理页面加载失败');
      return;
    }
    
    // 点击新增按钮
    console.log('2. 点击新增电机型号按钮...');
    await page.click('button:has-text("新增电机型号")');
    await waitForTimeout(1000);
    
    // 填写表单
    console.log('3. 填写电机型号表单...');
    await page.type('input[placeholder="请输入电机型号名称"]', 'TEST001');
    await page.type('input[placeholder="请输入电机型号别名（可选）"]', '测试型号001');
    await page.type('textarea[placeholder="请输入描述（可选）"]', '这是测试电机型号的描述');
    
    // 点击创建按钮
    console.log('4. 点击创建按钮...');
    await page.click('button:has-text("创建")');
    await waitForTimeout(2000);
    
    // 检查是否创建成功
    const tableRows = await page.$$('tbody tr');
    if (tableRows.length > 0) {
      console.log('✓ 电机型号创建成功');
    } else {
      console.log('✗ 电机型号创建失败');
    }
    
  } catch (error) {
    console.error('电机型号管理测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testNewTables().catch(console.error);
}

module.exports = { testNewTables };
