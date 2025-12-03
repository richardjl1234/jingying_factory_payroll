const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取命令行参数
const args = process.argv.slice(2);
const env = args[0] || 'LOCAL'; // 默认测试本地环境

// 根据环境决定测试地址
const baseUrl = env.toUpperCase() === 'CLOUD' ? 'http://124.220.108.154' : 'http://localhost:80';

console.log(`=== 测试环境: ${env.toUpperCase()} ===`);
console.log(`测试地址: ${baseUrl}`);

async function testUserManagement() {
  // 启动浏览器，禁用扩展
    const browser = await puppeteer.launch({
      headless: true, // 无头模式，避免扩展问题
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
    // 打开新页面
    const page = await browser.newPage();
    
    // 提前开始捕获控制台日志
    const consoleLogs = [];
    page.on('console', message => {
      consoleLogs.push(message.text());
      console.log('浏览器控制台:', message.text());
    });
    
    // 访问登录页面
    await page.goto(`${baseUrl}/login`);
    console.log('访问登录页面成功');
    
    // 等待页面加载完成
    await waitForTimeout(2000);
    
    // 尝试使用Ant Design的表单选择器
    await page.waitForSelector('.ant-form-item-control-input-content', { timeout: 10000 });
    console.log('登录表单加载完成');
    
    // 尝试使用nth-child选择器来定位输入框
    const inputElements = await page.$$('input.ant-input');
    if (inputElements.length >= 2) {
      // 输入用户名
      await inputElements[0].type('test');
      // 输入密码
      await inputElements[1].type('test123');
      console.log('输入用户名和密码完成');
      
      // 点击登录按钮
      const button = await page.$('button.ant-btn-primary');
      await button.click();
      console.log('点击登录按钮');
    } else {
      throw new Error('无法找到足够的输入框元素');
    }
    
    // 等待登录成功，页面跳转到首页
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('登录成功，跳转到首页');
    
    // 登录后等待3秒，确认是否稳定
    await waitForTimeout(3000);
    console.log('登录后等待3秒完成');
    
    // 检查当前页面URL，确认是否真的在首页
    const currentUrl = page.url();
    console.log('当前页面URL:', currentUrl);
    
    // 检查页面中是否包含首页元素
    const hasHomeElement = await page.$eval('body', body => body.innerHTML.includes('首页') || body.innerHTML.includes('dashboard'));
    console.log('页面包含首页元素:', hasHomeElement);
    
    // 截图保存首页
    await page.screenshot({ path: `${env.toLowerCase()}_home_page.png` });
    console.log('保存首页截图');
    
    // 再次截图，确保页面稳定
    await waitForTimeout(1000);
    await page.screenshot({ path: `${env.toLowerCase()}_home_page_2.png` });
    console.log('保存首页稳定截图');
    
    // 检查localStorage中是否有token
    const localStorageToken = await page.evaluate(() => localStorage.getItem('token'));
    console.log('localStorage中的token:', localStorageToken ? '存在' : '不存在');
    
    // 检查localStorage中是否有用户信息
    const localStorageUser = await page.evaluate(() => localStorage.getItem('user'));
    console.log('localStorage中的用户信息:', localStorageUser ? '存在' : '不存在');
    
    // 检查页面是否重定向回登录页
    if (currentUrl.includes('/login')) {
      console.error('登录失败，页面重定向回登录页');
      throw new Error('登录失败，页面重定向回登录页');
    }
    
    // 导航到用户管理页面
    await page.goto(`${baseUrl}/users`);
    console.log('导航到用户管理页面');
    
    // 等待页面加载完成
    await waitForTimeout(3000);
    
    // 截图保存用户管理页面
    await page.screenshot({ path: `${env.toLowerCase()}_user_management_page.png` });
    console.log('保存用户管理页面截图');
    
    // 检查页面是否有内容
    const pageContent = await page.content();
    const hasUserManagement = pageContent.includes('用户管理');
    const hasAddUserButton = pageContent.includes('添加用户');
    
    console.log('页面包含"用户管理":', hasUserManagement);
    console.log('页面包含"添加用户"按钮:', hasAddUserButton);
    
    // 检查是否有用户列表
    const userRows = await page.$$eval('table tr', rows => rows.length);
    console.log('用户列表行数:', userRows);
    
    // 检查页面内容长度
    console.log('页面内容长度:', pageContent.length);
    
    // 等待一段时间，确保所有日志都被捕获
    await waitForTimeout(2000);
    
    // 保存控制台日志到文件
    const fs = require('fs');
    fs.writeFileSync(`${env.toLowerCase()}_console_logs.txt`, consoleLogs.join('\n'));
    console.log('保存控制台日志到文件');
    
    // 检查是否有错误日志
    const errorLogs = consoleLogs.filter(log => log.toLowerCase().includes('error') || log.toLowerCase().includes('failed'));
    if (errorLogs.length > 0) {
      console.log('发现错误日志:', errorLogs);
    } else {
      console.log('未发现错误日志');
    }
    
    // 关闭浏览器
    await browser.close();
    
    // 返回测试结果
    return {
      success: hasUserManagement && hasAddUserButton,
      userRows: userRows,
      hasErrors: errorLogs.length > 0,
      errorLogs: errorLogs
    };
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    await browser.close();
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
testUserManagement().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 用户管理页面测试成功');
    console.log(`📋 用户列表行数: ${result.userRows}`);
    if (result.hasErrors) {
      console.log('⚠️  发现错误日志，建议检查');
    } else {
      console.log('✅ 未发现错误日志');
    }
  } else {
    console.log('❌ 用户管理页面测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
    if (result.errorLogs) {
      console.log('📋 错误日志:', result.errorLogs);
    }
  }
});
