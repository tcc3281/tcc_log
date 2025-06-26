# 🚀 TCC Log - AI-Powered Learning Journal

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com/)

> **Ứng dụng ghi chú học tập thông minh tích hợp AI** - Nâng cao trải nghiệm học tập với sức mạnh của Artificial Intelligence

## 📖 Tổng quan

TCC Log là một ứng dụng web hiện đại được thiết kế để hỗ trợ học tập và tổ chức kiến thức một cách thông minh. Với sự tích hợp sâu sắc của AI và các công nghệ tiên tiến, ứng dụng cung cấp một nền tảng toàn diện cho việc ghi chú, phân tích và tối ưu hóa quá trình học tập.

### 🎯 Mục tiêu
- **Tối ưu hóa quá trình học tập** thông qua AI-powered insights
- **Tự động hóa phân tích** nội dung và cảm xúc trong các ghi chú
- **Cung cấp trợ lý AI** thông minh cho việc giải đáp thắc mắc
- **Tổ chức kiến thức** một cách khoa học và dễ tìm kiếm

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │   + PGVector    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   AI Engine     │
                    │  (LangChain +   │
                    │   LM Studio)    │
                    └─────────────────┘
```

### 🛠️ Stack công nghệ

#### Backend
- **FastAPI** - Modern Python web framework với performance cao
- **SQLAlchemy** - ORM mạnh mẽ với async support
- **PostgreSQL** - Reliable database với PGVector extension
- **Alembic** - Database migration tool
- **Pydantic** - Data validation và serialization

#### Frontend  
- **Next.js 14** - React framework với App Router
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development
- **React Hook Form** - Form handling và validation

#### AI/ML
- **LangChain** - Framework cho LLM applications
- **LM Studio** - Local AI model serving
- **OpenAI API** - External AI model integration
- **PGVector** - Vector similarity search

## ✨ Tính năng chính

### 📝 Quản lý Journal thông minh
- **Rich Text Editor** với hỗ trợ Markdown và LaTeX
- **Phân loại chủ đề** (Topics) với hierarchy structure
- **Tag system** linh hoạt cho việc tổ chức và tìm kiếm
- **File upload** hỗ trợ hình ảnh, documents và multimedia
- **Profile management** với avatar và preferences cá nhân
- **Date-based organization** với calendar view

### 🤖 AI-Powered Features

#### 💬 Intelligent Chat Assistant
- **Interactive AI Chatbot** hỗ trợ học tập 24/7
- **Context-aware responses** dựa trên journal content
- **LaTeX rendering** cho công thức toán học
- **Streaming responses** với real-time feedback
- **Think/Answer separation** - theo dõi quá trình suy nghĩ AI
- **Performance monitoring** (tokens/second, inference time)

#### 📊 Advanced Content Analysis
- **General Analysis**: Phân tích tổng quan nội dung và chất lượng
- **Mood Analysis**: Đánh giá trạng thái cảm xúc và mental health
- **Content Summary**: Tóm tắt key points và takeaways
- **Learning Insights**: Trích xuất patterns và recommendations
- **Progress Tracking**: Theo dõi learning journey theo thời gian

#### ✍️ Writing Enhancement
- **Grammar & Spell Check**: Tự động detect và suggest fixes
- **Style Improvement**: Cải thiện clarity và readability  
- **Vocabulary Enhancement**: Suggest synonyms và academic terms
- **Structure Analysis**: Đánh giá logic flow và organization

#### 🔍 Semantic Search
- **Vector-based search** với PGVector cho similarity matching
- **Natural language queries** thay vì keyword search
- **Cross-reference suggestions** tìm related content
- **Auto-tagging** dựa trên content analysis

### 🔐 Security & Authentication
- **JWT-based authentication** với refresh token
- **Role-based access control** (User, Admin)
- **Password hashing** với bcrypt
- **Secure file upload** với type validation
- **API rate limiting** và request validation

## 🚀 Cài đặt và Triển khai

### Yêu cầu hệ thống
- **Python 3.9+**
- **Node.js 18+** và npm/yarn
- **PostgreSQL 14+** với PGVector extension
- **LM Studio** (optional, for local AI models)

### � Prerequisites

1. **Database Setup**
```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Windows (using chocolatey)
choco install postgresql

# macOS (using homebrew)  
brew install postgresql
```

2. **PGVector Extension**
```sql
-- Connect to PostgreSQL as superuser
CREATE EXTENSION IF NOT EXISTS vector;
```

### 🔧 Installation

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/tcc-log.git
cd tcc-log
```

#### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux  
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configurations
nano .env
```

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/tcc_log
TEST_DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/tcc_log_test

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_API_KEY=your-lm-studio-key

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB
```

#### 4. Database Migration
```bash
# Initialize Alembic (if not done)
alembic init alembic

# Create and run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Seed sample data (optional)
python -m app.seed_data
```

#### 5. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create environment file
cp .env.local.example .env.local

# Edit frontend environment
nano .env.local
```

**Frontend Environment:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=TCC Log
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### 🎮 Running the Application

#### Development Mode

**Backend (Terminal 1):**
```bash
# From project root
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# or
yarn dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Alternative API Docs: http://localhost:8000/redoc

#### Production Mode

**Using Docker Compose:**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

**Manual Production Setup:**
```bash
# Backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Frontend  
cd frontend
npm run build
npm start
```

### 🔧 LM Studio Configuration

1. **Download và Install LM Studio** từ https://lmstudio.ai/
2. **Download AI Models** (ví dụ: Llama, Mistral, CodeLlama)
3. **Start Local Server:**
   ```
   - Mở LM Studio
   - Chọn model và click "Start Server"
   - Default URL: http://localhost:1234/v1
   ```
4. **Configure trong .env:**
   ```env
   LM_STUDIO_BASE_URL=http://localhost:1234/v1
   LM_STUDIO_API_KEY=lm-studio  # hoặc key của bạn
   ```

## 🧪 Testing

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test files
pytest tests/test_auth.py
pytest tests/test_ai_features.py
```

## 📁 Cấu trúc dự án

```
tcc_log/
├── 📁 app/                  # Backend application
│   ├── __init__.py
│   ├── main.py             # FastAPI application entry
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── crud.py             # Database operations
│   ├── 📁 api/             # API routes
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── users.py        # User management
│   │   ├── topics.py       # Topic management
│   │   ├── entries.py      # Journal entries
│   │   ├── files.py        # File upload/download
│   │   └── ai.py           # AI integration endpoints
│   └── 📁 ai/              # AI modules
│       ├── agent.py        # Main AI agent
│       ├── lm_studio.py    # LM Studio integration
│       └── sql_tool.py     # Database query tool
├── 📁 frontend/             # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript types
│   └── public/             # Static assets
├── 📁 tests/               # Test suite
│   ├── conftest.py         # Test configuration
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── config/             # Test configs
├── 📁 alembic/             # Database migrations
├── 📁 docs/                # Documentation
├── 📁 scripts/             # Utility scripts
├── requirements.txt        # Python dependencies
├── docker-compose.yml      # Docker orchestration
├── .env.example            # Environment template
└── README.md               # This file
```

## 🛡️ Security & Best Practices

### Authentication & Authorization
- **JWT tokens** với expiration và refresh mechanism
- **Password hashing** sử dụng bcrypt với salt
- **Role-based permissions** cho admin functions
- **API rate limiting** để prevent abuse

### Data Protection
- **Input validation** với Pydantic schemas
- **SQL injection protection** với SQLAlchemy ORM
- **File upload security** với type checking và size limits
- **CORS configuration** cho cross-origin requests

### Performance Optimization
- **Database indexing** cho search performance
- **Connection pooling** cho database efficiency
- **Caching strategies** cho frequent queries
- **Async operations** cho I/O bound tasks

## 🔧 Configuration & Customization

### AI Model Configuration
```python
# app/ai/lm_studio.py
LM_STUDIO_CONFIG = {
    "base_url": "http://localhost:1234/v1",
    "model": "llama-2-7b-chat",
    "temperature": 0.7,
    "max_tokens": 2048,
    "stream": True
}
```

### Database Customization
```python
# app/database.py
DATABASE_CONFIG = {
    "pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600
}
```

## 📈 Monitoring & Logging

### Application Monitoring
- **Structured logging** với contextual information
- **Performance metrics** tracking (response times, throughput)
- **Error tracking** với detailed stack traces
- **Health checks** cho system components

### AI Model Monitoring  
- **Token usage tracking** cho cost management
- **Model performance metrics** (latency, accuracy)
- **Request/response logging** for debugging
- **Model switching** based on performance

## 🤝 Contributing

### Development Workflow
1. **Fork** repository và create feature branch
2. **Follow coding standards** (Black, isort, mypy)
3. **Write tests** cho new features
4. **Update documentation** nếu cần
5. **Submit pull request** với clear description

### Code Standards
```bash
# Format code
black app/ tests/
isort app/ tests/

# Type checking
mypy app/

# Linting
flake8 app/ tests/
```

### Commit Message Convention
```
feat: add new AI analysis feature
fix: resolve database connection issue  
docs: update installation guide
test: add unit tests for auth module
refactor: optimize database queries
```

## � Support & Community

### Getting Help
- **GitHub Issues**: Report bugs và feature requests
- **Discussions**: Community Q&A và ideas
- **Documentation**: Comprehensive guides trong `/docs`
- **Email**: support@tcclog.com

### Resources
- [API Documentation](http://localhost:8000/docs)
- [Frontend Components Guide](./frontend/README.md)
- [Database Schema](./docs/database-schema.md)
- [AI Integration Guide](./docs/ai-integration.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** team cho excellent framework
- **LangChain** community cho AI integration tools
- **Next.js** team cho modern React framework
- **PostgreSQL** và **PGVector** cho powerful database capabilities

---

**Made with ❤️ by TCC Log Team**

*Transforming learning through intelligent technology*
- Custom Theme Support: Tùy chỉnh theo theme yêu thích
- Batch Generation: Tạo nhiều prompts cùng lúc
```

#### 🔧 Advanced AI Features
```
⚡ Technical Capabilities
- Server-Sent Events (SSE) streaming
- Chunk-based response processing
- Error handling với retry logic
- Response caching và optimization
- Model health monitoring
- Timeout protection cho long-running tasks
```

## 🚀 Cài đặt với Docker (Khuyến nghị)

### On Windows (PowerShell)
```powershell
# Run the setup script
.\scripts\run_docker.ps1
```

This will:
1. Build the Docker images
2. Start the containers (PostgreSQL, Backend, Frontend)
3. Run migrations
4. Make the application available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - AI Chat Interface: http://localhost:3000/ai

### Manual Docker Setup
```bash
# Stop any running containers
docker-compose down

# Build the images
docker-compose build

# Start the containers
docker-compose up -d

# Run migrations (if needed)
docker-compose exec backend python -m alembic upgrade head
```

## 🛠️ Cài đặt môi trường phát triển

### 1. Thiết lập Backend với AI Support
```bash
# Tạo conda environment
conda create -n tcc_log python=3.10 -y
conda activate tcc_log

# Cài đặt tất cả dependencies (bao gồm AI packages)
pip install -r requirements.txt
```

### 2. Cấu hình AI Services

Để cài đặt các file môi trường (.env) cần thiết cho dự án, vui lòng tham khảo [Hướng dẫn Thiết lập Môi trường](docs/ENVIRONMENT_SETUP_GUIDE.md) chi tiết.

Các biến môi trường chính cần thiết lập:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/journal_db
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# LM Studio Configuration (Local AI)
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=your-model-name
LM_MAX_INFERENCE_TIME=60000

# AI Behavior Settings
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2000

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,md
```

### 3. Database Setup
```bash
# Chạy migrations
alembic upgrade head

# Nếu cần tạo migration mới
alembic revision --autogenerate -m "Migration description"
```

### 4. Khởi động ứng dụng
```bash
# Backend
python scripts/run_backend.py
# hoặc
uvicorn app.main:app --reload

# Frontend (terminal mới)
cd frontend
npm install
npm run dev
```

## 🏗️ Cấu trúc dự án

```
/
├── app/                    # Backend FastAPI
│   ├── ai/                # AI integration modules
│   │   ├── lm_studio.py   # LM Studio client & utilities
│   │   └── __init__.py
│   ├── api/               # API routes
│   │   ├── ai.py          # AI endpoints
│   │   ├── auth.py        # Authentication
│   │   ├── entries.py     # Journal entries
│   │   ├── users.py       # User management
│   │   └── ...
│   ├── models.py          # Database models
│   ├── schemas.py         # Pydantic schemas
│   └── main.py           # FastAPI app
├── frontend/              # Next.js frontend
│   ├── app/
│   │   ├── ai/           # AI chat interface
│   │   ├── entries/      # Journal entries
│   │   └── ...
│   ├── components/
│   │   ├── AI/           # AI-related components
│   │   └── ...
│   └── lib/
│       ├── ai-utils.ts   # AI utility functions
│       └── ...
├── scripts/               # Deployment scripts
├── docs/                  # Documentation
├── tests/                 # Unit tests
├── uploads/               # User uploads
├── alembic/               # Database migrations
└── docker-compose.yml     # Docker configuration
```

## 🤖 AI Integration chi tiết

### LM Studio Setup
1. **Cài đặt LM Studio**: Download từ [lmstudio.ai](https://lmstudio.ai)
2. **Load Model**: Download và load một model
3. **Start Local Server**: Bật local server trong LM Studio (port 1234)
4. **Cấu hình .env**: Đặt `LM_STUDIO_BASE_URL=http://localhost:1234/v1`

### AI Features đã tích hợp

#### 🗨️ Chat Assistant (`/ai`)
- **Streaming Chat**: Real-time response với SSE
- **Think/Answer Separation**: Hiển thị quá trình suy nghĩ và kết quả
- **LaTeX Support**: Render công thức toán học
- **Performance Metrics**: Token/giây, thời gian inference
- **Model Selection**: Chọn model từ LM Studio

#### 📊 Entry Analysis (`/api/ai/analyze-entry`)
- **4 loại phân tích**: General, Mood, Summary, Insights
- **Structured Output**: Think section + Answer
- **Multi-model Support**: Chọn model cho từng phân tích

#### ✍️ Writing Enhancement (`/api/ai/improve-writing`)
- **Grammar Correction**: Sửa lỗi ngữ pháp
- **Style Improvement**: Cải thiện văn phong
- **Vocabulary Enhancement**: Nâng cao từ vựng
- **Complete Polish**: Tối ưu toàn diện

### API Endpoints

```bash
# AI Service Status
GET /api/ai/status

# Available Models
GET /api/ai/models

# Chat (Non-streaming)
POST /api/ai/chat

# Chat (Streaming)
POST /api/ai/chat-stream

# Analyze Journal Entry
POST /api/ai/analyze-entry

# Improve Writing
POST /api/ai/improve-writing

# Writing Suggestions
POST /api/ai/writing-suggestions

# Generate Prompts
POST /api/ai/generate-prompts
```

## 📱 Sử dụng

### Workflow cơ bản:
1. **Đăng ký/Đăng nhập** tài khoản
2. **Tạo Topics** để phân loại nội dung học tập
3. **Viết Journal Entries** với Markdown editor
4. **Upload files** đính kèm nếu cần
5. **Chat với AI** để được hỗ trợ học tập
6. **Analyze entries** để có insights
7. **Improve writing** với AI suggestions

### AI Features Usage:
- **Chat**: Vào `/ai` để chat trực tiếp với AI
- **Analysis**: Click "Analyze" trên journal entry
- **Writing Help**: Sử dụng writing improvement tools
- **Prompts**: Generate prompts cho inspiration

## 🔧 Development Commands

```bash
# Chạy tests
python -m pytest tests/

# Format code
black app/
isort app/

# Type checking
mypy app/

# Database operations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1

# AI service check
curl http://localhost:8000/api/ai/status
```

## 📄 Dependencies

### AI/ML Stack:
- **LangChain**: Framework cho AI applications
- **OpenAI**: Compatible API cho LM Studio
- **tiktoken**: Tokenization utilities
- **httpx**: Async HTTP client cho AI requests

### Backend Stack:
- **FastAPI**: Modern web framework
- **SQLAlchemy**: ORM cho database
- **Alembic**: Database migrations
- **Pydantic**: Data validation
- **PGVector**: Vector database extension

### Frontend Stack:
- **Next.js**: React framework
- **TailwindCSS**: Utility-first CSS
- **TypeScript**: Type safety

## 🤝 Contributing

Đây là dự án học tập cá nhân, mọi góp ý và đóng góp đều được hoan nghênh!

## 📄 License

MIT License - Dự án học tập cá nhân