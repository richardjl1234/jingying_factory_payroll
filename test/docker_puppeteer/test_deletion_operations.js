const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDeletionOperations() {
  const baseUrl = 'http://localhost:8000';
  
  console.log(`=== 测试删除操作 (本地Docker) ===`);
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
    
    console.log('登录成功，开始测试删除操作');
    
    // 获取token用于API测试
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    
    console.log('\n=== 测试删除操作 ===');
    
    // 测试删除工人W001
    console.log('测试删除工人W001...');
    const deleteWorkerResult = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/workers/W001', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        return {
          status: response.status,
          data: result
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('删除工人W001结果:', JSON.stringify(deleteWorkerResult, null, 2));
    
    // 测试删除工序P01
    console.log('测试删除工序P01...');
    const deleteProcessResult = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/processes/P01', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        return {
          status: response.status,
          data: result
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('删除工序P01结果:', JSON.stringify(deleteProcessResult, null, 2));
    
    // 测试UI操作 - 导航到工人管理页面
    console.log('\n=== 测试UI操作 ===');
    
    // 导航到工人管理页面
    console.log('导航到工人管理页面...');
    await page.goto(`${baseUrl}/worker-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工人管理页面
    await page.screenshot({ path: 'worker_management_after_deletion.png' });
    console.log('保存工人管理页面截图');
    
    // 检查页面内容
    const workerPageContent = await page.content();
    console.log('工人管理页面内容长度:', workerPageContent.length);
    
    // 导航到工序管理页面
    console.log('导航到工序管理页面...');
    await page.goto(`${baseUrl}/process-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工序管理页面
    await page.screenshot({ path: 'process_management_after_deletion.png' });
    console.log('保存工序管理页面截图');
    
    // 检查页面内容
    const processPageContent = await page.content();
    console.log('工序管理页面内容长度:', processPageContent.length);
    
    // 验证删除是否成功 - 尝试获取已删除的工人和工序
    console.log('\n=== 验证删除结果 ===');
    
    const verifyWorkerResult = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/workers/W001', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        return {
          status: response.status,
          text: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('验证工人W001是否存在:', JSON.stringify(verifyWorkerResult, null, 2));
    
    const verifyProcessResult = await page.evaluate(async (token) => {
      try {
        const response = await fetch('/api/processes/P01', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        return {
          status: response.status,
          text: await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('验证工序P01是否存在:', JSON.stringify(verifyProcessResult, null, 2));
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('deletion_console_logs.txt', consoleLogs.join('\n'));
    console.log('保存控制台日志');
    
    await browser.close();
    
    return {
      success: true,
      deleteWorkerResult: deleteWorkerResult,
      deleteProcessResult: deleteProcessResult,
      verifyWorkerResult: verifyWorkerResult,
      verifyProcessResult: verifyProcessResult,
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
testDeletionOperations().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 删除操作测试完成');
    
    // 检查删除操作结果
    let allTestsPassed = true;
    
    if (result.deleteWorkerResult && !result.deleteWorkerResult.error) {
      const deleteStatus = result.deleteWorkerResult.status;
      console.log(`📋 删除工人W001: ${deleteStatus}`);
      
      if (deleteStatus === 200) {
        console.log('✅ 工人W001删除成功');
      } else {
        console.log('❌ 工人W001删除失败');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 工人W001删除测试失败:', result.deleteWorkerResult?.error);
      allTestsPassed = false;
    }
    
    if (result.deleteProcessResult && !result.deleteProcessResult.error) {
      const deleteStatus = result.deleteProcessResult.status;
      console.log(`📋 删除工序P01: ${deleteStatus}`);
      
      if (deleteStatus === 200) {
        console.log('✅ 工序P01删除成功');
      } else {
        console.log('❌ 工序P01删除失败');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 工序P01删除测试失败:', result.deleteProcessResult?.error);
      allTestsPassed = false;
    }
    
    // 验证删除结果
    if (result.verifyWorkerResult && !result.verifyWorkerResult.error) {
      const verifyStatus = result.verifyWorkerResult.status;
      console.log(`📋 验证工人W001: ${verifyStatus}`);
      
      if (verifyStatus === 404) {
        console.log('✅ 工人W001已成功删除（返回404）');
      } else {
        console.log('⚠️  工人W001可能未被完全删除');
        allTestsPassed = false;
      }
    }
    
    if (result.verifyProcessResult && !result.verifyProcessResult.error) {
      const verifyStatus = result.verifyProcessResult.status;
      console.log(`📋 验证工序P01: ${verifyStatus}`);
      
      if (verifyStatus === 404) {
        console.log('✅ 工序P01已成功删除（返回404）');
      } else {
        console.log('⚠️  工序P01可能未被完全删除');
        allTestsPassed = false;
      }
    }
    
    if (allTestsPassed) {
      console.log('\n🎉 所有删除操作测试通过！');
    } else {
      console.log('\n⚠️  部分删除操作测试失败，请检查日志');
    }
  } else {
    console.log('❌ 删除操作测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查后端API是否正常: curl http://localhost:8000/api/health');
  console.log('2. 查看Docker容器日志: docker logs payroll_test');
  console.log('3. 查看前端控制台错误: 检查保存的日志文件 deletion_console_logs.txt');
  console.log('4. 检查生成的截图: worker_management_after_deletion.png 和 process_management_after_deletion.png');
  console.log('5. 测试数据已重新生成，可以重新运行测试');
});
