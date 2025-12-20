const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWorkerProcessOperations() {
  const baseUrl = 'https://124.220.108.154';
  
  console.log(`=== 测试工人和工序管理操作 ===`);
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
    
    // 测试工人管理
    console.log('\n=== 测试工人管理 ===');
    
    // 导航到工人管理页面
    console.log('导航到工人管理页面...');
    await page.goto(`${baseUrl}/worker-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工人管理页面
    await page.screenshot({ path: 'worker_management_page.png' });
    console.log('保存工人管理页面截图');
    
    // 测试添加工人
    console.log('测试添加工人...');
    try {
      // 查找添加按钮
      const addButtons = await page.$$('button.ant-btn-primary');
      let addButton = null;
      
      for (const btn of addButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('添加') || text.includes('新增') || text.includes('Add') || text.includes('Create')) {
          addButton = btn;
          break;
        }
      }
      
      if (addButton) {
        await addButton.click();
        await waitForTimeout(2000);
        
        // 查找模态框中的输入框
        const modalInputs = await page.$$('.ant-modal input.ant-input');
        if (modalInputs.length >= 2) {
          // 输入工人信息
          await modalInputs[0].type('TEST_WORKER_001');
          await modalInputs[1].type('测试工人001');
          
          // 查找确认按钮
          const modalButtons = await page.$$('.ant-modal-footer button');
          for (const btn of modalButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('确定') || text.includes('确认') || text.includes('OK') || text.includes('Submit')) {
              await btn.click();
              break;
            }
          }
          
          await waitForTimeout(3000);
          console.log('添加工人操作完成');
          
          // 检查是否添加成功
          const pageContent = await page.content();
          if (pageContent.includes('TEST_WORKER_001') || pageContent.includes('测试工人001')) {
            console.log('✅ 添加工人成功');
          } else {
            console.log('❌ 添加工人可能失败，未在页面中找到新工人');
          }
        } else {
          console.log('❌ 未找到模态框输入框，跳过添加工人测试');
        }
      } else {
        console.log('❌ 未找到添加按钮，跳过添加工人测试');
      }
    } catch (error) {
      console.log('❌ 添加工人测试失败:', error.message);
    }
    
    // 测试删除工人
    console.log('\n测试删除工人...');
    try {
      // 查找删除按钮（通常是一个垃圾桶图标）
      const deleteButtons = await page.$$('button.ant-btn-danger, button[aria-label*="delete"], button[aria-label*="删除"]');
      
      if (deleteButtons.length > 0) {
        // 点击第一个删除按钮
        await deleteButtons[0].click();
        await waitForTimeout(2000);
        
        // 查找确认删除的弹窗按钮
        const confirmButtons = await page.$$('.ant-popconfirm button');
        for (const btn of confirmButtons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('确定') || text.includes('确认') || text.includes('Yes') || text.includes('OK')) {
            await btn.click();
            break;
          }
        }
        
        await waitForTimeout(3000);
        console.log('删除工人操作完成');
      } else {
        console.log('❌ 未找到删除按钮，跳过删除工人测试');
      }
    } catch (error) {
      console.log('❌ 删除工人测试失败:', error.message);
    }
    
    // 测试工序管理
    console.log('\n=== 测试工序管理 ===');
    
    // 导航到工序管理页面
    console.log('导航到工序管理页面...');
    await page.goto(`${baseUrl}/process-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工序管理页面
    await page.screenshot({ path: 'process_management_page.png' });
    console.log('保存工序管理页面截图');
    
    // 测试添加工序
    console.log('测试添加工序...');
    try {
      // 查找添加按钮
      const addButtons = await page.$$('button.ant-btn-primary');
      let addButton = null;
      
      for (const btn of addButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('添加') || text.includes('新增') || text.includes('Add') || text.includes('Create')) {
          addButton = btn;
          break;
        }
      }
      
      if (addButton) {
        await addButton.click();
        await waitForTimeout(2000);
        
        // 查找模态框中的输入框
        const modalInputs = await page.$$('.ant-modal input.ant-input');
        if (modalInputs.length >= 3) {
          // 输入工序信息
          await modalInputs[0].type('TEST_PROCESS_001');
          await modalInputs[1].type('测试工序001');
          
          // 选择工序类别（如果有下拉框）
          const selectElements = await page.$$('.ant-modal .ant-select-selector');
          if (selectElements.length > 0) {
            await selectElements[0].click();
            await waitForTimeout(1000);
            
            // 选择第一个选项
            const options = await page.$$('.ant-select-item-option');
            if (options.length > 0) {
              await options[0].click();
            }
          }
          
          // 查找确认按钮
          const modalButtons = await page.$$('.ant-modal-footer button');
          for (const btn of modalButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('确定') || text.includes('确认') || text.includes('OK') || text.includes('Submit')) {
              await btn.click();
              break;
            }
          }
          
          await waitForTimeout(3000);
          console.log('添加工序操作完成');
          
          // 检查是否添加成功
          const pageContent = await page.content();
          if (pageContent.includes('TEST_PROCESS_001') || pageContent.includes('测试工序001')) {
            console.log('✅ 添加工序成功');
          } else {
            console.log('❌ 添加工序可能失败，未在页面中找到新工序');
          }
        } else {
          console.log('❌ 未找到模态框输入框，跳过添加工序测试');
        }
      } else {
        console.log('❌ 未找到添加按钮，跳过添加工序测试');
      }
    } catch (error) {
      console.log('❌ 添加工序测试失败:', error.message);
    }
    
    // 测试删除工序
    console.log('\n测试删除工序...');
    try {
      // 查找删除按钮
      const deleteButtons = await page.$$('button.ant-btn-danger, button[aria-label*="delete"], button[aria-label*="删除"]');
      
      if (deleteButtons.length > 0) {
        // 点击第一个删除按钮
        await deleteButtons[0].click();
        await waitForTimeout(2000);
        
        // 查找确认删除的弹窗按钮
        const confirmButtons = await page.$$('.ant-popconfirm button');
        for (const btn of confirmButtons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('确定') || text.includes('确认') || text.includes('Yes') || text.includes('OK')) {
            await btn.click();
            break;
          }
        }
        
        await waitForTimeout(3000);
        console.log('删除工序操作完成');
      } else {
        console.log('❌ 未找到删除按钮，跳过删除工序测试');
      }
    } catch (error) {
      console.log('❌ 删除工序测试失败:', error.message);
    }
    
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
            worker_code: 'API_TEST_WORKER',
            name: 'API测试工人'
          })
        });
        
        const createResult = await createResponse.json();
        
        // 删除工人
        const deleteResponse = await fetch('/api/workers/API_TEST_WORKER', {
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
            process_code: 'API_TEST_PROCESS',
            name: 'API测试工序',
            category: '精加工',
            description: 'API测试工序描述'
          })
        });
        
        const createResult = await createResponse.json();
        
        // 删除工序
        const deleteResponse = await fetch('/api/processes/API_TEST_PROCESS', {
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
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('worker_process_console_logs.txt', consoleLogs.join('\n'));
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
testWorkerProcessOperations().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 工人和工序管理操作测试完成');
    
    // 检查API测试结果
    if (result.workerApiTest && !result.workerApiTest.error) {
      const createStatus = result.workerApiTest.create.status;
      const deleteStatus = result.workerApiTest.delete.status;
      console.log(`📋 工人API - 创建: ${createStatus}, 删除: ${deleteStatus}`);
      
      if (createStatus === 201 && deleteStatus === 200) {
        console.log('✅ 工人API测试成功');
      } else {
        console.log('❌ 工人API测试失败');
      }
    }
    
    if (result.processApiTest && !result.processApiTest.error) {
      const createStatus = result.processApiTest.create.status;
      const deleteStatus = result.processApiTest.delete.status;
      console.log(`📋 工序API - 创建: ${createStatus}, 删除: ${deleteStatus}`);
      
      if (createStatus === 201 && deleteStatus === 200) {
        console.log('✅ 工序API测试成功');
      } else {
        console.log('❌ 工序API测试失败');
      }
    }
  } else {
    console.log('❌ 工人和工序管理操作测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查后端API是否正常: curl -k https://124.220.108.154/api/health');
console.log('2. 检查数据库连接: ssh ubuntu@124.220.108.154 "docker exec payroll-backend python backend/scripts/init_db.py"');
  console.log('3. 查看后端日志: ssh ubuntu@124.220.108.154 "docker logs payroll-backend"');
  console.log('4. 查看前端控制台错误: 检查保存的日志文件 worker_process_console_logs.txt');
});
