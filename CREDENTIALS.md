# 🔐 NearO Application Credentials

## Important: Database vs Application Credentials

### 🗄️ Database Credentials (MySQL)
**These are for accessing the MySQL database directly:**
- **Host:** `mysql` (inside Docker) or `localhost` (from host)
- **Port:** `3306`
- **Username:** `root`
- **Password:** `your_db_password_here`
- **Database:** `nearo`

**Usage:** Only for database management tools, not for application login!

---

### 👤 Application Credentials

#### Admin Login (Default)
**Use these to login to the application:**
- **Email:** `admin@example.com`
- **Password:** `your_admin_password_here`
- **Role:** Admin
- **Endpoint:** `POST http://localhost:3000/auth/admin-login`

#### Regular User Registration
**Users can register at:**
- **Endpoint:** `POST http://localhost:3000/auth/register`
- Create your own account with any email/password

---

## 🔗 API Endpoints

### Health Check
```bash
GET http://localhost:3000/health
```

### Admin Login
```bash
POST http://localhost:3000/auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your_admin_password_here"
}
```

### User Registration
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "your@email.com",
  "password": "YourPassword123"
}
```

### User Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "your@email.com",
  "password": "YourPassword123"
}
```

---

## ⚠️ Common Mistake

**DON'T USE:**
- ❌ `root` / `your_db_password_here` to login to the application
- ❌ Database credentials for application login

**DO USE:**
- ✅ `admin@example.com` / `your_admin_password_here` for admin login
- ✅ Your registered email/password for user login

---

## 🔄 How to Change Admin Password

If you want to change the default admin password:

1. Login with default credentials
2. Use the profile/settings endpoint to update password
3. Or manually update in database:

```sql
-- Update admin password (requires bcrypt hash)
UPDATE users 
SET password = '$2b$10$YOUR_BCRYPT_HASH_HERE' 
WHERE email = 'admin@example.com';
```

---

## 📊 Check Users in Database

```bash
docker-compose exec mysql mysql -u root -p$MYSQL_ROOT_PASSWORD nearo -e "SELECT id, name, email, role FROM users;"
```

---

## 🎯 Quick Test

### Test Admin Login (PowerShell)
```powershell
Invoke-WebRequest -Uri http://localhost:3000/auth/admin-login `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@example.com","password":"your_admin_password_here"}' `
  | Select-Object -ExpandProperty Content
```

### Test Admin Login (curl/bash)
```bash
curl -X POST http://localhost:3000/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_admin_password_here"}'
```

---

## ✅ Summary

| Purpose | Credentials | Where to Use |
|---------|-------------|--------------|
| Database Access | `root` / `your_db_password_here` | MySQL client, database tools |
| Admin Login | `admin@example.com` / `your_admin_password_here` | Application login |
| User Login | Your registered email/password | Application login |

---

**Last Updated:** 2026-02-01  
**Status:** ✅ Working  
**Default Admin:** `admin@example.com` / `your_admin_password_here`


 Moderator Credentials:
   Email: moderator@nearo.pk
   Password: Wasiq00001
   Role: moderator

📋 Admin Credentials (existing):'
   Email: muhammadwasiq67585@gmail.com'
   Password: Wasiq00001'
   Role: admin'

  Important:
  - Each role needs a SEPARATE account'
  - Cannot use same email for admin and moderator'
  - Admin account: muhammadwasiq67585@gmail.com'
 - Moderator account: moderator@nearo.pk\n'