# 🔒 Security Fix - Removed Hardcoded MongoDB URI

## ❌ Vấn đề

GitGuardian Security Checks phát hiện **hardcoded MongoDB credentials** trong các utility scripts:
- `scripts/verify-all-accounts.js`
- `scripts/verify-account-by-email.js`
- `scripts/hash-existing-passwords.js`
- `scripts/hash-existing-passwords.ts`

## ✅ Đã sửa

Tất cả scripts đã được cập nhật để:
1. **Không hardcode MongoDB URI** - Chỉ sử dụng environment variable `MONGODB_URI`
2. **Thêm validation** - Kiểm tra `MONGODB_URI` có được set chưa trước khi chạy
3. **Yêu cầu `.env` file** - User phải set `MONGODB_URI` trong file `.env`

## 📝 Cách sử dụng scripts sau khi fix

### 1. Đảm bảo có file `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&tls=true
```

### 2. Chạy scripts

```bash
# Verify all accounts
node scripts/verify-all-accounts.js

# Verify account by email
node scripts/verify-account-by-email.js user@example.com

# Hash existing passwords
node scripts/hash-existing-passwords.js
```

### 3. Nếu thiếu MONGODB_URI

Scripts sẽ hiển thị lỗi:
```
❌ MONGODB_URI is required. Please set it in your .env file.
```

## ⚠️ Lưu ý

- **Commit cũ** (`6fb4259`) vẫn chứa hardcoded URI trong git history
- **Commit mới** (`8c702a4`) đã xóa hardcoded URI
- GitGuardian có thể vẫn báo lỗi vì commit cũ trong history
- **Giải pháp:** Sau khi merge PR, có thể cần xóa commit cũ khỏi history (nếu cần)

## 🔐 Best Practices

1. **Không bao giờ hardcode credentials** trong code
2. **Luôn sử dụng environment variables** cho sensitive data
3. **Đảm bảo `.env` trong `.gitignore`**
4. **Sử dụng secret management** trong production (AWS Secrets Manager, Azure Key Vault, etc.)

## 📚 Files đã được sửa

- ✅ `scripts/verify-all-accounts.js`
- ✅ `scripts/verify-account-by-email.js`
- ✅ `scripts/hash-existing-passwords.js`
- ✅ `scripts/hash-existing-passwords.ts`

Tất cả scripts hiện tại đều an toàn và không chứa hardcoded credentials! 🔒

