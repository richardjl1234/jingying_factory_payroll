"""
Login test using Pyppeteer and pytest.
This test verifies that the login functionality works correctly.
Note: Login is already handled in the conftest.py fixtures,
but this test can be used to verify login independently if needed.
"""
import pytest
import asyncio
from utils import take_screenshot, get_page_info, get_error_messages
from config import BASE_URLS, TEST_CREDENTIALS

@pytest.mark.puppeteer
class TestLogin:
    """Test class for login functionality."""
    
    @pytest.mark.asyncio
    async def test_login_page_loads(self, page):
        """Test that the login page loads correctly."""
        print("\n=== Testing login page load ===")
        
        # Navigate to login page
        await page.goto(f"{BASE_URLS['frontend']}/login", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Take screenshot
        await take_screenshot(page, 'test_login_page')
        
        # Get page info
        page_info = await get_page_info(page)
        print(f"Current URL: {page_info['url']}")
        print(f"Page title: {page_info['title']}")
        
        # Verify we're on login page
        assert '/login' in page_info['url'], "Not on login page"
        
        # Check for login form elements
        username_inputs = await page.querySelectorAll('input[type="text"], input.ant-input')
        password_inputs = await page.querySelectorAll('input[type="password"]')
        login_buttons = await page.querySelectorAll('button')
        
        print(f"Found {len(username_inputs)} username inputs")
        print(f"Found {len(password_inputs)} password inputs")
        print(f"Found {len(login_buttons)} buttons")
        
        # Should have at least one of each
        assert len(username_inputs) > 0, "No username input found"
        assert len(password_inputs) > 0, "No password input found"
        assert len(login_buttons) > 0, "No buttons found"
        
        print("✓ Login page loads correctly")
    
    @pytest.mark.asyncio
    async def test_login_functionality(self, page):
        """Test that login works with correct credentials."""
        print("\n=== Testing login functionality ===")
        
        # Navigate to login page
        await page.goto(f"{BASE_URLS['frontend']}/login", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Find login form elements
        username_inputs = await page.querySelectorAll('input[type="text"], input.ant-input')
        password_inputs = await page.querySelectorAll('input[type="password"]')
        
        # Get non-password input for username
        username_input = None
        for inp in username_inputs:
            input_type = await page.evaluate('(elem) => elem.type', inp)
            if input_type != 'password':
                username_input = inp
                break
        
        password_input = password_inputs[0] if password_inputs else None
        
        # Find login button
        login_button = None
        buttons = await page.querySelectorAll('button')
        for btn in buttons:
            button_text = await page.evaluate('(elem) => elem.textContent', btn)
            if '登录' in button_text or 'Login' in button_text:
                login_button = btn
                break
        
        if not login_button and buttons:
            login_button = buttons[0]
        
        assert username_input is not None, "Username input not found"
        assert password_input is not None, "Password input not found"
        assert login_button is not None, "Login button not found"
        
        # Enter credentials
        await username_input.type(TEST_CREDENTIALS['admin']['username'])
        await password_input.type(TEST_CREDENTIALS['admin']['password'])
        
        await take_screenshot(page, 'test_login_credentials_entered')
        
        # Click login button
        await login_button.click()
        
        # Wait for navigation
        await asyncio.sleep(3)
        
        await take_screenshot(page, 'test_login_after_click')
        
        # Check if login was successful
        current_url = page.url
        print(f"Current URL after login: {current_url}")
        
        # Check for token in localStorage
        token = await page.evaluate('() => localStorage.getItem("token")')
        
        # Check for error messages
        errors = await get_error_messages(page)
        if errors:
            print(f"Error messages found: {errors}")
        
        # Verify login success
        if '/login' in current_url:
            # Still on login page - login failed
            assert False, f"Login failed - still on login page. Errors: {errors}"
        elif not token:
            print("Warning: No token in localStorage but redirected from login page")
            # This might be OK if the app uses session cookies instead
        else:
            print("✓ Login successful with token in localStorage")
        
        print("✓ Login functionality works correctly")
    
    @pytest.mark.asyncio
    async def test_logged_in_session(self, logged_in_page):
        """Test that the logged_in_page fixture provides a logged-in session."""
        print("\n=== Testing logged_in_page fixture ===")
        
        # Check current URL - should not be login page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        assert '/login' not in current_url, "Still on login page after fixture login"
        
        # Check for token in localStorage
        token = await logged_in_page.evaluate('() => localStorage.getItem("token")')
        if token:
            print("✓ Token found in localStorage")
        else:
            print("Note: No token in localStorage (might be using session cookies)")
        
        # Take screenshot
        await take_screenshot(logged_in_page, 'test_logged_in_session')
        
        print("✓ logged_in_page fixture works correctly")


if __name__ == '__main__':
    # This allows running the test directly for debugging
    import asyncio
    
    async def run_tests():
        from pyppeteer import launch
        
        browser = await launch(headless=False)
        page = await browser.newPage()
        
        test = TestLogin()
        
        try:
            await test.test_login_page_loads(page)
            await test.test_login_functionality(page)
        finally:
            await browser.close()
    
    asyncio.run(run_tests())
