# Hướng dẫn Thiết lập Môi trường (.env)

Tài liệu này cung cấp hướng dẫn chi tiết để tạo và cấu hình các file môi trường (.env) cần thiết cho dự án TCC Log. Các file này **không được lưu trữ** trong Git repository vì lý do bảo mật, nên bạn cần phải tạo chúng trên mỗi môi trường triển khai.

## Tổng quan về các file môi trường

Dự án sử dụng các file môi trường sau:

1. `.env` - File môi trường chính cho backend (thư mục gốc)
2. `.env.local` - File môi trường cho frontend (thư mục frontend)
3. `.env.development` - File môi trường phát triển cho frontend (tùy chọn)
4. `.env.production` - File môi trường sản xuất cho frontend (tùy chọn)

**Chú ý quan trọng**: 
- **KHÔNG** cần thiết lập file `.env` trong thư mục frontend cùng với `.env.local`, vì Next.js sẽ ưu tiên `.env.local` hơn.
- **KHÔNG** cần thiết lập file `.env.local` trong thư mục gốc vì nó sẽ không được Next.js sử dụng.

Lưu ý: Tất cả các file này đều được thêm vào `.gitignore` và sẽ không được đưa vào repository. Bạn cần tạo chúng mỗi khi clone dự án mới.

## File Môi trường Mẫu

Để dễ dàng thiết lập, chúng tôi cung cấp các file mẫu đi kèm theo hướng dẫn này. Bạn có thể sao chép nội dung của chúng và điều chỉnh theo nhu cầu của mình.

## Hướng dẫn tạo file môi trường

### 1. Backend Environment (`.env`)

File này chứa cấu hình cho backend, database và AI services. Đặt tại thư mục gốc của dự án.

#### Backend `.env` Template:

```properties
# Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:YourPassword@localhost:5432/postgres
SECRET_KEY=YourSecureRandomStringHere
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=false
ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Configuration
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=lmstudio-community/Qwen2.5-7B-Instruct-GGUF
LM_MAX_INFERENCE_TIME=600000

# AI Behavior Settings
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2000

# File Upload Settings
MAX_FILE_SIZE_MB=10

# Debug Mode
DEBUG=True
```

#### Tạo file `.env` bằng PowerShell:

```powershell
$envContent = @"
# Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:YourPassword@localhost:5432/postgres
SECRET_KEY=YourSecureRandomStringHere
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=false
ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Configuration
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=lmstudio-community/Qwen2.5-7B-Instruct-GGUF
LM_MAX_INFERENCE_TIME=600000

# AI Behavior Settings
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2000

# File Upload Settings
MAX_FILE_SIZE_MB=10

# Debug Mode
DEBUG=True
"@

Set-Content -Path "D:\chientuhocai\tcc_log\.env" -Value $envContent
Write-Host "Backend .env file created successfully!"
```

#### Tạo Secret Key bằng PowerShell:

```powershell
$secretKey = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "Generated Secret Key: $secretKey"
```

#### Hướng dẫn thiết lập chi tiết:

- `DATABASE_URL`: URL kết nối đến PostgreSQL database
  - Format: `postgresql+psycopg2://username:password@host:port/database_name`
  - Lưu ý: Sử dụng `postgresql+psycopg2://` thay vì chỉ `postgresql://` để sử dụng driver psycopg2

- `SECRET_KEY`: Khóa bảo mật cho ứng dụng (JWT token)
  - Phải là một chuỗi ngẫu nhiên (khuyến nghị 32 ký tự trở lên)
  - Bạn có thể sử dụng lệnh PowerShell phía trên để tạo ngẫu nhiên

- `RUN_MIGRATIONS`: Nếu `true`, ứng dụng sẽ tự động chạy migrations khi khởi động
- `SEED_DATA`: Nếu `true`, ứng dụng sẽ tự động tạo dữ liệu mẫu
- `ADDITIONAL_CORS_ORIGINS`: Danh sách các origin được phép CORS, phân cách bằng dấu phẩy

- `LM_STUDIO_BASE_URL`: URL API của LM Studio (mặc định là `http://127.0.0.1:1234/v1`)
- `LM_STUDIO_MODEL`: Tên model AI được sử dụng trong LM Studio
  - Ví dụ: `lmstudio-community/Qwen2.5-7B-Instruct-GGUF`
- `LM_MAX_INFERENCE_TIME`: Thời gian tối đa cho một lần suy luận AI (milliseconds)
  - Giá trị lớn hơn (như 600000 = 10 phút) cho phép AI xử lý các yêu cầu phức tạp

### 2. Frontend Environment (`.env.local`)

File này chứa cấu hình cho Next.js frontend và được đặt trong thư mục `frontend`.

#### Frontend `.env.local` Template:

```properties
# API URLs - Quan trọng cho kết nối giữa frontend và backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://localhost:8000

# Application Settings
NEXT_PUBLIC_APP_NAME=TCC Log
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEBUG=true

# Authentication Settings (nếu cần)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YourAuthSecretHere
```

#### Tạo file bằng PowerShell:

```powershell
$envLocalContent = @"
# API URLs - Quan trọng cho kết nối giữa frontend và backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://localhost:8000

# Application Settings
NEXT_PUBLIC_APP_NAME=TCC Log
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEBUG=true

# Authentication Settings (nếu cần)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YourAuthSecretHere
"@

Set-Content -Path "D:\chientuhocai\tcc_log\frontend\.env.local" -Value $envLocalContent
Write-Host "Frontend .env.local file created successfully!"
```

#### Hướng dẫn thiết lập chi tiết:

- `NEXT_PUBLIC_API_URL`: URL API cho client-side requests (trình duyệt)
  - Thường là `http://localhost:8000` cho môi trường phát triển
  - **Rất quan trọng**: Biến này được sử dụng trong `frontend/app/login/page.tsx` và các file khác
  - Lưu ý: Các biến bắt đầu bằng `NEXT_PUBLIC_` sẽ được bundle vào JavaScript client-side

- `NEXT_SERVER_API_URL`: URL API cho server-side requests (Next.js server)
  - Thường là `http://backend:8000` nếu sử dụng Docker
  - Hoặc `http://localhost:8000` nếu không sử dụng Docker
  - Được sử dụng trong `frontend/context/AuthContext.tsx`

- `NEXT_PUBLIC_DEBUG`: Khi `true`, sẽ hiển thị thông tin debug trong frontend
  - Trong production nên đặt thành `false`

### 3. Cấu hình môi trường phát triển và sản xuất (Tùy chọn)

Next.js cung cấp các file môi trường khác nhau cho các giai đoạn khác nhau. Nếu cần thiết lập riêng cho môi trường phát triển và sản xuất, bạn có thể tạo các file sau:

#### 3.1. `.env.development` (Tùy chọn)

File này chỉ được sử dụng khi chạy trong chế độ development (`npm run dev`).

```powershell
$envDevContent = @"
# Development-specific configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://localhost:8000
NEXT_PUBLIC_DEBUG=true

# Các thông số AI cho môi trường phát triển
NEXT_PUBLIC_ENABLE_AI_DEBUG=true
"@

Set-Content -Path "D:\chientuhocai\tcc_log\frontend\.env.development" -Value $envDevContent
Write-Host "Frontend .env.development file created successfully!"
```

#### 3.2. `.env.production` (Tùy chọn)

File này chỉ được sử dụng khi chạy trong chế độ production (`npm run build` và `npm run start`).

```powershell
$envProdContent = @"
# Production-specific configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_SERVER_API_URL=https://api.your-domain.com
NEXT_PUBLIC_DEBUG=false

# Cấu hình phân tích và theo dõi (nếu có)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
"@

Set-Content -Path "D:\chientuhocai\tcc_log\frontend\.env.production" -Value $envProdContent
Write-Host "Frontend .env.production file created successfully!"
```

## Thiết lập cho môi trường Docker

Dự án TCC Log có thể chạy trong Docker, trong trường hợp này cần có một số cấu hình đặc biệt.

### Docker `.env` Template:

```properties
# Database Configuration for Docker
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/postgres
SECRET_KEY=YourSecureRandomStringHere
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=true

# AI Configuration
LM_STUDIO_BASE_URL=http://host.docker.internal:1234/v1
LM_STUDIO_MODEL=lmstudio-community/Qwen2.5-7B-Instruct-GGUF
LM_MAX_INFERENCE_TIME=600000

# Container settings
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=postgres
```

### Frontend `.env.local` cho Docker:

```properties
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://backend:8000
```

Tạo file bằng PowerShell:

```powershell
$dockerEnvContent = @"
# Database Configuration for Docker
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/postgres
SECRET_KEY=YourSecureRandomStringHere
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=true

# AI Configuration
LM_STUDIO_BASE_URL=http://host.docker.internal:1234/v1
LM_STUDIO_MODEL=lmstudio-community/Qwen2.5-7B-Instruct-GGUF
LM_MAX_INFERENCE_TIME=600000

# Container settings
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=postgres
"@

Set-Content -Path "D:\chientuhocai\tcc_log\.env" -Value $dockerEnvContent
Write-Host "Docker .env file created successfully!"
```

## Tạo các file .env tự động với một Script

Bạn có thể tạo một script để tự động hóa quá trình tạo các file `.env`:

```powershell
# Tạo tại D:\chientuhocai\tcc_log\scripts\setup_env.ps1

# Đường dẫn đến thư mục gốc dự án
$projectRoot = "D:\chientuhocai\tcc_log"

# Tạo Secret Key ngẫu nhiên
function Generate-SecretKey {
    return -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
}

$secretKey = Generate-SecretKey

# File .env cho Backend
$backendEnvContent = @"
# Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:YourPassword@localhost:5432/postgres
SECRET_KEY=$secretKey
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=false
ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Configuration
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=lmstudio-community/Qwen2.5-7B-Instruct-GGUF
LM_MAX_INFERENCE_TIME=600000

# AI Behavior Settings
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2000

# File Upload Settings
MAX_FILE_SIZE_MB=10

# Debug Mode
DEBUG=True
"@

# File .env.local cho Frontend
$frontendEnvContent = @"
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://localhost:8000

# Application Settings
NEXT_PUBLIC_APP_NAME=TCC Log
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEBUG=true

# Authentication Settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$secretKey
"@

# Tạo các file
Set-Content -Path "$projectRoot\.env" -Value $backendEnvContent
Set-Content -Path "$projectRoot\frontend\.env.local" -Value $frontendEnvContent

Write-Host "Environment files created successfully!"
Write-Host "Backend .env: $projectRoot\.env"
Write-Host "Frontend .env.local: $projectRoot\frontend\.env.local"
Write-Host "Remember to update database password and other sensitive information!"
```

Để sử dụng script này, chạy lệnh:

```powershell
# Đảm bảo thực thi từ thư mục gốc dự án
cd D:\chientuhocai\tcc_log
.\scripts\setup_env.ps1
```

## Ghi chú bảo mật

1. **KHÔNG BAO GIỜ** commit các file `.env` vào Git repository
   - Kiểm tra trong `.gitignore` đã có các mục `.env`, `.env.*`, `*.env` chưa
   - Nếu đã vô tình commit, hãy xóa khỏi lịch sử git bằng lệnh `git filter-branch`

2. **Bảo vệ thông tin nhạy cảm**:
   - `SECRET_KEY` phải là một chuỗi ngẫu nhiên đủ dài và phức tạp
   - Mật khẩu database không nên quá đơn giản
   - Không sử dụng thông tin nhạy cảm trong các biến `NEXT_PUBLIC_`

3. **Backup an toàn**:
   - Lưu trữ cấu hình `.env` ở nơi an toàn (như password manager)
   - Tạo file `.env.example` chứa mẫu cấu hình (không chứa dữ liệu thật) để chia sẻ với đội

## Khắc phục sự cố

### Kết nối Database
- **Lỗi kết nối**: Kiểm tra `DATABASE_URL` có chính xác không
  - Format: `postgresql+psycopg2://username:password@host:port/database_name`
  - Đảm bảo PostgreSQL đang chạy và có thể truy cập
  - Thử kết nối trực tiếp bằng `psql` để xác nhận thông tin kết nối

- **Lỗi Migration**: 
  - Nếu gặp lỗi khi migrations chạy, kiểm tra `RUN_MIGRATIONS=true` 
  - Có thể chạy migrations thủ công: `alembic upgrade head`

### Kết nối LM Studio API
- **Kiểm tra LM Studio**: Đảm bảo LM Studio đang chạy và server API đã được bật
  - Mặc định port là 1234, xác nhận trong LM Studio
  - Kiểm tra URL: `LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1`
- **Lỗi model**: Đảm bảo `LM_STUDIO_MODEL` đúng với tên model đã load trong LM Studio

### Frontend - Backend Integration
- **Lỗi CORS**: Nếu gặp lỗi CORS, kiểm tra `ADDITIONAL_CORS_ORIGINS` trong backend
- **Lỗi Authentication**: Kiểm tra `NEXT_PUBLIC_API_URL` và `NEXT_SERVER_API_URL` trỏ đến đúng backend
- **Lỗi Rendering Khác Nhau**:
  - Next.js render ở cả client và server, nên URL có thể khác nhau
  - Đảm bảo cả `NEXT_PUBLIC_API_URL` và `NEXT_SERVER_API_URL` đều được cấu hình đúng
