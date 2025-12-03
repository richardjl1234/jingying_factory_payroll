from app.utils.auth import verify_password, get_password_hash

# 测试密码验证功能
def test_password():
    # 测试密码
    password = "123456"
    
    # 生成密码哈希
    hashed_password = get_password_hash(password)
    print(f"密码: {password}")
    print(f"密码哈希: {hashed_password}")
    
    # 验证密码
    is_valid = verify_password(password, hashed_password)
    print(f"密码验证结果: {is_valid}")
    
    # 测试错误密码
    wrong_password = "wrong_password"
    is_wrong = verify_password(wrong_password, hashed_password)
    print(f"错误密码验证结果: {is_wrong}")
    
    # 测试数据库中已存在的密码哈希
    # 从reset_password.py的输出中获取的哈希值
    db_hashed_password = "$pbkdf2-sha256$29000$ee8dYwzBWMsZg7CWEsJYKw$G1ShnWitkskMRlovqfv9H9F1rTugCNzRkV0.ywBc88o"
    print(f"\n测试数据库中的密码哈希: {db_hashed_password}")
    
    # 验证数据库中的密码哈希
    is_db_valid = verify_password(password, db_hashed_password)
    print(f"数据库密码验证结果: {is_db_valid}")
    
    # 测试另一个密码哈希
    db_hashed_password2 = "$pbkdf2-sha256$29000$VmotpdQaY6xV6r2XklKKEQ$/.iVlqddVNZfAarf1IibkzPLT3JhpBPY8.Jj.aIRoeo"
    print(f"\n测试另一个数据库中的密码哈希: {db_hashed_password2}")
    
    # 验证另一个数据库中的密码哈希
    is_db_valid2 = verify_password(password, db_hashed_password2)
    print(f"另一个数据库密码验证结果: {is_db_valid2}")

if __name__ == '__main__':
    test_password()