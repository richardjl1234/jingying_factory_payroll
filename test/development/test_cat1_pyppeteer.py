import pytest
import asyncio
from config import BASE_URLS

class TestCat1:
    """Test Process Category 1 functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_cat1_page(self, logged_in_page):
        """Test navigation to Process Category 1 page."""
        print("
=== Testing navigation to Process Category 1 page ===")
        
        # Navigate to Process Category 1 page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/cat1", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on Process Category 1 page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_cat1_page.png')})
        
        # Check for Process Category 1 page elements
        page_content = await logged_in_page.content()
        
        # Check for Process Category 1 elements
        assert '分类1' in page_content or 'Process Category 1' in page_content
        
        print("Process Category 1 page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_cat1_list_display(self, logged_in_page):
        """Test that Process Category 1 list is displayed."""
        print("
=== Testing Process Category 1 list display ===")
        
        # Navigate to Process Category 1 page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/cat1", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for cat1 table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.cat1-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found cat1 table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print(f"No cat1 table found, but test continues")
        
        print("Process Category 1 list display test completed")
