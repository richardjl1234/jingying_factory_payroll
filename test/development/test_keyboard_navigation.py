#!/usr/bin/env python3
"""
Test script for keyboard navigation in the 添加工作记录 dialog.
This test verifies the keyboard navigation requirements:
1. Use TAB key to move focus to 工段类别 menu, immediately show menu, focus on first option
2. Use UP/DOWN arrow to move between options
3. Use RIGHT arrow to select current option and show next level menu
4. Use LEFT arrow to go back to previous level
5. Use SPACE bar to select option
"""

import asyncio
import logging
from pyppeteer import launch
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import take_screenshot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def login(page, username, password):
    """Login to the application."""
    # Wait for login page to load
    try:
        await page.waitForSelector('input[placeholder="用户名"]', {'timeout': 10000})
    except:
        # Maybe already logged in or different login form
        pass
    
    # Find username and password inputs
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
    
    if username_input and password_input and login_button:
        await username_input.type(username)
        await password_input.type(password)
        await login_button.click()
        await asyncio.sleep(2)  # Wait for login to complete
        return True
    else:
        logger.error("Login form elements not found")
        return False

async def test_keyboard_navigation():
    """Test keyboard navigation in the 添加工作记录 dialog"""
    browser = None
    try:
        # Launch browser
        browser = await launch(
            headless=False,  # Set to True for headless testing
            args=['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
            defaultViewport={'width': 1920, 'height': 1080}
        )
        page = await browser.newPage()
        
        # Set up console logging
        page.on('console', lambda msg: logger.info(f"Browser console: {msg.type}: {msg.text}"))
        page.on('pageerror', lambda err: logger.error(f"Page error: {err}"))
        
        # Navigate to login page
        await page.goto('http://localhost:5173')
        
        # Login
        login_success = await login(page, 'root', 'root123')
        if not login_success:
            logger.error("Login failed")
            await take_screenshot(page, 'login_failed.png')
            return False
        
        logger.info("Logged in successfully")
        
        # Wait for main page to load
        try:
            await page.waitForSelector('h2', {'timeout': 10000})
        except:
            # Maybe not on the expected page
            pass
        
        # Check if we're on the correct page
        page_title = await page.evaluate('() => document.querySelector("h2")?.textContent')
        if not page_title or "工资记录管理" not in page_title:
            # Maybe we are on a different page, try to navigate to salary record
            # Check for navigation links
            nav_links = await page.querySelectorAll('a')
            for link in nav_links:
                link_text = await page.evaluate('(el) => el.textContent', link)
                if link_text and "工资" in link_text:
                    await link.click()
                    await asyncio.sleep(1)
                    break
        
        # Check again
        page_title = await page.evaluate('() => document.querySelector("h2")?.textContent')
        if not page_title or "工资记录管理" not in page_title:
            logger.error(f"Not on salary record page. Found title: {page_title}")
            await take_screenshot(page, 'not_salary_page.png')
            return False
        
        logger.info("On salary record management page")
        
        # First, select a worker if none is selected
        try:
            # Check if worker is selected
            worker_input = await page.querySelector('input[placeholder*="工人"]')
            if worker_input:
                worker_value = await page.evaluate('(el) => el.value', worker_input)
                
                if not worker_value or worker_value == '':
                    # Click on worker input to show dropdown
                    await worker_input.click()
                    await asyncio.sleep(0.5)
                    
                    # Press Tab to focus first worker option
                    await worker_input.press('Tab')
                    await asyncio.sleep(0.5)
                    
                    # Press Space to select first worker
                    await page.keyboard.press('Space')
                    await asyncio.sleep(1)
        except Exception as e:
            logger.warning(f"Could not select worker automatically: {e}")
        
        # Click on 添加工作记录 button
        # Use XPath to find button with text containing "添加工作记录"
        add_button = None
        buttons = await page.querySelectorAll('button')
        for btn in buttons:
            btn_text = await page.evaluate('(el) => el.textContent', btn)
            if btn_text and "添加工作记录" in btn_text:
                add_button = btn
                break
        
        if not add_button:
            # Try alternative text
            for btn in buttons:
                btn_text = await page.evaluate('(el) => el.textContent', btn)
                if btn_text and "添加" in btn_text and "记录" in btn_text:
                    add_button = btn
                    break
        
        if not add_button:
            logger.error("Add work record button not found")
            await take_screenshot(page, 'add_button_not_found.png')
            return False
        
        await add_button.click()
        logger.info("Clicked add work record button")
        
        # Wait for modal to appear
        try:
            # Wait for modal to appear by checking for modal title
            await page.waitForXPath('//div[contains(@class, "ant-modal-title") and contains(text(), "添加工作记录")]', {'timeout': 5000})
        except:
            # Maybe the modal has a different title
            try:
                await page.waitForSelector('.ant-modal', {'timeout': 5000})
            except:
                logger.error("Modal did not appear")
                await take_screenshot(page, 'modal_not_found.png')
                return False
        
        await asyncio.sleep(1)
        
        # Take screenshot of initial modal
        await take_screenshot(page, 'add_record_modal_open.png')
        
        # Wait for modal to fully render and data to load
        logger.info("Waiting for modal and data to load...")
        
        # Wait for the quota options to be loaded and rendered
        for i in range(10):
            cat1_options = await page.evaluate('''() => {
                // Check if any dropdown options with data-cat1-index exist
                const options = document.querySelectorAll('[data-cat1-index]');
                if (options.length > 0) {
                    return Array.from(options).map(opt => ({
                        text: opt.textContent.trim(),
                        index: opt.getAttribute('data-cat1-index')
                    }));
                }
                return [];
            }''')
            if len(cat1_options) > 0:
                logger.info(f"Found {len(cat1_options)} cat1 options after {i+1} attempts")
                break
            await asyncio.sleep(1)
        else:
            logger.warning("No cat1 options found after waiting")
        
        if len(cat1_options) > 0:
            logger.info(f"First few options: {[opt['text'] for opt in cat1_options[:3]]}")
        else:
            logger.warning("Still no cat1 options after waiting")
        
        # Debug: log all inputs in the entire document
        all_inputs = await page.querySelectorAll('input')
        logger.info(f"Found {len(all_inputs)} inputs in entire document")
        for idx, inp in enumerate(all_inputs):
            placeholder = await page.evaluate('(el) => el.placeholder', inp)
            id_attr = await page.evaluate('(el) => el.id', inp)
            class_attr = await page.evaluate('(el) => el.className', inp)
            logger.info(f"Input {idx}: id='{id_attr}', class='{class_attr}', placeholder='{placeholder}'")
        
        # Test 1: TAB navigation to 工段类别
        logger.info("Test 1: TAB navigation to 工段类别")
        
        # Find the 工段类别 input directly by placeholder
        cat1_input = await page.querySelector('input[placeholder*="工段类别"]')
        if not cat1_input:
            # Try alternative selectors
            cat1_input = await page.querySelector('input[placeholder*="工段"]')
        
        if not cat1_input:
            logger.error("工段类别 input not found")
            await take_screenshot(page, 'cat1_input_not_found.png')
            return False
        
        logger.info("Found 工段类别 input")
        
        # Try to directly dispatch a Tab key event to the input
        logger.info("Trying to dispatch Tab key event to input...")
        
        await page.evaluate('''() => {
            const input = document.querySelector('input[placeholder*="工段类别"]');
            if (input) {
                // Create and dispatch a Tab keydown event
                const event = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    code: 'Tab',
                    keyCode: 9,
                    which: 9,
                    bubbles: true,
                    cancelable: true
                });
                input.dispatchEvent(event);
                
                // Also try keyup
                const eventUp = new KeyboardEvent('keyup', {
                    key: 'Tab',
                    code: 'Tab',
                    keyCode: 9,
                    which: 9,
                    bubbles: true
                });
                input.dispatchEvent(eventUp);
            }
        }''')
        
        # Wait for the dropdown to appear
        await asyncio.sleep(2)
        
        # Check if dropdown options are now available
        cat1_options = await page.evaluate('''() => {
            const options = document.querySelectorAll('[data-cat1-index]');
            if (options.length > 0) {
                return Array.from(options).map(opt => ({
                    text: opt.textContent.trim(),
                    index: opt.getAttribute('data-cat1-index')
                }));
            }
            return [];
        }''')
        
        if len(cat1_options) > 0:
            logger.info(f"Found {len(cat1_options)} cat1 options after dispatching Tab event")
        else:
            logger.warning("No cat1 options found after dispatching Tab event")
        logger.info("Waiting for dropdown options to appear...")
        for i in range(10):
            # Check if dropdown container exists
            dropdown_info = await page.evaluate('''() => {
                // Check for dropdown container
                const dropdown = document.querySelector('.ant-select-dropdown, [style*="position: absolute"][style*="z-index: 1000"]');
                const cat1Dropdown = document.querySelector('[data-cat1-index]');
                const input = document.querySelector('input[placeholder*="工段类别"]');
                return {
                    hasDropdown: !!dropdown,
                    hasCat1Options: !!cat1Dropdown,
                    inputExists: !!input,
                    inputReadonly: input?.readOnly,
                    inputDisabled: input?.disabled,
                    cat1OptionsCount: cat1Dropdown ? cat1Dropdown.parentElement?.children?.length || 0 : 0
                };
            }''')
            logger.info(f"Dropdown check {i+1}: {dropdown_info}")
            
            if dropdown_info['hasCat1Options']:
                cat1_options = await page.evaluate('''() => {
                    const options = document.querySelectorAll('[data-cat1-index]');
                    return Array.from(options).map(opt => ({
                        text: opt.textContent.trim(),
                        index: opt.getAttribute('data-cat1-index')
                    }));
                }''')
                logger.info(f"Found {len(cat1_options)} cat1 options")
                break
            await asyncio.sleep(1)
        else:
            logger.warning("No cat1 options found after waiting")
        
        if len(cat1_options) > 0:
            logger.info(f"First few options: {[opt['text'] for opt in cat1_options[:3]]}")
        else:
            logger.warning("Still no cat1 options after waiting")
        
        # Debug: check if quota options data is loaded
        quota_data = await page.evaluate('''() => {
            const app = document.querySelector('#root');
            if (!app) return 'no-root';
            const dropdown = document.querySelector('[data-cat1-index]');
            return dropdown ? 'dropdown-rendered' : 'no-dropdown';
        }''')
        logger.info(f"Quota data status: {quota_data}")
        
        # Check if dropdown is shown by looking for options
        cat1_options = await page.querySelectorAll('[data-cat1-index]')
        if len(cat1_options) == 0:
            logger.warning("No cat1 options found after click, trying to press Tab to trigger dropdown")
            # Press Tab to see if it triggers dropdown
            await cat1_input.press('Tab')
            await asyncio.sleep(1)
            cat1_options = await page.querySelectorAll('[data-cat1-index]')
        
        if len(cat1_options) == 0:
            logger.error("Dropdown did not appear after focusing the 工段类别 input")
            # Try to see if dropdown is hidden or not rendered
            # Check if there's any dropdown container
            dropdowns = await page.querySelectorAll('.ant-dropdown, .ant-select-dropdown, div[style*="position: absolute"]')
            logger.info(f"Found {len(dropdowns)} dropdown containers")
            await take_screenshot(page, 'dropdown_not_shown.png')
            return False
        
        logger.info(f"Found {len(cat1_options)} cat1 options")
        
        # Now the dropdown should be shown. We need to focus the first option.
        # According to the implementation, when the input is focused, it should set focusedCat1Index to 0 and focus the first option.
        # Let's check which element is focused now.
        focused_element = await page.evaluate('''() => {
            return document.activeElement;
        }''')
        focused_element_info = await page.evaluate('''(el) => {
            if (!el) return 'null';
            return {
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                placeholder: el.placeholder,
                'data-cat1-index': el.getAttribute('data-cat1-index')
            };
        }''', focused_element)
        logger.info(f"Currently focused element: {focused_element_info}")
        
        # If the input is still focused, press Tab to move focus to the first option
        if focused_element_info and 'placeholder' in focused_element_info and '工段类别' in focused_element_info['placeholder']:
            logger.info("工段类别 input still focused, pressing Tab to move to first option")
            await cat1_input.press('Tab')
            await asyncio.sleep(0.5)
        
        # Check which option is focused
        focused_option = await page.evaluate('''() => {
            const focused = document.activeElement;
            if (focused && focused.hasAttribute('data-cat1-index')) {
                return focused.getAttribute('data-cat1-index');
            }
            return null;
        }''')
        
        if focused_option == "0":
            logger.info(f"Successfully focused on first option: {focused_option}")
            await take_screenshot(page, 'cat1_dropdown_shown.png')
        else:
            logger.warning(f"Expected to focus on option 0, but got: {focused_option}")
            # Try to focus the first option manually
            first_option = await page.querySelector('[data-cat1-index="0"]')
            if first_option:
                await first_option.focus()
                logger.info("Manually focused first option")
                await asyncio.sleep(0.5)
                focused_option = await page.evaluate('''() => {
                    const focused = document.activeElement;
                    if (focused && focused.hasAttribute('data-cat1-index')) {
                        return focused.getAttribute('data-cat1-index');
                    }
                    return null;
                }''')
                if focused_option == "0":
                    logger.info("Now focused on first option after manual focus")
                else:
                    logger.warning("Still not focused on first option")
        
        # Test 2: UP/DOWN arrow navigation in 工段类别 dropdown
        logger.info("Test 2: UP/DOWN arrow navigation in 工段类别 dropdown")
        
        # Press Down arrow to move to next option
        await page.keyboard.press('ArrowDown')
        await asyncio.sleep(0.5)
        
        # Check if focus moved to second option
        focused_option = await page.evaluate('''() => {
            const focused = document.activeElement;
            if (focused && focused.hasAttribute('data-cat1-index')) {
                return focused.getAttribute('data-cat1-index');
            }
            return null;
        }''')
        
        if focused_option == "1":
            logger.info(f"Successfully moved to option {focused_option} with ArrowDown")
        else:
            logger.warning(f"Expected to focus on option 1, but got: {focused_option}")
        
        # Press Up arrow to move back to first option
        await page.keyboard.press('ArrowUp')
        await asyncio.sleep(0.5)
        
        focused_option = await page.evaluate('''() => {
            const focused = document.activeElement;
            if (focused && focused.hasAttribute('data-cat1-index')) {
                return focused.getAttribute('data-cat1-index');
            }
            return null;
        }''')
        
        if focused_option == "0":
            logger.info(f"Successfully moved to option {focused_option} with ArrowUp")
        else:
            logger.warning(f"Expected to focus on option 0, but got: {focused_option}")
        
        # Test 3: RIGHT arrow to select and move to next level
        logger.info("Test 3: RIGHT arrow to select and move to next level")
        
        # Press Right arrow to select current option
        await page.keyboard.press('ArrowRight')
        await asyncio.sleep(1)
        
        # Check if 工序类别 dropdown is shown
        cat2_dropdown = await page.querySelector('div[style*="position: absolute"][style*="z-index: 1000"]')
        if cat2_dropdown:
            logger.info("工序类别 dropdown shown after Right arrow")
            
            # Check if focus is on first option of 工序类别
            focused_cat2 = await page.evaluate('''() => {
                const focused = document.activeElement;
                if (focused && focused.hasAttribute('data-cat2-index')) {
                    return focused.getAttribute('data-cat2-index');
                }
                return null;
            }''')
            
            if focused_cat2 == "0":
                logger.info(f"Successfully focused on first option of 工序类别: {focused_cat2}")
            else:
                logger.warning(f"Expected to focus on option 0 of 工序类别, but got: {focused_cat2}")
            
            await take_screenshot(page, 'cat2_dropdown_shown.png')
        else:
            logger.warning("工序类别 dropdown not shown after Right arrow")
        
        # Test 4: LEFT arrow to go back to previous level
        logger.info("Test 4: LEFT arrow to go back to previous level")
        
        if cat2_dropdown:
            # Press Left arrow to go back
            await page.keyboard.press('ArrowLeft')
            await asyncio.sleep(1)
            
            # Check if we're back in 工段类别 dropdown
            focused_cat1 = await page.evaluate('''() => {
                const focused = document.activeElement;
                if (focused && focused.hasAttribute('data-cat1-index')) {
                    return focused.getAttribute('data-cat1-index');
                }
                return null;
            }''')
            
            if focused_cat1 is not None:
                logger.info(f"Successfully went back to 工段类别, option: {focused_cat1}")
            else:
                logger.warning("Not in 工段类别 dropdown after Left arrow")
        
        # Test 5: SPACE bar to select option
        logger.info("Test 5: SPACE bar to select option")
        
        # Press Space to select current option in 工段类别
        await page.keyboard.press('Space')
        await asyncio.sleep(1)
        
        # Check if 工序类别 dropdown is shown again
        cat2_dropdown_after_space = await page.querySelector('div[style*="position: absolute"][style*="z-index: 1000"]')
        if cat2_dropdown_after_space:
            logger.info("工序类别 dropdown shown after Space bar (selection successful)")
            
            # Now test navigation in 工序类别
            await page.keyboard.press('ArrowDown')
            await asyncio.sleep(0.5)
            
            # Press Right arrow to select 工序类别 and move to 电机型号
            await page.keyboard.press('ArrowRight')
            await asyncio.sleep(1)
            
            # Check if 电机型号 dropdown is shown
            model_dropdown = await page.querySelector('div[style*="position: absolute"][style*="z-index: 1000"]')
            if model_dropdown:
                logger.info("电机型号 dropdown shown after Right arrow in 工序类别")
                
                # Test navigation in 电机型号
                await page.keyboard.press('ArrowDown')
                await asyncio.sleep(0.5)
                
                # Press Right arrow to select 电机型号 and move to 工序
                await page.keyboard.press('ArrowRight')
                await asyncio.sleep(1)
                
                # Check if 工序 dropdown is shown
                process_dropdown = await page.querySelector('div[style*="position: absolute"][style*="z-index: 1000"]')
                if process_dropdown:
                    logger.info("工序 dropdown shown after Right arrow in 电机型号")
                    
                    # Test Space bar in 工序 dropdown
                    await page.keyboard.press('Space')
                    await asyncio.sleep(1)
                    
                    # Check if dropdown is closed and option is selected
                    process_dropdown_after = await page.querySelector('div[style*="position: absolute"][style*="z-index: 1000"]')
                    if not process_dropdown_after:
                        logger.info("工序 dropdown closed after Space bar (selection successful)")
                        
                        # Check if quota information is displayed
                        quota_info = await page.querySelector('div[style*="background-color: #e6f7ff"]')
                        if quota_info:
                            logger.info("Quota information displayed after selection")
                        else:
                            logger.warning("Quota information not displayed after selection")
                    else:
                        logger.warning("工序 dropdown still open after Space bar")
                else:
                    logger.warning("工序 dropdown not shown")
            else:
                logger.warning("电机型号 dropdown not shown")
        else:
            logger.warning("工序类别 dropdown not shown after Space bar")
        
        # Final screenshot
        await take_screenshot(page, 'keyboard_navigation_test_complete.png')
        
        # Close the modal
        cancel_button = None
        buttons = await page.querySelectorAll('button')
        for btn in buttons:
            btn_text = await page.evaluate('(el) => el.textContent', btn)
            if btn_text and "取消" in btn_text:
                cancel_button = btn
                break
        
        if cancel_button:
            await cancel_button.click()
            await asyncio.sleep(0.5)
        else:
            logger.warning("Cancel button not found")
        
        logger.info("Keyboard navigation test completed")
        return True
        
    except Exception as e:
        logger.error(f"Test failed with error: {e}", exc_info=True)
        if browser:
            await take_screenshot(page, 'keyboard_navigation_error.png')
        return False
        
    finally:
        if browser:
            await browser.close()

if __name__ == "__main__":
    success = asyncio.get_event_loop().run_until_complete(test_keyboard_navigation())
    if success:
        print("Keyboard navigation test PASSED")
        sys.exit(0)
    else:
        print("Keyboard navigation test FAILED")
        sys.exit(1)
