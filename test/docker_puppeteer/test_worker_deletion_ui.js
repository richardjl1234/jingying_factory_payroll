const puppeteer = require('puppeteer');

// 自定义等待函数
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWorkerDeletionUI() {
  const baseUrl = 'http://localhost:8000';
  
  console.log(`=== 测试工人删除UI操作 ===`);
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
    
    console.log('登录成功，开始测试工人删除UI操作');
    
    // 导航到工人管理页面
    console.log('导航到工人管理页面...');
    await page.goto(`${baseUrl}/worker-management`, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForTimeout(5000);
    
    // 等待表格加载 - 尝试多次等待
    console.log('等待工人表格加载...');
    let initialWorkerCount = 0;
    let retryCount = 0;
    const maxRetries = 10;
    
    while (retryCount < maxRetries && initialWorkerCount === 0) {
      initialWorkerCount = await page.$$eval('table tbody tr', rows => rows.length);
      if (initialWorkerCount === 0) {
        console.log(`等待表格加载... (尝试 ${retryCount + 1}/${maxRetries})`);
        await waitForTimeout(1000);
        retryCount++;
      }
    }
    
    console.log(`初始工人数量: ${initialWorkerCount}`);
    
    if (initialWorkerCount === 0) {
      // 尝试其他选择器
      console.log('尝试其他表格选择器...');
      const allTables = await page.$$('table');
      console.log(`找到 ${allTables.length} 个表格`);
      
      for (let i = 0; i < allTables.length; i++) {
        const tableRows = await allTables[i].$$eval('tr', rows => rows.length);
        console.log(`表格 ${i} 有 ${tableRows} 行`);
      }
      
      // 检查页面内容
      const pageContent = await page.content();
      console.log('页面内容预览:', pageContent.substring(0, 500));
      
      console.log('❌ 没有工人可删除，测试终止');
      await browser.close();
      return { success: false, error: '没有工人可删除' };
    }
    
    // 截图删除前的页面
    await page.screenshot({ path: 'worker_deletion_before.png' });
    console.log('保存删除前页面截图');
    
    // 获取第一个工人的信息
    const firstWorkerInfo = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      if (!firstRow) return null;
      const cells = firstRow.querySelectorAll('td');
      return {
        workerCode: cells[0]?.textContent?.trim(),
        name: cells[1]?.textContent?.trim()
      };
    });
    
    console.log(`准备删除工人: ${firstWorkerInfo.workerCode} - ${firstWorkerInfo.name}`);
    
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
    
    if (deleteButtons.length === 0) {
      throw new Error('未找到删除按钮');
    }
    
    console.log(`总共找到 ${deleteButtons.length} 个删除按钮`);
    
    // 点击第一个删除按钮
    console.log('点击第一个删除按钮...');
    await deleteButtons[0].click();
    await waitForTimeout(2000);
    
    // 检查确认对话框是否出现
    console.log('检查确认对话框...');
    const modalTitle = await page.$('.ant-modal-title');
    if (!modalTitle) {
      throw new Error('未找到确认对话框');
    }
    
    const titleText = await page.evaluate(el => el.textContent, modalTitle);
    console.log(`确认对话框标题: "${titleText}"`);
    
    if (!titleText.includes('确认删除工人')) {
      throw new Error('确认对话框标题不正确');
    }
    
    console.log('✅ 工人删除确认对话框显示正确');
    
    // 截图确认对话框
    await page.screenshot({ path: 'worker_deletion_confirmation.png' });
    console.log('保存确认对话框截图');
    
    // 点击确定删除按钮
    console.log('点击确定删除按钮...');
    const modalFooterButtons = await page.$$('.ant-modal-footer button');
    let deleteConfirmed = false;
    
    for (const btn of modalFooterButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('确定删除') || text.includes('确认删除') || text.includes('删除')) {
        await btn.click();
        deleteConfirmed = true;
        break;
      }
    }
    
    if (!deleteConfirmed) {
      // 如果没有找到文本匹配的按钮，点击第一个非取消按钮
      for (const btn of modalFooterButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (!text.includes('取消')) {
          await btn.click();
          deleteConfirmed = true;
          break;
        }
      }
    }
    
    if (!deleteConfirmed) {
      throw new Error('未找到确定删除按钮');
    }
    
    console.log('✅ 已点击确定删除按钮');
    
    // 等待删除操作完成
    await waitForTimeout(5000);
    
    // 检查是否显示成功消息
    console.log('检查是否显示成功消息...');
    const successMessage = await page.evaluate(() => {
      // 查找包含"成功"的消息元素
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('工人删除成功')) {
          return el.textContent;
        }
      }
      return null;
    });
    
    if (successMessage) {
      console.log(`✅ ${successMessage}`);
    } else {
      console.log('⚠️  未检测到成功消息，但可能已删除成功');
    }
    
    // 等待页面刷新
    await waitForTimeout(3000);
    
    // 获取删除后的工人数量
    const finalWorkerCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`删除后工人数量: ${finalWorkerCount}`);
    
    // 截图删除后的页面
    await page.screenshot({ path: 'worker_deletion_after.png' });
    console.log('保存删除后页面截图');
    
    // 检查工人数量是否减少
    if (finalWorkerCount < initialWorkerCount) {
      console.log(`✅ 工人数量从 ${initialWorkerCount} 减少到 ${finalWorkerCount}，删除成功`);
    } else {
      console.log(`❌ 工人数量未减少，删除可能失败`);
      console.log(`初始数量: ${initialWorkerCount}, 最终数量: ${finalWorkerCount}`);
    }
    
    // 保存控制台日志
    const fs = require('fs');
    fs.writeFileSync('worker_deletion_ui_console_logs.txt', consoleLogs.join('\n'));
    console.log('保存控制台日志');
    
    await browser.close();
    
    return {
      success: finalWorkerCount < initialWorkerCount,
      initialWorkerCount,
      finalWorkerCount,
      workerDeleted: firstWorkerInfo,
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
testWorkerDeletionUI().then(result => {
  console.log('\n=== 测试结果 ===');
  if (result.success) {
    console.log('✅ 工人删除UI测试成功');
    console.log(`📋 删除工人: ${result.workerDeleted.workerCode} - ${result.workerDeleted.name}`);
    console.log(`📋 工人数量变化: ${result.initialWorkerCount} → ${result.finalWorkerCount}`);
  } else {
    console.log('❌ 工人删除UI测试失败');
    if (result.error) {
      console.log(`📋 错误信息: ${result.error}`);
    }
  }
  
  console.log('\n=== 调试信息 ===');
  console.log('1. 检查应用是否运行: curl http://localhost:8000/api/health');
  console.log('2. 查看Docker容器日志: docker logs payroll-system');
  console.log('3. 查看前端控制台错误: 检查保存的日志文件 worker_deletion_ui_console_logs.txt');
  console.log('4. 检查截图文件:');
  console.log('   - worker_deletion_before.png - 删除前页面');
  console.log('   - worker_deletion_confirmation.png - 确认对话框');
  console.log('   - worker_deletion_after.png - 删除后页面');
});
