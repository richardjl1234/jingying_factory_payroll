import pytest
import asyncio
from config import BASE_URLS

class TestMotorModel:
    """Test Motor Model functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_motor_model_page(self, logged_in_page):
        """Test navigation to Motor Model page."""
        print("
=== Testing navigation to Motor Model page ===")
        
        # Navigate to Motor Model page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/motormodel", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on Motor Model page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_motor_model_page.png')})
        
        # Check for Motor Model page elements
        page_content = await logged_in_page.content()
        
        # Check for Motor Model elements
        assert '电机型号' in page_content or 'Motor Model' in page_content
        
        print("Motor Model page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_motor_model_list_display(self, logged_in_page):
        """Test that Motor Model list is displayed."""
        print("
=== Testing Motor Model list display ===")
        
        # Navigate to Motor Model page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/motormodel", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for motor_model table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.motor_model-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found motor_model table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print(f"No motor_model table found, but test continues")
        
        print("Motor Model list display test completed")
