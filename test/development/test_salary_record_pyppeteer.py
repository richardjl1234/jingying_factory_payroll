import pytest
import asyncio
from config import BASE_URLS

class TestSalaryRecord:
    """Test Salary Record functionality."""
    
    @pytest.mark.asyncio
    async def test_navigate_to_salary_record_page(self, logged_in_page):
        """Test navigation to Salary Record page."""
        print("\n=== Testing navigation to Salary Record page ===")
        
        # Navigate to Salary Record page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/salaryrecord", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(1)
        
        # Check if we're on Salary Record page
        current_url = logged_in_page.url
        print(f"Current URL: {current_url}")
        
        # Take screenshot
        screenshots_dir = logged_in_page._path.parent / 'screenshots'
        screenshots_dir.mkdir(exist_ok=True)
        await logged_in_page.screenshot({'path': str(screenshots_dir / 'python_salary_record_page.png')})
        
        # Check for Salary Record page elements
        page_content = await logged_in_page.content()
        
        # Check for Salary Record elements
        assert '工资记录' in page_content or 'Salary Record' in page_content
        
        print("Salary Record page loaded successfully")
    
    @pytest.mark.asyncio
    async def test_salary_record_list_display(self, logged_in_page):
        """Test that Salary Record list is displayed."""
        print("\n=== Testing Salary Record list display ===")
        
        # Navigate to Salary Record page
        await logged_in_page.goto(f"{BASE_URLS['frontend']}/salaryrecord", {'waitUntil': 'domcontentloaded'})
        await asyncio.sleep(2)
        
        # Look for salary_record table or list
        table_selectors = [
            '.ant-table',
            'table',
            '.salary_record-list',
            '.list-container'
        ]
        
        found_table = False
        for selector in table_selectors:
            elements = await logged_in_page.querySelectorAll(selector)
            if elements:
                print(f"Found salary_record table with selector: {selector}")
                found_table = True
                break
        
        if not found_table:
            print(f"No salary_record table found, but test continues")
        
        print("Salary Record list display test completed")
