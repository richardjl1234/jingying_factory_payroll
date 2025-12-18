const puppeteer = require('puppeteer');
const fs = require('fs');

// Test credentials
const TEST_USERNAME = 'test';
const TEST_PASSWORD = 'test123';
const BASE_URL = 'http://localhost:8000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name) {
    const screenshotPath = `test/screenshots/${name}_${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
}

async function capturePageInfo(page) {
    const pageInfo = await page.evaluate(() => {
        return {
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML.substring(0, 5000), // First 5000 chars
            localStorage: JSON.stringify(localStorage),
            sessionStorage: JSON.stringify(sessionStorage),
            cookies: document.cookie,
            bodyText: document.body.innerText.substring(0, 2000), // First 2000 chars
            consoleErrors: window.consoleErrors || []
        };
    });
    return pageInfo;
}

async function testLogin() {
    console.log('=== Starting Basic Login Test ===');
    console.log(`Testing URL: ${BASE_URL}/login`);
    console.log(`Credentials: ${TEST_USERNAME} / ${TEST_PASSWORD}`);
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Capture console errors
    await page.evaluateOnNewDocument(() => {
        window.consoleErrors = [];
        const originalConsoleError = console.error;
        console.error = function(...args) {
            window.consoleErrors.push(args.join(' '));
            originalConsoleError.apply(console, args);
        };
    });
    
    try {
        // Create screenshots directory
        if (!fs.existsSync('test/screenshots')) {
            fs.mkdirSync('test/screenshots', { recursive: true });
        }
        
        // Step 1: Navigate to login page
        console.log('\n[Step 1] Navigating to login page...');
        await page.goto(`${BASE_URL}/login`, { 
            waitUntil: 'networkidle0', 
            timeout: 60000 
        });
        
        await sleep(3000);
        await captureScreenshot(page, 'login_page_loaded');
        
        // Step 2: Analyze page structure
        console.log('\n[Step 2] Analyzing page structure...');
        const pageInfo = await capturePageInfo(page);
        console.log(`Current URL: ${pageInfo.url}`);
        console.log(`Page title: ${pageInfo.title}`);
        console.log(`Has token in storage: ${pageInfo.localStorage.includes('token') ? 'YES' : 'NO'}`);
        
        // Step 3: Find login form elements
        console.log('\n[Step 3] Finding login form elements...');
        
        // Try multiple selectors for username input
        let usernameInput = null;
        let passwordInput = null;
        let loginButton = null;
        
        // Method 1: Try Ant Design inputs
        const antInputs = await page.$$('input.ant-input');
        if (antInputs.length >= 2) {
            usernameInput = antInputs[0];
            passwordInput = antInputs[1];
            console.log('✓ Found Ant Design inputs');
        }
        
        // Method 2: Try by placeholder
        if (!usernameInput || !passwordInput) {
            const allInputs = await page.$$('input');
            for (const input of allInputs) {
                const placeholder = await page.evaluate(el => el.placeholder, input);
                const type = await page.evaluate(el => el.type, input);
                
                if (placeholder && (placeholder.toLowerCase().includes('user') || 
                                   placeholder.toLowerCase().includes('name') ||
                                   placeholder.toLowerCase().includes('用户名'))) {
                    usernameInput = input;
                } else if (type === 'password') {
                    passwordInput = input;
                }
            }
            if (usernameInput || passwordInput) {
                console.log('✓ Found inputs by placeholder/type');
            }
        }
        
        // Method 3: Try any input
        if (!usernameInput || !passwordInput) {
            const inputs = await page.$$('input');
            if (inputs.length >= 2) {
                usernameInput = inputs[0];
                passwordInput = inputs[1];
                console.log('✓ Found inputs by position');
            }
        }
        
        if (!usernameInput) {
            console.error('✗ ERROR: Could not find username input');
            console.error('Available inputs:', await page.$$eval('input', inputs => inputs.map(i => ({
                type: i.type,
                placeholder: i.placeholder,
                className: i.className,
                id: i.id,
                name: i.name
            }))));
            throw new Error('Username input not found');
        }
        
        if (!passwordInput) {
            console.error('✗ ERROR: Could not find password input');
            throw new Error('Password input not found');
        }
        
        // Find login button
        // Method 1: Ant Design primary button
        const primaryButtons = await page.$$('button.ant-btn-primary');
        if (primaryButtons.length > 0) {
            loginButton = primaryButtons[0];
            console.log('✓ Found Ant Design primary button');
        }
        
        // Method 2: Button with login text
        if (!loginButton) {
            const loginButtons = await page.$x("//button[contains(text(), '登录')]");
            if (loginButtons.length > 0) {
                loginButton = loginButtons[0];
                console.log('✓ Found button with "登录" text');
            }
        }
        
        // Method 3: Button with type submit
        if (!loginButton) {
            const submitButtons = await page.$$('button[type="submit"]');
            if (submitButtons.length > 0) {
                loginButton = submitButtons[0];
                console.log('✓ Found submit button');
            }
        }
        
        // Method 4: Any button
        if (!loginButton) {
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
                loginButton = buttons[buttons.length - 1];
                console.log('✓ Found any button (last one)');
            }
        }
        
        if (!loginButton) {
            console.error('✗ ERROR: Could not find login button');
            console.error('Available buttons:', await page.$$eval('button', buttons => buttons.map(b => ({
                text: b.innerText,
                type: b.type,
                className: b.className
            }))));
            throw new Error('Login button not found');
        }
        
        // Step 4: Enter credentials
        console.log('\n[Step 4] Entering credentials...');
        await usernameInput.type(TEST_USERNAME);
        await passwordInput.type(TEST_PASSWORD);
        console.log('✓ Credentials entered');
        
        await captureScreenshot(page, 'credentials_entered');
        
        // Step 5: Click login button
        console.log('\n[Step 5] Clicking login button...');
        await loginButton.click();
        console.log('✓ Login button clicked');
        
        // Step 6: Wait for navigation
        console.log('\n[Step 6] Waiting for navigation (15 seconds)...');
        await sleep(15000);
        
        await captureScreenshot(page, 'after_login_click');
        
        // Step 7: Check login result
        console.log('\n[Step 7] Checking login result...');
        const currentUrl = page.url();
        console.log(`Current URL after login attempt: ${currentUrl}`);
        
        const pageInfoAfter = await capturePageInfo(page);
        console.log(`Has token in storage: ${pageInfoAfter.localStorage.includes('token') ? 'YES' : 'NO'}`);
        
        // Check for error messages on page
        const errorText = await page.evaluate(() => {
            // Look for error messages
            const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .ant-message-error, .ant-alert-error');
            let errors = [];
            errorElements.forEach(el => {
                if (el.innerText && el.innerText.trim()) {
                    errors.push(el.innerText.trim());
                }
            });
            
            // Also check for any text containing "失败" (failure) or "错误" (error)
            const bodyText = document.body.innerText;
            if (bodyText.includes('失败') || bodyText.includes('错误') || bodyText.includes('invalid') || bodyText.includes('Invalid')) {
                const lines = bodyText.split('\n');
                lines.forEach(line => {
                    if (line.includes('失败') || line.includes('错误') || line.includes('invalid') || line.includes('Invalid')) {
                        errors.push(line.trim());
                    }
                });
            }
            
            return errors;
        });
        
        if (errorText.length > 0) {
            console.error('✗ ERROR: Found error messages on page:');
            errorText.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
        }
        
        // Check console errors
        if (pageInfoAfter.consoleErrors && pageInfoAfter.consoleErrors.length > 0) {
            console.error('✗ ERROR: Console errors detected:');
            pageInfoAfter.consoleErrors.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
        }
        
        // Determine test result
        if (currentUrl.includes('/login') || currentUrl.endsWith('/login')) {
            console.error('\n✗ TEST FAILED: Still on login page');
            console.error('Possible issues:');
            console.error('  1. Frontend not communicating with backend');
            console.error('  2. Authentication API failing');
            console.error('  3. JavaScript errors preventing login');
            console.error('  4. Incorrect form submission');
            
            // Save detailed debug info
            const debugInfo = {
                timestamp: new Date().toISOString(),
                initialPageInfo: pageInfo,
                afterLoginPageInfo: pageInfoAfter,
                errorMessages: errorText,
                consoleErrors: pageInfoAfter.consoleErrors,
                screenshots: {
                    loginPage: await captureScreenshot(page, 'debug_login_page'),
                    afterClick: await captureScreenshot(page, 'debug_after_click')
                }
            };
            
            fs.writeFileSync('test/login_debug_info.json', JSON.stringify(debugInfo, null, 2));
            console.log('✓ Debug information saved to test/login_debug_info.json');
            
            throw new Error('Login failed - still on login page');
        } else if (!pageInfoAfter.localStorage.includes('token')) {
            console.warn('⚠️ WARNING: Not on login page but no token found in storage');
            console.log('✓ TEST PARTIALLY PASSED: Navigated away from login page');
            return { success: true, message: 'Navigated from login page but no token found' };
        } else {
            console.log('\n✅ TEST PASSED: Successfully logged in!');
            console.log(`  - Redirected to: ${currentUrl}`);
            console.log(`  - Token found in storage: YES`);
            return { success: true, message: 'Login successful' };
        }
        
    } catch (error) {
        console.error('\n✗ TEST FAILED WITH EXCEPTION:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Capture final screenshot
        try {
            await captureScreenshot(page, 'error_state');
        } catch (e) {
            console.error('Failed to capture error screenshot:', e.message);
        }
        
        return { success: false, message: error.message };
    } finally {
        await browser.close();
    }
}

async function runTest() {
    console.log('============================================');
    console.log('Basic Login Test - Enhanced Debugging');
    console.log('============================================');
    
    const result = await testLogin();
    
    console.log('\n============================================');
    console.log('Test Result:');
    console.log('============================================');
    console.log(`Status: ${result.success ? '✅ PASS' : '✗ FAIL'}`);
    console.log(`Message: ${result.message}`);
    
    if (!result.success) {
        console.log('\nNext steps:');
        console.log('1. Check test/screenshots/ for visual debugging');
        console.log('2. Check test/login_debug_info.json for detailed page info');
        console.log('3. Verify backend is running on http://localhost:8000');
        console.log('4. Check browser console for JavaScript errors');
        process.exit(1);
    } else {
        process.exit(0);
    }
}

// Run test
runTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
