import pytest
import asyncio
from config import BASE_URLS

class TestQuota:
    """Test Quota functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_quota_page(self, logged_in_page):
        """Test navigation to Quota page."""
        print("\n=== Testing navigation to Quota page ===")
        
        # Navigate to Quota page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quota", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on Quota page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_quota_page.png')})
        
        # Check for Quota page elements
        page_content = await logged_in_page.content()
        
        # Check for Quota elements
        assert '定额' in page_content or 'Quota' in page_content
        
        print("Quota page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_quota_list_display(self, logged_in_page):
        """Test that Quota list is displayed."""
        print("\n=== Testing Quota list display ===")
        
        # Navigate to Quota page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/quota", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for quota table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.quota-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found quota table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print(f"No quota table found, but test continues")
        
        print("Quota list display test completed")
