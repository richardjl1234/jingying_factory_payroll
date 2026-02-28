const puppeteer = require('puppeteer');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testColumnSequence() {
  console.log('Testing column sequence...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
    });
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for React to render
    await delay(3000);
    
    // Get page content
    const content = await page.content();
    console.log('Page loaded, checking content...');
    
    // Take a screenshot to see the page
    await page.screenshot({ path: 'login_page.png' });
    console.log('Login page screenshot saved');
    
    // Try to find username input
    const usernameInput = await page.$('input#username');
    if (usernameInput) {
      console.log('Found username input');
    } else {
      console.log('Username input not found, looking for any input...');
      const inputs = await page.$$('input');
      console.log('Found', inputs.length, 'inputs');
      
      // Let's also check for any element with username-related text
      const body = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
      console.log('Page HTML preview:', body);
    }
    
    // Login
    console.log('Logging in...');
    // Use Ant Design form inputs - they don't have IDs so we use name attribute
    // Let's try using the placeholder instead
    await page.type('input[placeholder="用户名"]', 'root');
    await page.type('input[placeholder="密码"]', 'root123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await delay(3000);
    console.log('Logged in!');
    
    // Navigate to Salary Record page (note: it's /salary-records with 's')
    console.log('Navigating to Salary Record page...');
    await page.goto('http://localhost:8000/salary-records', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(5000);
    console.log('Current URL:', await page.url());
    
    // Wait for the page to load
    await delay(3000);
    
    // Click the "添加工作记录" button
    console.log('Clicking 添加工作记录 button...');
    
    // First, let's check if worker and month are selected
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    console.log('Page state:', pageState);
    
    const buttons = await page.$$('button');
    let buttonFound = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      console.log('Button text:', text);
      if (text && text.includes('添加工作记录')) {
        // Check if button is disabled
        const isDisabled = await page.evaluate(el => el.disabled, button);
        console.log('Button disabled:', isDisabled);
        
        console.log('Found button, clicking...');
        await button.click();
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      console.log('Add work record button not found!');
    }
    
    // Wait for modal to appear
    await delay(2000);
    
    // Find the input field for 工段类别代码
    console.log('Looking for 工段类别代码 input...');
    
    // Wait for modal to fully appear
    await delay(2000);
    
    // Get all inputs and their details
    const allInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        placeholder: input.placeholder,
        id: input.id,
        className: input.className
      }));
    });
    console.log('All inputs on page:', JSON.stringify(allInputs));
    
    // Try to find the input with "工段类别代码" placeholder
    const inputFound = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('工段类别代码')) {
          return true;
        }
      }
      return false;
    });
    
    if (inputFound) {
      console.log('Found 工段类别代码 input, typing A...');
      await page.type('input[placeholder*="工段类别代码"]', 'A');
      await delay(1000);
      
      // Press Enter or wait for dropdown
      await page.keyboard.press('Enter');
      await delay(3000);
      
      console.log('After typing A - waiting for table...');
    } else {
      console.log('Input not found!');
    }
    
    // Take screenshot of the modal with table
    await delay(2000);
    await page.screenshot({ path: 'column_seq_test_final.png' });
    console.log('Final screenshot saved');
    
    // Wait for the quota table to appear
    await delay(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'column_seq_test.png' });
    console.log('Screenshot saved to column_seq_test.png');
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test error:', error);
    // Take screenshot on error
    try {
      await page.screenshot({ path: 'column_seq_error.png' });
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

testColumnSequence();
