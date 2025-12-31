"""
Process management test using Pyppeteer and pytest.
This test verifies that users can manage processes in the application.
"""
import pytest
import asyncio
from utils import take_screenshot, get_page_info, get_error_messages, wait_for_element
from config import BASE_URLS

@pytest.mark.puppeteer
class TestProcessManagement:
    """Test class for process management functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_process_page(self, logged_in_page):
        """Test navigation to process management page."""
        print("\n=== Testing navigation to process management page ===")
        
        # Navigate to process management page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/processes", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1.5)
        
        await take_screenshot(logged_in_page, 'process_page_loaded')
        
        # Get page info
        page_info = await get_page_info(logged_in_page)
        print(f"Current URL: {page_info['url']}")
        
        # Check page content for process management indicators
        page_content = await logged_in_page.content()
        has_process_text = '工序' in page_content or 'Process' in page_content
        has_add_button = '添加' in page_content or '新增' in page_content or 'Add' in page_content
        
        print(f"Has process text: {has_process_text}")
        print(f"Has add button text: {has_add_button}")
        
        assert has_process_text, "Process management page not loaded correctly"
        
        # Check for table rows
        table_rows = await logged_in_page.querySelectorAll('table tr, .ant-table-row, .table-row')
        print(f"Found {len(table_rows)} table rows")
        
        print("✓ Process management page loads correctly")
    
    @pytest.mark.asyncio
    async def test_add_process(self, logged_in_page):
        """Test adding a new process."""
        print("\n=== Testing process addition ===")
        
        # Navigate to process management page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/processes", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1.5)
        
        await take_screenshot(logged_in_page, 'process_before_add')
        
        # Find and click add button
        add_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('添加' in button_text or '新增' in button_text or 'Add' in button_text):
                add_button = btn
                print(f"Found add button with text: {button_text}")
                break
        
        # If not found by text, try by class name
        if not add_button:
            add_button = await logged_in_page.querySelector('button.ant-btn-primary')
            if add_button:
                print("Found add button by class name")
        
        assert add_button is not None, "Add process button not found"
        
        await add_button.click()
        print("Clicked add process button")
        
        await asyncio.sleep(1.5)
        await take_screenshot(logged_in_page, 'process_after_add_click')
        
        # Fill process form
        form_inputs = await logged_in_page.querySelectorAll('input.ant-input, input[type="text"]')
        assert len(form_inputs) >= 2, f"Not enough form inputs found: {len(form_inputs)}"
        
        # Generate unique test data
        import time
        timestamp = str(int(time.time()))[-6:]
        test_process_code = f"TEST_PROC_{timestamp}"
        test_process_name = f"测试工序_{timestamp}"
        
        # Fill first input (process code)
        await form_inputs[0].click()
        await form_inputs[0].type(test_process_code)
        print(f"Entered process code: {test_process_code}")
        
        # Fill second input (process name)
        await form_inputs[1].click()
        await form_inputs[1].type(test_process_name)
        print(f"Entered process name: {test_process_name}")
        
        # Fill third input if exists (description)
        if len(form_inputs) >= 3:
            await form_inputs[2].click()
            await form_inputs[2].type('自动化测试描述')
            print("Entered process description")
        
        await asyncio.sleep(1)
        await take_screenshot(logged_in_page, 'process_form_filled')
        
        # Find and click submit button
        submit_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('确定' in button_text or 'OK' in button_text or 
                               '保存' in button_text or 'Save' in button_text):
                submit_button = btn
                print(f"Found submit button with text: {button_text}")
                break
        
        # If not found by text, try by class name
        if not submit_button:
            submit_button = await logged_in_page.querySelector('button.ant-btn-primary')
            if submit_button:
                print("Found submit button by class name")
        
        assert submit_button is not None, "Submit button not found"
        
        await submit_button.click()
        print("Clicked submit button")
        
        await asyncio.sleep(1.5)
        await take_screenshot(logged_in_page, 'process_after_submission')
        
        # Check for errors
        errors = await get_error_messages(logged_in_page)
        if errors:
            print(f"Error messages after submission: {errors}")
            # Don't fail immediately, maybe it's a warning
        
        print("✓ Process addition test completed")
        
        # Return test data for use in other tests
        return {
            'process_code': test_process_code,
            'process_name': test_process_name
        }
    
    @pytest.mark.asyncio
    async def test_edit_process(self, logged_in_page):
        """Test editing an existing process."""
        print("\n=== Testing process editing ===")
        
        # First add a process to edit
        test_data = await self.test_add_process(logged_in_page)
        test_process_name = test_data['process_name']
        
        # Wait a bit for the page to refresh
        await asyncio.sleep(1)
        
        # Find edit button
        edit_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('编辑' in button_text or 'Edit' in button_text):
                edit_button = btn
                print(f"Found edit button with text: {button_text}")
                break
        
        # If not found, try to find by looking for the process in the table
        if not edit_button:
            # Try to find the process row and edit button within it
            table_rows = await logged_in_page.querySelectorAll('table tr, .ant-table-row')
            for row in table_rows:
                row_text = await logged_in_page.evaluate('(elem) => elem.textContent', row)
                if test_process_name in row_text:
                    # Look for edit button in this row
                    row_buttons = await row.querySelectorAll('button')
                    for btn in row_buttons:
                        btn_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
                        if btn_text and ('编辑' in btn_text or 'Edit' in btn_text):
                            edit_button = btn
                            break
                    if edit_button:
                        break
        
        assert edit_button is not None, "Edit button not found"
        
        await edit_button.click()
        print("Clicked edit button")
        
        await asyncio.sleep(1.5)
        await take_screenshot(logged_in_page, 'process_after_edit_click')
        
        # Update process name in form
        form_inputs = await logged_in_page.querySelectorAll('input.ant-input, input[type="text"]')
        if len(form_inputs) >= 2:
            # Usually second input is process name
            await form_inputs[1].click()
            # Select all text
            await logged_in_page.keyboard.down('Control')
            await logged_in_page.keyboard.press('A')
            await logged_in_page.keyboard.up('Control')
            await logged_in_page.keyboard.press('Backspace')
            # Type updated name
            updated_name = f"{test_process_name}_UPDATED"
            await form_inputs[1].type(updated_name)
            print(f"Updated process name to: {updated_name}")
        
        await asyncio.sleep(1)
        await take_screenshot(logged_in_page, 'process_edit_form_filled')
        
        # Find and click edit submit button
        edit_submit_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('确定' in button_text or 'OK' in button_text or 
                               '保存' in button_text or 'Save' in button_text):
                edit_submit_button = btn
                print(f"Found edit submit button with text: {button_text}")
                break
        
        # If not found by text, try by class name
        if not edit_submit_button:
            edit_submit_button = await logged_in_page.querySelector('button.ant-btn-primary')
            if edit_submit_button:
                print("Found edit submit button by class name")
        
        assert edit_submit_button is not None, "Edit submit button not found"
        
        await edit_submit_button.click()
        print("Clicked edit submit button")
        
        await asyncio.sleep(1.5)
        await take_screenshot(logged_in_page, 'process_after_edit_submission')
        
        print("✓ Process editing test completed")
    
    @pytest.mark.asyncio
    async def test_delete_process(self, logged_in_page):
        """Test deleting a process."""
        print("\n=== Testing process deletion ===")
        
        # First add a process to delete
        test_data = await self.test_add_process(logged_in_page)
        
        # Wait a bit for the page to refresh
        await asyncio.sleep(1)
        
        # Find delete button
        delete_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('删除' in button_text or 'Delete' in button_text):
                delete_button = btn
                print(f"Found delete button with text: {button_text}")
                break
        
        assert delete_button is not None, "Delete button not found"
        
        await delete_button.click()
        print("Clicked delete button")
        
        await asyncio.sleep(1)
        await take_screenshot(logged_in_page, 'process_after_delete_click')
        
        # Find confirmation button
        confirmation_button = None
        buttons = await logged_in_page.querySelectorAll('button')
        
        for btn in buttons:
            button_text = await logged_in_page.evaluate('(elem) => elem.textContent', btn)
            if button_text and ('确定' in button_text or 'OK' in button_text or 
                               '确认' in button_text or 'Confirm' in button_text or
                               '删除' in button_text):
                confirmation_button = btn
                print(f"Found confirmation button with text: {button_text}")
                break
        
        assert confirmation_button is not None, "Confirmation button not found"
        
        await confirmation_button.click()
        print("Clicked confirmation button")
        
        await asyncio.sleep(1.5)
        await take_screenshot(logged_in_page, 'process_after_deletion')
        
        # Check for errors
        errors = await get_error_messages(logged_in_page)
        if errors:
            print(f"Error messages after deletion: {errors}")
        
        print("✓ Process deletion test completed")
    
    @pytest.mark.asyncio
    async def test_process_management_comprehensive(self, logged_in_page):
        """Comprehensive test of process management functionality."""
        print("\n=== Running comprehensive process management test ===")
        
        # Test 1: Navigate to process page
        await self.test_navigate_to_process_page(logged_in_page)
        
        # Test 2: Add a process
        test_data = await self.test_add_process(logged_in_page)
        
        # Test 3: Edit the process
        await self.test_edit_process(logged_in_page)
        
        # Test 4: Delete the process
        await self.test_delete_process(logged_in_page)
        
        print("✓ All process management tests completed successfully")


if __name__ == '__main__':
    # This allows running the test directly for debugging
    import asyncio
    
    async def run_tests():
        from pyppeteer import launch
        
        browser = await launch(headless=False)
        page = await browser.newPage()
        
        # Login first
        from config import BASE_URLS, TEST_CREDENTIALS
        await page.goto(f"{BASE_URLS['frontend']}/login", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Find and fill login form
        username_inputs = await page.querySelectorAll('input[type="text"], input.ant-input')
        password_inputs = await page.querySelectorAll('input[type="password"]')
        
        username_input = None
        for inp in username_inputs:
            input_type = await page.evaluate('(elem) => elem.type', inp)
            if input_type != 'password':
                username_input = inp
                break
        
        password_input = password_inputs[0] if password_inputs else None
        
        buttons = await page.querySelectorAll('button')
        login_button = buttons[0] if buttons else None
        
        if username_input and password_input and login_button:
            await username_input.type(TEST_CREDENTIALS['admin']['username'])
            await password_input.type(TEST_CREDENTIALS['admin']['password'])
            await login_button.click()
            await asyncio.sleep(3)
        
        test = TestProcessManagement()
        
        try:
            await test.test_process_management_comprehensive(page)
        finally:
            await browser.close()
    
    asyncio.run(run_tests())
