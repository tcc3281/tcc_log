# 🚀 TCC Log - AI-Powered Learning Journal

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com/)
[![LM Studio](https://img.shields.io/badge/LM%20Studio-FF6B35?style=for-the-badge&logo=openai&logoColor=white)](https://lmstudio.ai/)

> **Ứng dụng ghi chú học tập thông minh tích hợp AI** - Nâng cao trải nghiệm học tập với sức mạnh của Artificial Intelligence

## 📖 Tổng quan

TCC Log là một ứng dụng web full-stack hiện đại được thiết kế để hỗ trợ học tập và tổ chức kiến thức một cách thông minh. Với sự tích hợp sâu sắc của AI models thông qua LM Studio và LangChain, ứng dụng cung cấp một nền tảng toàn diện cho việc ghi chú, phân tích nội dung, và tối ưu hóa quá trình học tập với khả năng streaming real-time.

### 🎯 Mục tiêu
- **Tối ưu hóa quá trình học tập** thông qua AI-powered insights và analysis
- **Streaming AI Chat** với real-time response generation cho trải nghiệm tương tác mượt mà
- **Intelligent SQL Analysis** với khả năng auto-detect và execute database queries
- **Multi-modal AI Features** bao gồm content analysis, writing improvement, và mood tracking
- **Tổ chức kiến thức** một cách khoa học với topic management và tagging system

## 🏗️ Kiến trúc hệ thống

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15 App Router]
        A1[React Components]
        A2[TailwindCSS]
        A3[TypeScript]
    end
    
    subgraph "Backend Layer"
        B[FastAPI Application]
        B1[API Routes]
        B2[Authentication]
        B3[File Management]
        B4[CRUD Operations]
    end
    
    subgraph "AI Engine"
        C[LM Studio Local Server]
        C1[LangChain Agent]
        C2[SQL Tool Integration]
        C3[Streaming Handler]
        C4[Prompt Manager]
    end
    
    subgraph "Data Layer"
        D[PostgreSQL Database]
        D1[User Management]
        D2[Journal Entries]
        D3[Topics & Tags]
        D4[File Storage]
    end
    
    A --> B
    B --> C
    B --> D
    C1 --> C2
    C1 --> D
    
    style C fill:#ff6b35
    style A fill:#000000,color:#ffffff
    style B fill:#005571
    style D fill:#316192
```

### 🛠️ Stack công nghệ

```mermaid
graph LR
    subgraph "Backend Stack"
        B1[FastAPI] --> B2[SQLAlchemy ORM]
        B2 --> B3[PostgreSQL]
        B4[Alembic] --> B3
        B5[Pydantic] --> B1
    end
    
    subgraph "Frontend Stack"
        F1[Next.js 15] --> F2[React 19]
        F2 --> F3[TailwindCSS]
        F3 --> F4[TypeScript]
        F5[React Hook Form] --> F2
    end
    
    subgraph "AI/ML Stack"
        A1[LM Studio] --> A2[LangChain]
        A2 --> A3[OpenAI API Compatible]
        A4[Custom Streaming] --> A1
        A5[SQL Tools] --> A2
    end
    
    subgraph "DevOps & Tools"
        D1[Docker Compose] --> D2[PostgreSQL Container]
        D3[Python 3.10+] --> B1
        D4[Node.js 18+] --> F1
    end
    
    style A1 fill:#ff6b35
    style F1 fill:#000000,color:#ffffff
    style B1 fill:#005571
    style B3 fill:#316192
```

#### Backend Technologies
- **FastAPI** - Modern Python web framework với automatic API documentation
- **SQLAlchemy** - Powerful ORM với async support và relationship management
- **PostgreSQL** - Reliable relational database với JSON support
- **Alembic** - Database migration tool cho version control
- **Pydantic** - Data validation và serialization với type hints

#### Frontend Technologies  
- **Next.js 15** - React framework với App Router và server components
- **React 19** - Latest React với improved performance và features
- **TailwindCSS** - Utility-first CSS framework cho responsive design
- **TypeScript** - Type-safe development với improved DX
- **React Hook Form** - Efficient form handling với validation

#### AI/ML Technologies
- **LM Studio** - Local AI model serving với OpenAI-compatible API
- **LangChain** - Framework cho LLM applications với tool integration
- **Custom Streaming** - Real-time token streaming implementation
- **SQL Tools** - Intelligent database interaction với auto-execution
- **Prompt Management** - Dynamic prompt templates cho different AI tasks

## ✨ Tính năng chính

### 📝 Core Journal Management
```mermaid
graph TD
    A[Journal Entry Creation] --> B[Rich Text Editor]
    B --> C[Markdown Support]
    C --> D[LaTeX Math Rendering]
    
    A --> E[Topic Management]
    E --> F[Hierarchical Topics]
    F --> G[Tag System]
    
    A --> H[File Attachments]
    H --> I[Image Upload]
    H --> J[Document Support]
    
    A --> K[Metadata]
    K --> L[Date & Location]
    K --> M[Mood Tracking]
```

- **Advanced Rich Text Editor** với hỗ trợ Markdown và LaTeX rendering
- **Hierarchical Topic System** cho việc tổ chức nội dung theo chủ đề
- **Flexible Tag System** với auto-suggestions và filtering
- **File Upload System** hỗ trợ images, documents và multimedia files
- **Metadata Management** với date-based organization và mood tracking
- **Profile Management** với avatar upload và personal preferences

### 🤖 AI-Powered Features

```mermaid
graph TB
    subgraph "AI Core Engine"
        A[LM Studio Local Server]
        A --> B[LangChain Agent]
        A --> C[Direct LLM Streaming]
    end
    
    subgraph "AI Features"
        D[Streaming Chat]
        E[Content Analysis]
        F[Writing Enhancement]
        G[SQL Intelligence]
        H[Prompt Generation]
    end
    
    subgraph "Analysis Types"
        E --> E1[General Analysis]
        E --> E2[Mood Analysis] 
        E --> E3[Content Summary]
        E --> E4[Learning Insights]
    end
    
    subgraph "Writing Tools"
        F --> F1[Grammar Check]
        F --> F2[Style Improvement]
        F --> F3[Vocabulary Enhancement]
        F --> F4[Structure Analysis]
    end
    
    B --> D
    B --> E
    B --> F
    B --> G
    C --> D
    
    style A fill:#ff6b35
    style B fill:#1C3C3C
```

#### 💬 Intelligent Streaming Chat
- **Real-time Token Streaming** với true token-level response generation
- **Think/Answer Separation** - theo dõi quá trình suy nghĩ của AI
- **LaTeX Mathematical Rendering** cho công thức toán học phức tạp
- **Performance Monitoring** với tokens/second và inference time tracking
- **Multiple Streaming Modes** từ basic đến advanced với tool integration
- **Context-aware Responses** dựa trên journal content và conversation history

#### 📊 Advanced Content Analysis
- **General Analysis**: Phân tích tổng quan về chất lượng và cấu trúc nội dung
- **Mood Analysis**: Đánh giá trạng thái cảm xúc và mental health patterns
- **Content Summary**: Tóm tắt key points và main takeaways
- **Learning Insights**: Trích xuất patterns và đưa ra recommendations
- **Progress Tracking**: Theo dõi learning journey theo thời gian

#### ✍️ Intelligent Writing Enhancement
- **Grammar & Spell Correction**: Tự động detect và suggest improvements
- **Style Enhancement**: Cải thiện clarity, readability và flow
- **Vocabulary Enrichment**: Suggest synonyms và academic terminology
- **Structure Optimization**: Đánh giá logic flow và organization
- **Tone Adjustment**: Điều chỉnh tone phù hợp với context

#### 🔍 SQL Intelligence System
- **Auto-detect Database Queries**: Tự động nhận biết câu hỏi liên quan database
- **Schema Injection**: Dynamic injection của database schema vào prompts
- **SQL Auto-execution**: Tự động execute SQL queries từ AI responses
- **Result Formatting**: Beautiful markdown table formatting cho query results
- **Error Handling**: Comprehensive error handling với meaningful messages

### 🔐 Security & Authentication

```mermaid
graph TD
    A[User Authentication] --> B[JWT Token System]
    B --> C[Access Token]
    B --> D[Refresh Token]
    
    E[Authorization] --> F[Role-based Access Control]
    F --> G[User Role]
    F --> H[Admin Role]
    
    I[Data Security] --> J[Password Hashing bcrypt]
    I --> K[Input Validation Pydantic]
    I --> L[SQL Injection Protection]
    
    M[File Security] --> N[Type Validation]
    M --> O[Size Limits]
    M --> P[Secure Upload Path]
    
    Q[API Security] --> R[Rate Limiting]
    Q --> S[CORS Configuration]
    Q --> T[Request Validation]
```

- **JWT-based Authentication** với secure token management và refresh mechanism
- **Role-based Access Control** (User, Admin) với granular permissions
- **Password Security** với bcrypt hashing và salt generation
- **Input Validation** comprehensive với Pydantic schemas
- **File Upload Security** với type checking, size limits và path sanitization
- **API Protection** với rate limiting, CORS configuration và request validation

## 🚀 Cài đặt và Triển khai

### 📋 Yêu cầu hệ thống

```mermaid
graph LR
    subgraph "Development Requirements"
        A[Python 3.10+]
        B[Node.js 18+]
        C[PostgreSQL 14+]
        D[LM Studio Desktop App]
    end
    
    subgraph "Production Requirements"
        E[Docker & Docker Compose]
        F[Git]
        G[4GB+ RAM]
        H[2GB+ Storage]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
```

- **Python 3.10+** với pip package manager
- **Node.js 18+** với npm/yarn package manager  
- **PostgreSQL 14+** với database creation privileges
- **LM Studio** desktop application cho local AI models
- **Docker & Docker Compose** (recommended) cho containerized deployment
- **Git** cho version control và repository cloning

### 🎯 Quick Start với Docker (Khuyến nghị)

```mermaid
sequenceDiagram
    participant User
    participant Docker
    participant DB as PostgreSQL
    participant Backend as FastAPI
    participant Frontend as Next.js
    participant LM as LM Studio
    
    User->>Docker: docker-compose up
    Docker->>DB: Start PostgreSQL container
    Docker->>Backend: Start FastAPI container
    Docker->>Frontend: Start Next.js container
    
    Backend->>DB: Run migrations
    Backend->>DB: Seed initial data
    
    User->>LM: Start LM Studio manually
    LM->>Backend: Provide AI endpoint
    
    User->>Frontend: Access http://localhost:3000
    Frontend->>Backend: API calls
    Backend->>LM: AI requests
```

#### Windows (PowerShell)
```powershell
# Clone repository
git clone https://github.com/your-username/tcc-log.git
cd tcc-log

# Run setup script (builds và starts all containers)
.\scripts\run_docker.ps1

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

#### Linux/macOS
```bash
# Clone repository
git clone https://github.com/your-username/tcc-log.git
cd tcc-log

# Start with Docker Compose
docker-compose up --build -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
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

## 🎮 Running the Application

### ⚡ Development Mode

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Docker as Docker Compose
    participant DB as PostgreSQL Container
    participant Backend as FastAPI Container
    participant Frontend as Next.js Container
    participant LM as LM Studio
    
    Dev->>Docker: docker-compose up --build
    Docker->>DB: Start PostgreSQL
    Docker->>Backend: Start FastAPI
    Docker->>Frontend: Start Next.js
    
    Backend->>DB: Run Alembic migrations
    Backend->>DB: Seed initial data
    
    Dev->>LM: Start LM Studio locally
    LM->>Backend: Provide AI endpoint (:1234)
    
    Frontend->>Backend: API calls (:8000)
    Backend->>LM: AI requests
    Backend->>DB: Data operations
    
    Note over Dev: Access at http://localhost:3000
```

#### Access Points:
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc
- **AI Chat Interface**: http://localhost:3000/ai

#### Manual Development Setup:
```bash
# Terminal 1: Backend
cd tcc-log
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: LM Studio (if not using Docker)
# Start LM Studio application and load a model
```

### 🏭 Production Deployment

```mermaid
graph TD
    subgraph "Production Environment"
        A[Load Balancer] --> B[FastAPI Containers]
        A --> C[Next.js Containers]
        
        B --> D[PostgreSQL Cluster]
        B --> E[LM Studio Servers]
        
        F[Redis Cache] --> B
        G[File Storage] --> B
        H[Monitoring] --> B
        H --> C
    end
    
    subgraph "Scaling Options"
        I[Horizontal Scaling]
        I --> J[Multiple FastAPI Instances]
        I --> K[Database Read Replicas]
        I --> L[CDN for Static Assets]
    end
    
    B --> F
    C --> G
```

#### Production with Docker:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale specific services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 🧪 Testing & Quality Assurance

### 🔍 Testing Architecture

```mermaid
graph TB
    subgraph "Test Categories"
        A[Unit Tests] --> A1[Individual Functions]
        A --> A2[Class Methods]
        A --> A3[API Endpoints]
        
        B[Integration Tests] --> B1[Database Operations]
        B --> B2[AI Service Integration]
        B --> B3[End-to-End Workflows]
        
        C[Performance Tests] --> C1[Load Testing]
        C --> C2[Streaming Performance]
        C --> C3[Database Query Optimization]
    end
    
    subgraph "Test Tools"
        D[pytest] --> E[Async Test Support]
        F[pytest-asyncio] --> G[AI Testing]
        H[pytest-cov] --> I[Coverage Reports]
    end
    
    A1 --> D
    B1 --> F
    C1 --> H
```

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx

# Run all tests
pytest

# Run with coverage reporting
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test categories
pytest tests/unit/          # Unit tests only
pytest tests/integration/   # Integration tests only
pytest tests/ai/           # AI-specific tests

# Run tests with verbose output
pytest -v -s

# Run specific test file
pytest tests/test_ai_features.py -v
```

### AI Testing Examples
```bash
# Test AI service connectivity
pytest tests/ai/test_lm_studio_connection.py

# Test streaming functionality
pytest tests/ai/test_streaming_responses.py

# Test SQL tool integration
pytest tests/ai/test_sql_tools.py

# Performance benchmarks
pytest tests/performance/ --benchmark-only
```

## 🛡️ Security & Best Practices

### 🔐 Security Implementation

```mermaid
graph TD
    subgraph "Authentication Layer"
        A[JWT Tokens] --> B[Access Token]
        A --> C[Refresh Token]
        B --> D[30min Expiry]
        C --> E[7 Day Expiry]
    end
    
    subgraph "Authorization Layer"
        F[Role-Based Access] --> G[User Role]
        F --> H[Admin Role]
        G --> I[Own Resources Only]
        H --> J[System Administration]
    end
    
    subgraph "Data Protection"
        K[Input Validation] --> L[Pydantic Schemas]
        M[SQL Injection Prevention] --> N[SQLAlchemy ORM]
        O[File Upload Security] --> P[Type & Size Validation]
        Q[Password Security] --> R[bcrypt + Salt]
    end
    
    subgraph "API Security"
        S[Rate Limiting] --> T[Request Throttling]
        U[CORS Configuration] --> V[Origin Validation]
        W[Request Validation] --> X[Schema Enforcement]
    end
    
    style A fill:#1C3C3C,color:#ffffff
    style F fill:#005571
    style K fill:#316192
    style S fill:#ff6b35
```

### Best Practices Implementation

#### Environment Security
```bash
# Use strong secret keys
SECRET_KEY=$(openssl rand -hex 32)

# Secure database connections
DATABASE_URL=postgresql://user:strong_password@localhost:5432/tcc_log

# API rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600  # 1 hour

# File upload limits
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,md
```

#### Code Security Practices
```python
# Input validation example
from pydantic import BaseModel, validator
from typing import Optional

class SecureEntryCreate(BaseModel):
    title: str
    content: str
    topic_id: int
    
    @validator('title')
    def validate_title(cls, v):
        if len(v) > 200:
            raise ValueError('Title too long')
        return v.strip()
    
    @validator('content')
    def validate_content(cls, v):
        if len(v) > 50000:  # 50KB limit
            raise ValueError('Content too long')
        return v
```

## 📈 Monitoring & Performance

### 📊 Application Monitoring

```mermaid
graph LR
    subgraph "Real-time Metrics"
        A[Request Latency] --> A1[API Response Times]
        B[AI Performance] --> B1[Tokens/Second]
        C[Database Performance] --> C1[Query Execution Time]
        D[Memory Usage] --> D1[Resource Consumption]
    end
    
    subgraph "Health Monitoring"
        E[Service Health] --> E1[LM Studio Connection]
        E --> E2[Database Connection]
        E --> E3[API Endpoint Status]
    end
    
    subgraph "Error Tracking"
        F[Application Errors] --> F1[Error Rates]
        F --> F2[Exception Details]
        F --> F3[Performance Issues]
    end
    
    subgraph "User Analytics"
        G[Usage Patterns] --> G1[Feature Adoption]
        G --> G2[User Engagement]
        G --> G3[AI Interaction Stats]
    end
```

### Performance Optimization

#### Database Optimization
```sql
-- Recommended indexes for performance
CREATE INDEX idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX idx_entries_topic ON entries(topic_id);
CREATE INDEX idx_entries_tags ON entry_tags(entry_id, tag_id);
CREATE INDEX idx_users_email ON users(email);

-- Full-text search index
CREATE INDEX idx_entries_content_fts ON entries USING gin(to_tsvector('english', content));
```

#### Caching Strategy
```python
from functools import lru_cache
import asyncio

# Cache AI model instances
@lru_cache(maxsize=10)
def get_cached_ai_instance(model: str, temperature: float):
    return get_chatopen_ai_instance(model, temperature)

# Cache database schema
@lru_cache(maxsize=1)
async def get_cached_db_schema():
    # Cache schema for 5 minutes
    return await get_database_schema()
```

## 🚀 Deployment Guide

### 🐳 Docker Production Setup

```mermaid
graph TD
    subgraph "Production Architecture"
        A[Nginx Load Balancer] --> B[FastAPI Containers]
        A --> C[Next.js Container]
        
        B --> D[PostgreSQL Master]
        B --> E[PostgreSQL Read Replica]
        B --> F[Redis Cache]
        
        G[LM Studio Server] --> B
        H[File Storage Volume] --> B
        I[Backup Service] --> D
    end
    
    subgraph "Scaling Configuration"
        J[Auto Scaling] --> K[Container Orchestration]
        L[Load Balancing] --> M[Health Checks]
        N[Resource Monitoring] --> O[Alert System]
    end
    
    style A fill:#ff6b35
    style D fill:#316192
    style G fill:#1C3C3C,color:#ffffff
```

#### Production Docker Compose
```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

  backend:
    build: 
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/tcc_log
      - LM_STUDIO_BASE_URL=http://lm-studio:1234/v1
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    environment:
      - NEXT_PUBLIC_API_URL=https://your-domain.com/api

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=tcc_log
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 🌐 Environment-specific Configuration

#### Development (.env.development)
```env
# Development settings
DEBUG=true
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/tcc_log_dev
LM_STUDIO_BASE_URL=http://localhost:1234/v1
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Settings
DEFAULT_AI_MODEL=llama-3.1-8b-instruct
DEFAULT_TEMPERATURE=0.7
MAX_INFERENCE_TIME=60000

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads
```

#### Production (.env.production)
```env
# Production settings
DEBUG=false
DATABASE_URL=postgresql://prod_user:secure_password@postgres:5432/tcc_log
LM_STUDIO_BASE_URL=http://lm-studio:1234/v1
CORS_ORIGINS=https://your-domain.com

# Security
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Performance
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
REDIS_URL=redis://redis:6379/0

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

### 🔧 LM Studio Configuration

```mermaid
graph TD
    A[Download LM Studio] --> B[Install Application]
    B --> C[Download AI Models]
    C --> D[Available Models]
    D --> D1[Llama Models]
    D --> D2[Mistral Models] 
    D --> D3[CodeLlama Models]
    D --> D4[Qwen Models]
    
    E[Start Local Server] --> F[Select Model]
    F --> G[Configure Settings]
    G --> H[Start Server on Port 1234]
    
    H --> I[API Endpoint: http://localhost:1234/v1]
    I --> J[Configure in .env file]
```

#### Recommended Models (HIỆN TẠI ĐANG SỬ DỤNG):
- **deepseek-r1-distill-qwen-1.5b** (Docker environment default)
- **qwen/qwen3-1.7b** (Development default)  
- **llama-3.1-8b-instruct** (Alternative option)
- **phi-3-mini-instruct** (Lightweight option)

3. **Load Model** trong LM Studio interface
4. **Start Server** trên port 1234
5. **Verify** connection tại http://localhost:1234/v1/models

### 🔄 Development Workflow (THỰC TẾ)

```mermaid
sequenceDiagram
    participant Dev as "Developer"
    participant Docker as "Docker Compose"
    participant Backend as "FastAPI :8000"
    participant Frontend as "Next.js :3000"
    participant LM as "LM Studio :1234"
    participant DB as "PostgreSQL :5432"
    
    Dev->>Docker: "docker-compose up --build"
    Docker->>DB: "Start PostgreSQL container"
    Docker->>Backend: "Start FastAPI container"
    Docker->>Frontend: "Start Next.js container"
    
    Backend->>DB: "Run migrations & seed data"
    Frontend->>Backend: "API calls to :8000"
    Backend->>LM: "AI requests to host.docker.internal:1234"
    
    Note over Dev: "Access at http://localhost:3000"
```

**Actual Ports:**
- Frontend: http://localhost:3000 ✅
- Backend API: http://localhost:8000 ✅
- API Docs: http://localhost:8000/docs ✅
- LM Studio: http://localhost:1234 (external) ✅
- PostgreSQL: localhost:5432 (internal) ✅
   - **Llama 3.1 8B** - Balanced performance và quality
   - **Mistral 7B** - Fast inference với good accuracy
   - **CodeLlama 7B** - Specialized cho coding tasks
   - **Qwen 2.5 7B** - Excellent cho multilingual tasks

3. **Start Local Server:**
   ```
   - Mở LM Studio application
   - Chọn model từ library và click "Load Model"
   - Navigate đến "Local Server" tab
   - Click "Start Server" (default: port 1234)
   - Verify server status: http://localhost:1234/v1/models
   ```

4. **Configure Environment Variables:**
   ```env
   # LM Studio Configuration
   LM_STUDIO_BASE_URL=http://localhost:1234/v1
   LM_STUDIO_API_KEY=lm-studio  # hoặc custom key
   DEFAULT_AI_MODEL=your-model-identifier
   DEFAULT_TEMPERATURE=0.7
   DEFAULT_MAX_TOKENS=2000
   MAX_INFERENCE_TIME=60000  # 60 seconds
   ```

## � Contributing & Development

### 🔄 Development Workflow

```mermaid
gitGraph
    commit id: "Initial Setup"
    branch feature/ai-enhancement
    checkout feature/ai-enhancement
    commit id: "Add streaming"
    commit id: "Add SQL tools"
    commit id: "Add tests"
    checkout main
    merge feature/ai-enhancement
    commit id: "Release v1.1"
    branch feature/ui-improvements
    checkout feature/ui-improvements
    commit id: "New components"
    commit id: "Mobile responsive"
    checkout main
    merge feature/ui-improvements
    commit id: "Release v1.2"
```

### Development Guidelines

1. **Fork Repository** và create feature branch từ `main`
2. **Follow Coding Standards** (Black formatting, type hints, docstrings)
3. **Write Comprehensive Tests** cho new features và bug fixes
4. **Update Documentation** nếu có API changes hoặc new features
5. **Submit Pull Request** với clear description và test evidence

### Code Quality Standards

```bash
# Format code với Black
black app/ tests/ --line-length 88

# Sort imports với isort
isort app/ tests/ --profile black

# Type checking với mypy
mypy app/ --ignore-missing-imports

# Linting với flake8
flake8 app/ tests/ --max-line-length 88 --extend-ignore E203,W503

# Run all quality checks
./scripts/quality_check.sh
```

### Commit Message Convention
```
type(scope): description

feat(ai): add real-time streaming chat
fix(database): resolve connection timeout issue
docs(readme): update installation guide
test(api): add comprehensive endpoint tests
refactor(sql): optimize query performance
perf(streaming): improve token throughput
```

## 📚 Documentation & Resources

### 📖 Additional Documentation

```mermaid
graph TD
    A[Documentation Hub] --> B[API Documentation]
    A --> C[Architecture Guides]
    A --> D[Deployment Guides]
    A --> E[Development Guides]
    
    B --> B1[OpenAPI/Swagger Docs]
    B --> B2[Endpoint Reference]
    B --> B3[Request/Response Examples]
    
    C --> C1[System Architecture]
    C --> C2[Database Schema]
    C --> C3[AI Integration Guide]
    
    D --> D1[Docker Setup]
    D --> D2[Production Deployment]
    D --> D3[Monitoring Setup]
    
    E --> E1[Local Development]
    E --> E2[Testing Guide]
    E --> E3[Contributing Guidelines]
```

#### Core Documentation Files:
- **[API Documentation](http://localhost:8000/docs)** - Interactive Swagger UI
- **[Agent Documentation](./docs/AGENT_DOCUMENTATION.md)** - LangChain Agent deep dive
- **[LM Studio Documentation](./docs/LM_STUDIO_DOCUMENTATION.md)** - AI backend architecture
- **[Database Schema](./docs/database-schema.md)** - Complete database design
- **[Frontend Components Guide](./frontend/README.md)** - React component library
- **[Deployment Guide](./docs/deployment-guide.md)** - Production deployment steps

### 🎓 Learning Resources

#### For Developers New to the Stack:
- **FastAPI Tutorial**: https://fastapi.tiangolo.com/tutorial/
- **Next.js Learning**: https://nextjs.org/learn
- **LangChain Documentation**: https://docs.langchain.com/
- **LM Studio Guides**: https://lmstudio.ai/docs

#### AI/ML Integration:
- **Streaming Best Practices**: [./docs/ai-streaming-guide.md](./docs/ai-streaming-guide.md)
- **Prompt Engineering**: [./docs/prompt-engineering.md](./docs/prompt-engineering.md)
- **SQL Tool Development**: [./docs/sql-tools-guide.md](./docs/sql-tools-guide.md)

## 🚀 Roadmap & Future Features

### 🎯 Planned Enhancements

```mermaid
gantt
    title TCC Log Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 - Core Features
    Basic AI Chat           :done, phase1a, 2024-01-01, 2024-02-15
    Streaming Integration   :done, phase1b, 2024-02-01, 2024-03-01
    SQL Tools              :done, phase1c, 2024-02-15, 2024-03-15
    
    section Phase 2 - Enhanced AI
    Advanced Analysis      :active, phase2a, 2024-03-01, 2024-04-15
    Writing Enhancement    :active, phase2b, 2024-03-15, 2024-04-30
    Multi-model Support    :phase2c, 2024-04-01, 2024-05-15
    
    section Phase 3 - Advanced Features
    Vector Database        :phase3a, 2024-05-01, 2024-06-15
    RAG Integration        :phase3b, 2024-05-15, 2024-07-01
    Image Analysis         :phase3c, 2024-06-01, 2024-07-15
    
    section Phase 4 - Platform Features
    Mobile Apps            :phase4a, 2024-07-01, 2024-09-01
    API Marketplace        :phase4b, 2024-08-01, 2024-10-01
    Enterprise Features    :phase4c, 2024-09-01, 2024-11-01
```

### 🌟 Upcoming Features

#### Short-term (Next 3 months):
- **Vector Database Integration** cho semantic search
- **Advanced RAG (Retrieval-Augmented Generation)** cho context-aware responses
- **Multi-model Support** với model switching capabilities
- **Enhanced Analytics Dashboard** với detailed usage metrics
- **Mobile-responsive UI** improvements

#### Medium-term (3-6 months):
- **Image Analysis** với vision models integration
- **Code Generation Assistant** specialized cho programming tasks
- **Advanced Collaboration** features với shared workspaces
- **API Rate Limiting** và usage analytics
- **Plugin System** cho third-party integrations

#### Long-term (6+ months):
- **Mobile Applications** (iOS/Android)
- **Desktop Applications** (Electron)
- **Enterprise SSO** integration
- **Advanced Security** features
- **AI Model Training** capabilities

## 📞 Support & Community

### 🆘 Getting Help

```mermaid
graph TD
    A[Need Help?] --> B["Type of Issue"]
    
    B -->|Bug Report| C[GitHub Issues]
    B -->|Feature Request| D[GitHub Discussions]
    B -->|General Question| E[Community Forum]
    B -->|Security Issue| F[Security Email]
    
    C --> G[Provide Reproduction Steps]
    D --> H[Describe Use Case]
    E --> I[Search Existing Answers]
    F --> J[security@tcclog.com]
    
    G --> K[Maintainer Response]
    H --> L[Community Feedback]
    I --> M[Get Community Help]
    J --> N[Security Team Review]
```

### Contact Information:
- **📧 General Support**: support@tcclog.com
- **🔒 Security Issues**: security@tcclog.com
- **💬 GitHub Discussions**: [Project Discussions](https://github.com/your-username/tcc-log/discussions)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-username/tcc-log/issues)
- **📖 Documentation**: [Wiki Pages](https://github.com/your-username/tcc-log/wiki)

### Community Guidelines:
- **Be Respectful**: Treat all community members with respect
- **Search First**: Check existing issues và discussions before posting
- **Provide Context**: Include relevant details when asking questions
- **Follow Templates**: Use provided issue và PR templates
- **Contribute Back**: Help others when you can

## 📄 License & Acknowledgments

### 📜 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 TCC Log Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

### 🙏 Acknowledgments & Credits

```mermaid
graph LR
    subgraph "Core Technologies"
        A[FastAPI Team] --> A1[Excellent Web Framework]
        B[LangChain Community] --> B1[AI Integration Tools]
        C[Next.js Team] --> C1[Modern React Framework]
        D[PostgreSQL Team] --> D1[Reliable Database]
    end
    
    subgraph "AI/ML Ecosystem"
        E[LM Studio] --> E1[Local AI Serving]
        F[OpenAI] --> F1[API Standards]
        G[Hugging Face] --> G1[Model Repository]
        H[Python Community] --> H1[Rich Ecosystem]
    end
    
    subgraph "Development Tools"
        I[Docker] --> I1[Containerization]
        J[GitHub] --> J1[Version Control & CI/CD]
        K[VS Code] --> K1[Development Environment]
        L[Open Source Community] --> L1[Inspiration & Support]
    end
```

#### Special Thanks:
- **FastAPI & Starlette** teams cho excellent async web framework
- **LangChain** community cho comprehensive AI integration tools
- **Next.js & Vercel** team cho modern React development experience
- **PostgreSQL** team cho robust và reliable database system
- **LM Studio** cho making local AI accessible và user-friendly
- **Python & JavaScript** communities cho rich ecosystems
- **Open Source Contributors** worldwide cho inspiration và collaboration

---

<div align="center">

**Made with ❤️ by TCC Log Team**

*Transforming learning through intelligent technology*

[![GitHub Stars](https://img.shields.io/github/stars/your-username/tcc-log?style=social)](https://github.com/your-username/tcc-log)
[![GitHub Forks](https://img.shields.io/github/forks/your-username/tcc-log?style=social)](https://github.com/your-username/tcc-log)
[![GitHub Issues](https://img.shields.io/github/issues/your-username/tcc-log)](https://github.com/your-username/tcc-log/issues)
[![GitHub License](https://img.shields.io/github/license/your-username/tcc-log)](https://github.com/your-username/tcc-log/blob/main/LICENSE)

[🚀 Get Started](#-cài-đặt-và-triển-khai) • [📖 Documentation](#-documentation--resources) • [� Community](#-support--community) • [🤝 Contribute](#-contributing--development)

</div>

```mermaid
graph TD
    A[tcc_log/] --> B[📁 app/ - Backend FastAPI]
    A --> C[📁 frontend/ - Next.js UI]
    A --> D[📁 docs/ - Documentation]
    A --> E[📁 scripts/ - Utility Scripts]
    A --> F[📁 tests/ - Test Suite]
    A --> G[📁 docker/ - Container Config]
    
    B --> B1[📁 api/ - REST Endpoints]
    B --> B2[📁 ai/ - AI Integration]
    B --> B3[main.py - FastAPI App]
    B --> B4[models.py - Database Models]
    B --> B5[schemas.py - Pydantic Schemas]
    
    B1 --> B11[auth.py - Authentication]
    B1 --> B12[users.py - User Management]
    B1 --> B13[entries.py - Journal Entries]
    B1 --> B14[ai.py - AI Endpoints]
    
    B2 --> B21[agent.py - LangChain Agent]
    B2 --> B22[lm_studio.py - AI Backend]
    B2 --> B23[sql_tool.py - Database Tools]
    B2 --> B24[prompt_manager.py - Prompt Templates]
    
    C --> C1[📁 app/ - App Router Pages]
    C --> C2[📁 components/ - React Components]
    C --> C3[📁 lib/ - Utility Libraries]
    C --> C4[📁 types/ - TypeScript Types]
    
    C1 --> C11[ai/ - AI Chat Interface]
    C1 --> C12[entries/ - Journal Management]
    C1 --> C13[auth/ - Login/Register]
    
    C2 --> C21[AI/ - AI Components]
    C2 --> C22[Navigation/ - Nav Components]
    C2 --> C23[MarkdownEditor.tsx - Rich Editor]
```

### Backend Structure (`/app`)
```
app/
├── 📄 main.py              # FastAPI application entry point
├── 📄 database.py          # Database configuration & connection
├── 📄 models.py            # SQLAlchemy database models
├── 📄 schemas.py           # Pydantic validation schemas
├── 📄 crud.py              # Database CRUD operations
├── 📄 seed_data.py         # Initial data seeding
├── 📁 api/                 # REST API endpoints
│   ├── 📄 auth.py          # Authentication & authorization
│   ├── 📄 users.py         # User management endpoints
│   ├── 📄 topics.py        # Topic management
│   ├── 📄 entries.py       # Journal entry CRUD
│   ├── 📄 files.py         # File upload/download
│   ├── 📄 tags.py          # Tag management
│   ├── 📄 gallery.py       # Gallery management
│   └── 📄 ai.py            # AI integration endpoints
└── 📁 ai/                  # AI engine modules
    ├── 📄 agent.py         # LangChain Agent implementation
    ├── 📄 lm_studio.py     # LM Studio integration & streaming
    ├── 📄 sql_tool.py      # Database query tools
    ├── � prompt_manager.py # Dynamic prompt management
    └── 📄 prompts.json     # Prompt templates storage
```

### Frontend Structure (`/frontend`)
```
frontend/
├── 📁 app/                 # Next.js 15 App Router
│   ├── 📄 layout.tsx       # Root layout component
│   ├── 📄 page.tsx         # Home page
│   ├── 📄 providers.tsx    # Context providers
│   ├── 📁 ai/             # AI chat interface
│   ├── 📁 entries/        # Journal entry management
│   ├── 📁 topics/         # Topic management
│   ├── 📁 auth/           # Authentication pages
│   └── 📁 profile/        # User profile management
├── 📁 components/         # Reusable React components
│   ├── 📄 Header.tsx      # Navigation header
│   ├── 📄 MarkdownEditor.tsx # Rich text editor
│   ├── 📄 EmojiPicker.tsx # Emoji selection
│   ├── 📁 AI/             # AI-specific components
│   └── 📁 Navigation/     # Navigation components
├── 📁 lib/                # Utility libraries
│   ├── 📄 ai-utils.ts     # AI integration utilities
│   ├── � api.ts          # API client configuration
│   └── 📄 auth.ts         # Authentication utilities
├── 📁 types/              # TypeScript type definitions
│   ├── 📄 api.ts          # API response types
│   ├── 📄 auth.ts         # Authentication types
│   └── 📄 ai.ts           # AI-related types
└── 📁 public/             # Static assets
    ├── 📄 favicon.ico
    └── 📁 images/
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