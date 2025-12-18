const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConfirmationDialogs() {
  const baseUrl = 'http://localhost:8000';
  
  console.log(`=== 测试确认对话框 ===`);
  console.log(`测试地址: ${baseUrl}`);

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false, // 设置为false以便看到UI
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
    
    console.log('登录成功，开始测试确认对话框');
    
    // 测试工人删除确认对话框
    console.log('\n=== 测试工人删除确认对话框 ===');
    
    // 导航到工人管理页面
    console.log('导航到工人管理页面...');
    await page.goto(`${baseUrl}/worker-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工人管理页面
    await page.screenshot({ path: 'worker_management_before_delete.png' });
    console.log('保存工人管理页面截图');
    
    // 查找第一个删除按钮
    console.log('查找删除按钮...');
    
    // 方法1: 通过danger类查找
    let deleteButtons = await page.$$('button.ant-btn-danger');
    console.log(`通过ant-btn-danger类找到 ${deleteButtons.length} 个按钮`);
    
    // 方法2: 通过按钮文本查找
    if (deleteButtons.length === 0) {
      // 使用 evaluate 来查找包含"删除"文本的按钮
      const deleteTextButtons = await page.$$eval('button', buttons => 
        buttons.filter(btn => btn.textContent.includes('删除'))
      );
      console.log(`通过文本"删除"找到 ${deleteTextButtons.length} 个按钮`);
      deleteButtons = deleteTextButtons;
    }
    
    // 方法3: 通过图标查找
    if (deleteButtons.length === 0) {
      const deleteIconButtons = await page.$$('button[aria-label*="delete"], button[aria-label*="删除"]');
      console.log(`通过aria-label找到 ${deleteIconButtons.length} 个按钮`);
      deleteButtons = deleteIconButtons;
    }
    
    if (deleteButtons.length > 0) {
      console.log(`总共找到 ${deleteButtons.length} 个删除按钮`);
      
      // 点击第一个删除按钮
      console.log('点击第一个删除按钮...');
      await deleteButtons[0].click();
      await waitForTimeout(2000);
      
      // 检查确认对话框是否出现
      console.log('检查确认对话框...');
      const modalTitle = await page.$('.ant-modal-title');
      if (modalTitle) {
        const titleText = await page.evaluate(el => el.textContent, modalTitle);
        console.log(`确认对话框标题: "${titleText}"`);
        
        if (titleText.includes('确认删除工人')) {
          console.log('✅ 工人删除确认对话框显示正确');
          
          // 检查对话框内容
          const modalContent = await page.$('.ant-modal-body');
          if (modalContent) {
            const contentText = await page.evaluate(el => el.textContent, modalContent);
            console.log('对话框内容预览:', contentText.substring(0, 200) + '...');
            
            // 检查是否包含警告信息
            if (contentText.includes('删除工人将同时删除以下相关数据') || 
                contentText.includes('所有相关的工资记录') ||
                contentText.includes('此操作不可恢复')) {
              console.log('✅ 确认对话框包含正确的警告信息');
            } else {
              console.log('❌ 确认对话框缺少警告信息');
            }
          }
          
          // 截图确认对话框
          await page.screenshot({ path: 'worker_delete_confirmation_dialog.png' });
          console.log('保存确认对话框截图');
          
          // 点击取消按钮
          console.log('点击取消按钮...');
          const cancelButtons = await page.$$('.ant-modal-footer button');
          for (const btn of cancelButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('取消')) {
              await btn.click();
              break;
            }
          }
          
          await waitForTimeout(2000);
          console.log('✅ 成功取消删除操作');
        } else {
          console.log('❌ 确认对话框标题不正确');
        }
      } else {
        console.log('❌ 未找到确认对话框');
      }
    } else {
      console.log('❌ 未找到删除按钮');
    }
    
    // 测试工序删除确认对话框
    console.log('\n=== 测试工序删除确认对话框 ===');
    
    // 导航到工序管理页面
    console.log('导航到工序管理页面...');
    await page.goto(`${baseUrl}/process-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(3000);
    
    // 截图工序管理页面
    await page.screenshot({ path: 'process_management_before_delete.png' });
    console.log('保存工序管理页面截图');
    
    // 查找第一个删除按钮
    console.log('查找删除按钮...');
    
    // 方法1: 通过danger类查找
    let processDeleteButtons = await page.$$('button.ant-btn-danger');
    console.log(`通过ant-btn-danger类找到 ${processDeleteButtons.length} 个按钮`);
    
    // 方法2: 通过按钮文本查找
    if (processDeleteButtons.length === 0) {
      // 使用 evaluate 来查找包含"删除"文本的按钮
      const deleteTextButtons = await page.$$eval('button', buttons => 
        buttons.filter(btn => btn.textContent.includes('删除'))
      );
      console.log(`通过文本"删除"找到 ${deleteTextButtons.length} 个按钮`);
      processDeleteButtons = deleteTextButtons;
    }
    
    // 方法3: 通过图标查找
    if (processDeleteButtons.length === 0) {
      const deleteIconButtons = await page.$$('button[aria-label*="delete"], button[aria-label*="删除"]');
      console.log(`通过aria-label找到 ${deleteIconButtons.length} 个按钮`);
      processDeleteButtons = deleteIconButtons;
    }
    
    if (processDeleteButtons.length > 0) {
      console.log(`总共找到 ${processDeleteButtons.length} 个删除按钮`);
      
      // 点击第一个删除按钮
      console.log('点击第一个删除按钮...');
      await processDeleteButtons[0].click();
      await waitForTimeout(2000);
      
      // 检查确认对话框是否出现
      console.log('检查确认对话框...');
      const processModalTitle = await page.$('.ant-modal-title');
      if (processModalTitle) {
        const titleText = await page.evaluate(el => el.textContent, processModalTitle);
        console.log(`确认对话框标题: "${titleText}"`);
        
        if (titleText.includes('确认删除工序')) {
          console.log('✅ 工序删除确认对话框显示正确');
          
          // 检查对话框内容
          const modalContent = await page.$('.ant-modal-body');
          if (modalContent) {
            const contentText = await page.evaluate(el => el.textContent, modalContent);
            console.log('对话框内容预览:', contentText.substring(0, 200) + '...');
            
            // 检查是否包含警告信息
            if (contentText.includes('删除工序将同时删除以下相关数据') || 
                contentText.includes('所有相关的定额记录') ||
                contentText.includes('所有相关的工资记录') ||
                contentText.includes('此操作不可恢复')) {
              console.log('✅ 确认对话框包含正确的警告信息');
            } else {
              console.log('❌ 确认对话框缺少警告信息');
            }
          }
          
          // 截图确认对话框
          await page.screenshot({ path: 'process_delete_confirmation_dialog.png' });
          console.log('保存确认对话框截图');
          
          // 点击取消按钮
          console.log('点击取消按钮...');
          const cancelButtons = await page.$$('.ant-modal-footer button');
          for (const btn of cancelButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('取消')) {
              await btn.click();
              break;
            }
          }
          
          await waitForTimeout(2000);
          console.log('✅ 成功取消删除操作');
        } else {
          console.log('❌ 确认对话框标题不正确');
        }
      } else {
        console.log('❌ 未找到确认对话框');
      }
    } else {
      console.log('❌ 未找到删除按钮');
    }
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('confirmation_dialogs_console_logs.txt', consoleLogs.join('\n'));
    console.log('保存控制台日志');
    
    await waitForTimeout(3000);
    await browser.close();
    
    return {
      success: true,
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
testConfirmationDialogs().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 确认对话框测试完成');
    console.log('\n检查以下截图文件:');
    console.log('1. worker_management_before_delete.png - 工人管理页面');
    console.log('2. worker_delete_confirmation_dialog.png - 工人删除确认对话框');
    console.log('3. process_management_before_delete.png - 工序管理页面');
    console.log('4. process_delete_confirmation_dialog.png - 工序删除确认对话框');
    console.log('\n确认对话框应该显示以下警告信息:');
    console.log('- 工人删除: 警告将同时删除所有相关的工资记录');
    console.log('- 工序删除: 警告将同时删除所有相关的定额记录和工资记录');
  } else {
    console.log('❌ 确认对话框测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查应用是否运行: curl http://localhost:8000/api/health');
  console.log('2. 查看Docker容器日志: docker logs payroll-system');
  console.log('3. 查看前端控制台错误: 检查保存的日志文件 confirmation_dialogs_console_logs.txt');
});
