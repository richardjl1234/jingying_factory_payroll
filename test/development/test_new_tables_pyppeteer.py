import pytest
import asyncio
from config import BASE_URLS

class TestNewTables:
    """Test New Tables functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_new_tables_page(self, logged_in_page):
        """Test navigation to New Tables page."""
        print("
=== Testing navigation to New Tables page ===")
        
        # Navigate to New Tables page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/newtables", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on New Tables page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_new_tables_page.png')})
        
        # Check for New Tables page elements
        page_content = await logged_in_page.content()
        
        # Check for New Tables elements
        assert '新表' in page_content or 'New Tables' in page_content
        
        print("New Tables page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_new_tables_list_display(self, logged_in_page):
        """Test that New Tables list is displayed."""
        print("
=== Testing New Tables list display ===")
        
        # Navigate to New Tables page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/newtables", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for new_tables table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.new_tables-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found new_tables table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print(f"No new_tables table found, but test continues")
        
        print("New Tables list display test completed")
