# Hướng dẫn Local Development với Database Docker

## Để sử dụng database giống với Docker đang dùng:

### Bước 1: Chạy chỉ database container
```bash
# Chạy chỉ PostgreSQL database
docker-compose up db -d

# Kiểm tra database đã chạy
docker-compose ps
```

### Bước 2: Tạo file .env cho local development
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

### Bước 3: Cài đặt dependencies và chạy backend local
```bash
# Cài đặt Python dependencies
pip install -r requirements.txt

# Chạy backend local
python run_backend.py
```

### Bước 4: Chạy frontend local (tùy chọn)
```bash
cd frontend
npm install
npm run dev
```

## Database Credentials:
- **Host**: localhost
- **Port**: 5432
- **Database**: postgres
- **Username**: postgres
- **Password**: Mayyeutao0?

## Workflow khuyến nghị:

### 1. Development với database Docker:
```bash
# Terminal 1: Chạy database
docker-compose up db -d

# Terminal 2: Chạy backend local
python run_backend.py

# Terminal 3: Chạy frontend local
cd frontend && npm run dev
```

### 2. Testing với full Docker:
```bash
# Chạy toàn bộ stack
docker-compose up
```

### 3. Reset database khi cần:
```bash
# Xóa data và restart
docker-compose down -v
docker-compose up db -d
```

## Lợi ích của cách này:

✅ **Database consistency**: Cùng PostgreSQL version và config với production
✅ **Fast development**: Hot reload cho backend/frontend code
✅ **Data persistence**: Data được lưu trong Docker volume
✅ **Easy reset**: Có thể reset database dễ dàng
✅ **Isolation**: Database isolated trong container

## Debugging:

### Kiểm tra database connection:
```bash
# Test connection với psql
docker exec -it tcc_log-db-1 psql -U postgres -d postgres

# Hoặc từ local (nếu có psql)
psql -h localhost -U postgres -d postgres
```

### Xem logs database:
```bash
docker-compose logs db
```

### Xem logs backend:
```bash
# Nếu chạy local
python run_backend.py

# Nếu chạy Docker
docker-compose logs backend
```

## Troubleshooting:

### Lỗi kết nối database:
- Kiểm tra database container đang chạy: `docker-compose ps`
- Kiểm tra port 5432 không bị chiếm: `netstat -an | grep 5432`
- Restart database: `docker-compose restart db`

### Lỗi migration:
- Backend sẽ tự động reset migration nếu gặp lỗi revision
- Hoặc reset thủ công: `docker-compose down -v && docker-compose up db -d` 