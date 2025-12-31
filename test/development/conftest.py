import asyncio
import pytest
import pytest_asyncio
from pyppeteer import launch
import os
from pathlib import Path
from config import BASE_URLS, TEST_CREDENTIALS, TIMEOUTS

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "puppeteer: mark test as using puppeteer browser"
    )
    
    # Configure pytest-asyncio to use function scope for event loop
    # This helps avoid the "Event loop is closed" error
    config.option.asyncio_default_fixture_loop_scope = "function"

@pytest_asyncio.fixture(scope="function")
async def browser():
    """Create a Pyppeteer browser instance for each test."""
    # Launch browser with non-headless mode to see the browser
    browser = await launch(
        headless=False,  # Changed to False to see the browser
        args=[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    )
    yield browser
    
    # Close browser after test
    await browser.close()

@pytest_asyncio.fixture(scope="function")
async def page(browser):
    """Create a Pyppeteer page instance for each test."""
    page = await browser.newPage()
    await page.setViewport({'width': 1920, 'height': 1080})
    # Set default timeout
    page.setDefaultNavigationTimeout(TIMEOUTS['long'])
    yield page

@pytest_asyncio.fixture(scope="function")
async def logged_in_page(page):
    """Login and return the logged-in page for each test."""
    print("\n=== Performing login for test ===")
    print(f"Login URL: {BASE_URLS['frontend']}/login")
    print(f"Credentials: {TEST_CREDENTIALS['admin']['username']} / {TEST_CREDENTIALS['admin']['password']}")
    
    # Navigate to login page
    await page.goto(f"{BASE_URLS['frontend']}/login", {'waitUntil': 'domcontentloaded'})
    await asyncio.sleep(1)  # Reduced sleep
    
    # Take screenshot for debugging
    screenshots_dir = Path(__file__).parent / 'screenshots'
    screenshots_dir.mkdir(exist_ok=True)
    await page.screenshot({'path': str(screenshots_dir / 'python_login_page.png')})
    
    # Find login form elements
    # Try multiple selectors for username input
    username_selectors = [
        'input.ant-input[placeholder*="用户"]',
        'input.ant-input[placeholder*="name"]',
        'input[type="text"]',
        'input.ant-input',
        'input'
    ]
    
    password_selectors = [
        'input.ant-input[type="password"]',
        'input[type="password"]'
    ]
    
    button_selectors = [
        'button.ant-btn-primary',
        'button[type="submit"]',
        'button'
    ]
    
    username_input = None
    password_input = None
    login_button = None
    
    # Find username input
    for selector in username_selectors:
        elements = await page.querySelectorAll(selector)
        if elements:
            for elem in elements:
                input_type = await page.evaluate('(elem) => elem.type', elem)
                if input_type != 'password':
                    username_input = elem
                    break
        if username_input:
            break
    
    # Find password input
    for selector in password_selectors:
        elements = await page.querySelectorAll(selector)
        if elements:
            password_input = elements[0]
            break
    
    # Find login button
    for selector in button_selectors:
        elements = await page.querySelectorAll(selector)
        if elements:
            for elem in elements:
                button_text = await page.evaluate('(elem) => elem.textContent', elem)
                if '登录' in button_text or 'Login' in button_text:
                    login_button = elem
                    break
            if login_button:
                break
            # If no button with login text, take the first button
            login_button = elements[0]
            break
    
    if not username_input or not password_input or not login_button:
        raise Exception("Could not find login form elements")
    
    # Enter credentials
    await username_input.type(TEST_CREDENTIALS['admin']['username'])
    await password_input.type(TEST_CREDENTIALS['admin']['password'])
    
    # Click login button and wait for navigation
    try:
        # Wait for navigation after clicking login button
        navigation_promise = asyncio.create_task(page.waitForNavigation({'waitUntil': 'domcontentloaded'}))
        await login_button.click()
        await navigation_promise
    except Exception as e:
        print(f"Navigation wait error (might be OK if already navigated): {e}")
        # Fallback to sleep if navigation detection fails
        await asyncio.sleep(2)
    
    # Check if login was successful
    current_url = page.url
    print(f"Current URL after login: {current_url}")
    
    # Check for token in localStorage with error handling
    token = None
    try:
        token = await page.evaluate('() => localStorage.getItem("token")')
    except Exception as e:
        print(f"Error checking localStorage (might be due to navigation): {e}")
        # If we can't check localStorage, check URL instead
        if '/login' in current_url:
            raise Exception(f"Login failed - still on login page. Error: {e}")
        else:
            print("Login successful - redirected from login page (localStorage check failed)")
    
    if token:
        print("Login successful - token found in localStorage")
    else:
        # Check if we're still on login page
        if '/login' in current_url:
            raise Exception("Login failed - still on login page")
        else:
            print("Login successful - redirected from login page")
    
    # Take screenshot after login
    await page.screenshot({'path': str(screenshots_dir / 'python_after_login.png')})
    print("=== Login completed successfully ===\n")
    
    yield page

@pytest_asyncio.fixture(scope="function", autouse=True)
async def cleanup_after_test(page):
    """Cleanup after each test."""
    yield
    
    print("\n=== Cleaning up after test ===")
    try:
        # Clear localStorage
        await page.evaluate('() => localStorage.clear()')
        print("LocalStorage cleared")
    except Exception as e:
        print(f"Error during cleanup: {e}")
    print("=== Test cleanup completed ===\n")
