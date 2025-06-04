# TCC Log - AI-Powered Learning Journal

Ứng dụng ghi chú học tập thông minh tích hợp AI Chatbot hỗ trợ học tập và tổ chức kiến thức một cách hiệu quả.

**Công nghệ:**
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL  
- Frontend: Next.js + TailwindCSS
- AI Engine: LangChain + OpenAI + LM Studio
- Vector Search: PGVector cho semantic search

## ✨ Tính năng chính

### 📝 Quản lý ghi chú học tập
- Tạo và quản lý journal entries với Markdown editor hỗ trợ LaTeX
- Phân loại theo chủ đề (Topics) 
- Gắn tags để dễ tìm kiếm
- Upload file đính kèm (hình ảnh, tài liệu)
- Quản lý profile và avatar cá nhân

### 🤖 AI Ecosystem - Trái tim của ứng dụng

#### 🧠 Multi-Model AI Support
- **LM Studio Integration**: Kết nối với local AI models thông qua LM Studio
- **OpenAI Compatible**: Hỗ trợ các model OpenAI API format
- **LangChain Framework**: Sử dụng LangChain để quản lý AI workflows
- **Model Auto-Selection**: Tự động chọn model phù hợp cho từng task

#### 💬 Intelligent Chat Assistant
```
🎯 Smart Study Companion
- Chat trực tiếp với AI về nội dung học tập
- Hỗ trợ LaTeX rendering cho công thức toán học
- Streaming responses với real-time feedback
- Think/Answer separation - xem quá trình suy nghĩ của AI
- Performance metrics (tokens/second, inference time)
```

#### 📊 Advanced Journal Analysis
```
📈 AI-Powered Entry Analysis
- General Analysis: Phân tích tổng quan nội dung ghi chú
- Mood Analysis: Đánh giá trạng thái cảm xúc
- Content Summary: Tóm tắt các điểm chính
- Key Insights: Trích xuất insights quan trọng
- Multi-model support cho từng loại phân tích
```

#### ✍️ Writing Enhancement Tools
```
🚀 AI Writing Assistant
- Grammar Correction: Sửa lỗi ngữ pháp và chính tả
- Style Improvement: Cải thiện văn phong và flow
- Vocabulary Enhancement: Nâng cao từ vựng
- Complete Writing Polish: Tối ưu toàn diện
- Writing Suggestions: Gợi ý chi tiết để cải thiện
```

#### 🎨 Content Generation Features
```
📝 Smart Content Creation
- Journaling Prompts: Tạo gợi ý chủ đề viết nhật ký
- Topic-based Prompts: Gợi ý theo chủ đề cụ thể
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