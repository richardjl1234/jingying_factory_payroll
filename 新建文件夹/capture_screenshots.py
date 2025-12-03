from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import os

# 设置Chrome选项
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# 创建WebDriver实例，使用webdriver-manager自动管理ChromeDriver
driver = webdriver.Chrome(service=webdriver.chrome.service.Service(ChromeDriverManager().install()), options=chrome_options)

try:
    # 1. 访问登录页面并截图
    driver.get("http://localhost:5173/")
    time.sleep(2)  # 等待页面加载
    driver.save_screenshot("e:\\jianglei\\trae\\new_payroll\\login_page.png")
    print("登录页面截图已保存")
    
    # 2. 登录系统
    username_input = driver.find_element("id", "login_username")
    password_input = driver.find_element("id", "login_password")
    login_button = driver.find_element("css selector", "#login button[type='submit']")
    
    username_input.send_keys("root")
    password_input.send_keys("root123")
    login_button.click()
    
    time.sleep(3)  # 等待登录成功
    
    # 3. 访问主页面并截图
    driver.get("http://localhost:5173/")
    time.sleep(2)
    driver.save_screenshot("e:\\jianglei\\trae\\new_payroll\\home_page.png")
    print("主页面截图已保存")
    
    # 4. 访问工序管理页面并截图
    driver.get("http://localhost:5173/processes")
    time.sleep(2)
    driver.save_screenshot("e:\\jianglei\\trae\\new_payroll\\process_management.png")
    print("工序管理页面截图已保存")
    
    # 5. 访问工人管理页面并截图
    driver.get("http://localhost:5173/workers")
    time.sleep(2)
    driver.save_screenshot("e:\\jianglei\\trae\\new_payroll\\worker_management.png")
    print("工人管理页面截图已保存")
    
    # 6. 访问报表页面并截图
    driver.get("http://localhost:5173/reports")
    time.sleep(2)
    driver.save_screenshot("e:\\jianglei\\trae\\new_payroll\\report_page.png")
    print("报表页面截图已保存")
    
    print("所有截图已成功保存!")
    
except Exception as e:
    print(f"截图过程中发生错误: {e}")
finally:
    # 关闭WebDriver
    driver.quit()