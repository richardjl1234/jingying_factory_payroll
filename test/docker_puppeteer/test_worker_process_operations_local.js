const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWorkerProcessOperationsLocal() {
  const baseUrl = 'http://localhost:8000';
  
  console.log(`=== 测试工人和工序管理操作 (本地Docker) ===`);
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

    // 访问登录页面
    console.log('访问登录页面...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('访问登录页面成功');
    
    // 等待页面加载
    await waitForTimeout(3000);
    
    // 登录
    console.log('执行登录操作...');
    
    // 查找输入框
    const antInputs = await page.$$('input.ant-input');
    if (antInputs.length >= 2) {
      const usernameInput = antInputs[0];
      const passwordInput = antInputs[1];
      await usernameInput.type('test');
      await passwordInput.type('test123');
      console.log('输入用户名和密码完成');
    } else {
      throw new Error('无法找到输入框');
    }
    
    // 查找并点击登录按钮
    const primaryButtons = await page.$$('button.ant-btn-primary');
    if (primaryButtons.length > 0) {
      await primaryButtons[0].click();
    } else {
      const loginButtons = await page.$x("//button[contains(text(), '登录')]");
      if (loginButtons.length > 0) {
        await loginButtons[0].click();
      } else {
        throw new Error('无法找到登录按钮');
      }
    }
    
    // 等待登录完成
    await waitForTimeout(5000);
    
    // 检查是否登录成功
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    
    if (!hasToken) {
      throw new Error('登录失败，未获取到token');
    }
    
    console.log('登录成功，开始测试工人和工序管理操作');
    
    // 测试直接API调用
    console.log('\n=== 测试直接API调用 ===');
    
    // 获取token用于API测试
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    
    // 测试工人API
    console.log('测试工人API...');
    const workerApiResult = await page.evaluate(async (token) => {
      try {
        // 创建工人
        const createResponse = await fetch('/api/workers/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            worker_code: 'TEST_WORKER_LOCAL',
            name: 'API测试工人本地'
          })
        });
        
        const createResult = await createResponse.json();
        
        // 删除工人
        const deleteResponse = await fetch('/api/workers/TEST_WORKER_LOCAL', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deleteResult = await deleteResponse.json();
        
        return {
          create: { status: createResponse.status, data: createResult },
          delete: { status: deleteResponse.status, data: deleteResult }
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('工人API测试结果:', JSON.stringify(workerApiResult, null, 2));
    
    // 测试工序API
    console.log('测试工序API...');
    const processApiResult = await page.evaluate(async (token) => {
      try {
        // 创建工序
        const createResponse = await fetch('/api/processes/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            process_code: 'TEST_PROCESS_LOCAL',
            name: 'API测试工序本地',
            category: '精加工',
            description: 'API测试工序描述本地'
          })
        });
        
        const createResult = await createResponse.json();
        
        // 删除工序
        const deleteResponse = await fetch('/api/processes/TEST_PROCESS_LOCAL', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deleteResult = await deleteResponse.json();
        
        return {
          create: { status: createResponse.status, data: createResult },
          delete: { status: deleteResponse.status, data: deleteResult }
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('工序API测试结果:', JSON.stringify(processApiResult, null, 2));
    
    // 测试UI操作 - 导航到工人管理页面
    console.log('\n=== 测试UI操作 ===');
    
    // 导航到工人管理页面
    console.log('导航到工人管理页面...');
    await page.goto(`${baseUrl}/worker-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工人管理页面
    await page.screenshot({ path: 'worker_management_page_local.png' });
    console.log('保存工人管理页面截图');
    
    // 检查页面内容
    const pageContent = await page.content();
    console.log('页面内容长度:', pageContent.length);
    
    // 导航到工序管理页面
    console.log('导航到工序管理页面...');
    await page.goto(`${baseUrl}/process-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工序管理页面
    await page.screenshot({ path: 'process_management_page_local.png' });
    console.log('保存工序管理页面截图');
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('worker_process_console_logs_local.txt', consoleLogs.join('\n'));
    console.log('保存控制台日志');
    
    await browser.close();
    
    return {
      success: true,
      workerApiTest: workerApiResult,
      processApiTest: processApiResult,
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
testWorkerProcessOperationsLocal().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 工人和工序管理操作测试完成');
    
    // 检查API测试结果
    let allTestsPassed = true;
    
    if (result.workerApiTest && !result.workerApiTest.error) {
      const createStatus = result.workerApiTest.create.status;
      const deleteStatus = result.workerApiTest.delete.status;
      console.log(`📋 工人API - 创建: ${createStatus}, 删除: ${deleteStatus}`);
      
      if (createStatus === 201 && deleteStatus === 200) {
        console.log('✅ 工人API测试成功');
      } else {
        console.log('❌ 工人API测试失败');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 工人API测试失败:', result.workerApiTest?.error);
      allTestsPassed = false;
    }
    
    if (result.processApiTest && !result.processApiTest.error) {
      const createStatus = result.processApiTest.create.status;
      const deleteStatus = result.processApiTest.delete.status;
      console.log(`📋 工序API - 创建: ${createStatus}, 删除: ${deleteStatus}`);
      
      if (createStatus === 201 && deleteStatus === 200) {
        console.log('✅ 工序API测试成功');
      } else {
        console.log('❌ 工序API测试失败');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 工序API测试失败:', result.processApiTest?.error);
      allTestsPassed = false;
    }
    
    if (allTestsPassed) {
      console.log('\n🎉 所有测试通过！');
    } else {
      console.log('\n⚠️  部分测试失败，请检查日志');
    }
  } else {
    console.log('❌ 工人和工序管理操作测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查后端API是否正常: curl http://localhost:8000/api/health');
  console.log('2. 查看Docker容器日志: docker logs payroll-test');
  console.log('3. 查看前端控制台错误: 检查保存的日志文件 worker_process_console_logs_local.txt');
  console.log('4. 检查生成的截图: worker_management_page_local.png 和 process_management_page_local.png');
});
