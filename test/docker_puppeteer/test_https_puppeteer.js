const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testHTTPSLogin() {
  const baseUrl = 'https://124.220.108.154';
  
  console.log(`=== 测试HTTPS登录 ===`);
  console.log(`测试地址: ${baseUrl}`);
  console.log('注意: 由于使用自签名证书，需要忽略SSL错误');

  // 启动浏览器，忽略SSL错误
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-popup-blocking',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors', // 忽略证书错误
      '--ignore-certificate-errors-spki-list',
      '--ignore-ssl-errors'
    ],
    ignoreHTTPSErrors: true // Puppeteer忽略HTTPS错误
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

    // 访问登录页面
    console.log('访问登录页面...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('访问登录页面成功');
    
    // 等待页面加载
    await waitForTimeout(3000);
    
    // 截图当前页面
    await page.screenshot({ path: 'https_login_page.png' });
    console.log('保存登录页面截图');
    
    // 获取页面HTML以调试
    const pageContent = await page.content();
    console.log('页面内容长度:', pageContent.length);
    
    // 查找所有输入框
    const inputElements = await page.$$('input');
    console.log(`找到 ${inputElements.length} 个输入框`);
    
    // 查找所有按钮
    const buttonElements = await page.$$('button');
    console.log(`找到 ${buttonElements.length} 个按钮`);
    
    // 尝试不同的选择器策略
    let usernameInput, passwordInput, loginButton;
    
    // 策略1: 通过placeholder查找
    const inputsByPlaceholder = await page.$$eval('input', inputs => 
      inputs.map((input, i) => ({ 
        index: i, 
        placeholder: input.placeholder,
        type: input.type,
        className: input.className
      }))
    );
    console.log('输入框placeholder:', inputsByPlaceholder);
    
    // 策略2: 通过类名查找
    const antInputs = await page.$$('input.ant-input');
    console.log(`找到 ${antInputs.length} 个ant-input输入框`);
    
    if (antInputs.length >= 2) {
      usernameInput = antInputs[0];
      passwordInput = antInputs[1];
      console.log('使用ant-input选择器');
    } else if (inputElements.length >= 2) {
      // 使用前两个输入框
      usernameInput = inputElements[0];
      passwordInput = inputElements[1];
      console.log('使用前两个输入框');
    } else {
      throw new Error('无法找到足够的输入框');
    }
    
    // 输入用户名和密码
    await usernameInput.type('test');
    await passwordInput.type('test123');
    console.log('输入用户名和密码完成');
    
    // 查找登录按钮
    const primaryButtons = await page.$$('button.ant-btn-primary');
    if (primaryButtons.length > 0) {
      loginButton = primaryButtons[0];
    } else if (buttonElements.length > 0) {
      loginButton = buttonElements[0];
    } else {
      // 通过文本查找
      loginButton = await page.$x("//button[contains(text(), '登录')]");
      if (loginButton.length > 0) {
        loginButton = loginButton[0];
      } else {
        throw new Error('无法找到登录按钮');
      }
    }
    
    console.log('点击登录按钮...');
    await loginButton.click();
    
    // 等待导航或页面变化
    await waitForTimeout(5000);
    
    // 检查当前URL
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    // 截图登录后页面
    await page.screenshot({ path: 'https_after_login.png' });
    console.log('保存登录后截图');
    
    // 检查是否登录成功
    const isLoginPage = currentUrl.includes('/login');
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    
    console.log('是否仍在登录页:', isLoginPage);
    console.log('是否有token:', hasToken ? '是' : '否');
    
    // 检查localStorage
    const localStorageItems = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    console.log('localStorage内容:', JSON.stringify(localStorageItems, null, 2));
    
    // 检查页面内容
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('页面文本内容 (前500字符):', bodyText.substring(0, 500));
    
    // 检查是否有错误信息
    const hasError = bodyText.includes('错误') || bodyText.includes('Error') || 
                     bodyText.includes('失败') || bodyText.includes('invalid');
    console.log('页面是否有错误信息:', hasError);
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('https_console_logs.txt', consoleLogs.join('\n'));
    console.log('保存控制台日志');
    
    // 检查API调用
    const networkLogs = [];
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if (url.includes('/api/')) {
        networkLogs.push(`${status} ${url}`);
        console.log(`API响应: ${status} ${url}`);
      }
    });
    
    // 等待更多网络请求
    await waitForTimeout(3000);
    
    // 测试直接API调用
    console.log('\n=== 测试直接API调用 ===');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'test',
            password: 'test123'
          })
        });
        return {
          status: response.status,
          ok: response.ok,
          text: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('直接API调用结果:', JSON.stringify(apiResponse, null, 2));
    
    await browser.close();
    
    return {
      success: !isLoginPage && hasToken,
      url: currentUrl,
      hasToken: !!hasToken,
      apiResponse: apiResponse,
      consoleLogs: consoleLogs
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
testHTTPSLogin().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ HTTPS登录测试成功');
    console.log(`📋 登录后URL: ${result.url}`);
    console.log(`📋 是否有token: ${result.hasToken}`);
  } else {
    console.log('❌ HTTPS登录测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
    console.log(`📋 登录后URL: ${result.url}`);
    console.log(`📋 是否有token: ${result.hasToken}`);
    
    if (result.apiResponse) {
      console.log(`📋 API响应: ${JSON.stringify(result.apiResponse, null, 2)}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查nginx是否运行: ssh ubuntu@124.220.108.154 "docker ps | grep nginx"');
  console.log('2. 检查后端是否运行: ssh ubuntu@124.220.108.154 "curl http://localhost:8000/api/health"');
  console.log('3. 检查前端文件: ssh ubuntu@124.220.108.154 "ls -la ~/payroll-test/frontend/dist/"');
  console.log('4. 查看nginx日志: ssh ubuntu@124.220.108.154 "docker logs payroll-nginx-working"');
  console.log('5. 直接测试API: curl -k https://124.220.108.154/api/health');
});
