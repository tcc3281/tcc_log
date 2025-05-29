# 🚀 Quick Start Scripts

## Scripts để chạy local development nhanh chóng:

### 🎯 Chạy Local Development

#### **⚡ Windows - Siêu Nhanh (Khuyến nghị)** 
```cmd
# Cách đơn giản nhất - double-click hoặc:
start.bat
```

#### **Windows (PowerShell) - Có thể có lỗi syntax**
```powershell
# Note: PowerShell script có thể có lỗi trên một số hệ thống
.\run_local_simple.ps1
```

#### **Linux/Mac (Bash)**
```bash
# Cấp quyền thực thi (chỉ cần chạy 1 lần)
chmod +x run_local.sh

# Chạy để setup và start
./run_local.sh
```

### 🛑 Dừng Local Development

#### **⚡ Windows - Siêu Nhanh (Khuyến nghị)**
```cmd
# Double-click hoặc chạy trong Command Prompt
stop.bat
```

#### **Windows (PowerShell)**
```powershell
.\stop_local.ps1
```

#### **Linux/Mac (Bash)**
```bash
./stop_local.sh
```

## ✨ Scripts sẽ tự động:

### `start.bat` (Windows - Siêu nhanh):
1. ✅ Start PostgreSQL database container
2. ✅ Cài đặt Python dependencies
3. ✅ Start backend server

### `run_local` script (Đầy đủ):
1. ✅ Kiểm tra Docker và Python đã cài đặt
2. ✅ Tạo file `.env` nếu chưa có
3. ✅ Start PostgreSQL database container
4. ✅ Cài đặt Python dependencies
5. ✅ Hiển thị thông tin kết nối database
6. ✅ Hỏi có muốn start backend ngay không

### `stop_local` script:
1. ✅ Dừng database container
2. ✅ Hiển thị status containers
3. ✅ Hỏi có muốn xóa containers và data không

## 🎮 Usage Examples:

### ⚡ Cách nhanh nhất (Windows):
```cmd
# Chỉ cần double-click
start.bat
```

### Start toàn bộ environment:
```bash
# Windows
.\run_local.ps1

# Linux/Mac  
./run_local.sh
```

### Chỉ start backend (sau khi đã setup):
```bash
python run_backend.py
```

### Start frontend (optional):
```bash
cd frontend
npm install
npm run dev
```

### Stop và cleanup:
```bash
# Windows
.\stop_local.ps1

# Linux/Mac
./stop_local.sh
```

## 📝 Setup .env file:

Tạo file `.env` trong thư mục gốc với nội dung:
```env
# Database Configuration (kết nối với PostgreSQL container)
DATABASE_URL=postgresql+psycopg2://postgres:Mayyeutao0?@localhost:5432/postgres

# Backend Configuration
SECRET_KEY=hZKxcKs2I92_s90ZVQNw4MF3BI1qKFFI-2PwhK8OlRM
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=false

# CORS Configuration
ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Configuration (LM Studio)
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=your-model-identifier

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Development Settings
DEBUG=true
```

## 🔧 Thông tin kết nối:

**Database:**
- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `Mayyeutao0?`

**Backend API:**
- URL: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

**Frontend (nếu chạy):**
- URL: `http://localhost:3000`

## 📝 Manual Commands (backup):

Nếu scripts không hoạt động, bạn có thể chạy thủ công:

```bash
# 1. Start database
docker-compose up db -d

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start backend
python run_backend.py

# 4. Stop database
docker-compose stop db
```

## 🚨 Troubleshooting:

### Script không chạy được:
- **Windows**: Chạy PowerShell as Administrator
- **Linux/Mac**: Đảm bảo có quyền thực thi: `chmod +x *.sh`

### Database không start:
```bash
# Kiểm tra Docker
docker --version
docker-compose --version

# Kiểm tra port 5432
netstat -an | grep 5432
```

### Dependencies lỗi:
```bash
# Update pip
python -m pip install --upgrade pip

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
``` 