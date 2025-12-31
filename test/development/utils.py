# Utility functions for Python Pyppeteer tests
import asyncio
from pathlib import Path
from datetime import datetime
from config import TIMEOUTS

async def take_screenshot(page, name):
    """Take a screenshot and save it to the screenshots directory."""
    screenshots_dir = Path(__file__).parent / 'screenshots'
    screenshots_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{name}_{timestamp}.png"
    filepath = screenshots_dir / filename
    
    await page.screenshot({'path': str(filepath)})
    print(f"Screenshot saved: {filename}")
    return str(filepath)

async def get_page_info(page):
    """Get information about the current page."""
    url = page.url
    title = await page.title()
    
    # Get localStorage
    localStorage = await page.evaluate('''() => {
        let items = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            items[key] = localStorage.getItem(key);
        }
        return JSON.stringify(items);
    }''')
    
    # Get console errors
    console_errors = await page.evaluate('''() => {
        return window.consoleErrors || [];
    }''')
    
    return {
        'url': url,
        'title': title,
        'localStorage': localStorage,
        'consoleErrors': console_errors
    }

async def get_error_messages(page):
    """Extract error messages from the page."""
    error_selectors = [
        '.ant-message-error',
        '.ant-alert-error',
        '.error-message',
        '.error',
        '[class*="error"]',
        '[class*="Error"]'
    ]
    
    errors = []
    for selector in error_selectors:
        elements = await page.querySelectorAll(selector)
        for elem in elements:
            text = await page.evaluate('(elem) => elem.textContent', elem)
            if text and text.strip():
                errors.append(text.strip())
    
    # Also check for any red text
    red_elements = await page.querySelectorAll('[style*="color: red"], [style*="color:red"]')
    for elem in red_elements:
        text = await page.evaluate('(elem) => elem.textContent', elem)
        if text and text.strip():
            errors.append(text.strip())
    
    return list(set(errors))  # Remove duplicates

async def wait_for_element(page, selector, timeout=None):
    """Wait for an element to appear on the page."""
    if timeout is None:
        timeout = TIMEOUTS['medium']
    
    try:
        await page.waitForSelector(selector, {'timeout': timeout})
        return True
    except:
        return False

async def find_element_by_text(page, text, element_type='*'):
    """Find an element containing specific text."""
    xpath = f"//{element_type}[contains(text(), '{text}')]"
    elements = await page.xpath(xpath)
    return elements[0] if elements else None

async def click_element_by_text(page, text, element_type='button'):
    """Click an element containing specific text."""
    element = await find_element_by_text(page, text, element_type)
    if element:
        await element.click()
        return True
    return False

async def fill_form_input(page, input_index, value):
    """Fill a form input by index (0-based)."""
    inputs = await page.querySelectorAll('input.ant-input, input[type="text"], input[type="password"]')
    if input_index < len(inputs):
        await inputs[input_index].type(value)
        return True
    return False

async def save_debug_info(page, test_name):
    """Save debug information for a test."""
    debug_dir = Path(__file__).parent / 'debug'
    debug_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{test_name}_{timestamp}.json"
    filepath = debug_dir / filename
    
    page_info = await get_page_info(page)
    screenshot_path = await take_screenshot(page, f"debug_{test_name}")
    
    debug_info = {
        'timestamp': timestamp,
        'test_name': test_name,
        'page_info': page_info,
        'screenshot': screenshot_path,
        'url': page.url
    }
    
    import json
    filepath.write_text(json.dumps(debug_info, indent=2, ensure_ascii=False))
    print(f"Debug info saved: {filename}")
    
    return debug_info
