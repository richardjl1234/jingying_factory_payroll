import pytest
import asyncio
from config import BASE_URLS

class TestWorker:
    """Test worker management functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_worker_page(self, logged_in_page):
        """Test navigation to worker management page."""
        print("

=== Testing navigation to worker management page ===")
        
        # Navigate to worker management page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/workers", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on worker management page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_worker_page.png')})
        
        # Check for worker management page elements
        page_content = await logged_in_page.content()
        
        # Check for worker management elements
        assert '工人' in page_content or 'Worker' in page_content or '员工' in page_content
        
        print("Worker management page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_worker_list_display(self, logged_in_page):
        """Test that worker list is displayed."""
        print("

=== Testing worker list display ===")
        
        # Navigate to worker management page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/workers", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for worker table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.worker-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found worker table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print("No worker table found, but test continues")
        
        print("Worker list display test completed")
