# AI Chatbot - Tài liệu Toàn diện

## 📋 Tổng quan

Tài liệu này tổng hợp tất cả thông tin về chức năng AI Chatbot trong TCC Log - AI-Powered Learning Journal, bao gồm kiến trúc kỹ thuật, luồng hoạt động, phân tích nghiệp vụ và deployment thực tế.

---

## 🏗️ KIẾN TRÚC & DEPLOY

### 1. Cấu trúc Deploy Docker (Thực tế)

```mermaid
graph TB
    subgraph "Docker Environment"
        subgraph "Frontend Container"
            NextJS["Next.js App :3000"]
            StaticFiles["Static Files"]
        end
        
        subgraph "Backend Container"
            FastAPI["FastAPI Server :8000"]
            APIRouters["API Routers"]
            Uploads["Uploads Volume"]
        end
        
        subgraph "Database Container"
            PostgreSQL["PostgreSQL :5432"]
            PGData["Data Volume"]
        end
        
        subgraph "External AI Services"
            LMStudio["LM Studio Server<br/>host.docker.internal:1234"]
            OpenAI["OpenAI API"]
        end
    end
    
    subgraph "Host Machine"
        LocalLM["LM Studio Local"]
        User["User Browser"]
    end
    
    User --> NextJS
    NextJS --> FastAPI
    FastAPI --> PostgreSQL
    FastAPI --> LMStudio
    FastAPI --> OpenAI
    LMStudio --> LocalLM
    
    FastAPI --> Uploads
    PostgreSQL --> PGData
```

### 2. Kiến trúc Hệ thống Tổng thể

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI["React UI Components"]
        Chat["Chat Interface"]
        Stream["Streaming Handler"]
    end
    
    subgraph "API Gateway"
        FastAPIServer["FastAPI Server"]
        Auth["Authentication"]
        Router["API Router"]
    end
    
    subgraph "AI Service Layer"
        Agent["AI Agent Controller"]
        LM["LM Studio Client"]
        OpenAIClient["OpenAI Client"]
        Tools["SQL Tools"]
    end
    
    subgraph "Data Layer"
        DB["PostgreSQL"]
        Files["File Storage Volume"]
    end
    
    UI --> Chat
    Chat --> Stream
    Stream --> FastAPIServer
    FastAPIServer --> Auth
    Auth --> Router
    Router --> Agent
    Agent --> LM
    Agent --> OpenAIClient
    Agent --> Tools
    Tools --> DB
    LM --> LMStudio
    OpenAIClient --> OpenAI
```

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. Luồng Request-Response Chi tiết

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Frontend as 🖥️ Next.js Frontend
    participant Backend as ⚙️ FastAPI Backend
    participant Auth as 🔐 Auth Service
    participant AI as 🤖 AI Router
    participant LM as 🧠 LM Studio
    participant OpenAI as 🌐 OpenAI API
    participant DB as 🗄️ PostgreSQL
    
    User->>Frontend: Open /ai page
    Frontend->>Auth: Check user authentication
    Auth-->>Frontend: User validated
    
    Frontend->>Backend: GET /ai/models
    Backend->>LM: Check available models
    LM-->>Backend: Return model list
    Backend-->>Frontend: Model options
    
    User->>Frontend: Send chat message
    Frontend->>Backend: POST /ai/chat-stream
    Backend->>Auth: Verify token
    Auth-->>Backend: Token valid
    
    Backend->>AI: Route to AI handler
    
    alt Use Agent Mode
        AI->>LM: Initialize LangChain Agent
        LM->>LM: Create tools (SQL, etc.)
        LM->>LM: Process with tools
    else Simple Chat Mode
        AI->>LM: Direct chat request
    end
    
    LM-->>AI: Stream response chunks
    AI-->>Backend: Forward chunks
    Backend-->>Frontend: SSE stream
    Frontend-->>User: Real-time display
    
    Backend->>DB: Save conversation history
    DB-->>Backend: Confirm saved
```

### 2. AI Service Flow Chi tiết

```mermaid
flowchart TD
    Start(["User sends message"]) --> Auth{Authentication?}
    Auth -->|Invalid| AuthError["Return 401 Error"]
    Auth -->|Valid| ValidateInput["Validate Input"]
    
    ValidateInput --> SelectMode{Select AI Mode}
    
    SelectMode -->|Simple Chat| SimpleFlow["Simple Chat Flow"]
    SelectMode -->|Agent Mode| AgentFlow["Agent Flow"]
    
    subgraph "Simple Chat Flow"
        SimpleFlow --> CreateRequest["Create AI Request"]
        CreateRequest --> SendToLM["Send to LM Studio"]
        SendToLM --> StreamResponse["Stream Response"]
    end
    
    subgraph "Agent Flow"
        AgentFlow --> InitAgent["Initialize LangChain Agent"]
        InitAgent --> LoadTools["Load SQL Tools"]
        LoadTools --> ProcessAgent["Process with Agent"]
        ProcessAgent --> AgentStream["Stream Agent Response"]
    end
    
    StreamResponse --> SaveHistory["Save to Database"]
    AgentStream --> SaveHistory
    SaveHistory --> End(["Complete"])
    
    subgraph "Error Handling"
        SendToLM -->|Error| ErrorFallback["Fallback to OpenAI"]
        ErrorFallback --> StreamResponse
        ProcessAgent -->|Error| ErrorLog["Log Error & Return"]
    end
```

### 3. Streaming Response Flow

```mermaid
sequenceDiagram
    participant Frontend as 🖥️ Frontend React
    participant Backend as ⚙️ FastAPI Backend
    participant AI as 🤖 AI Router
    participant LM as 🧠 LM Studio
    participant DB as 🗄️ PostgreSQL
    
    Note over Frontend: User clicks send message
    Frontend->>Backend: POST /ai/chat-stream
    Note over Frontend: EventSource connection established
    
    Backend->>AI: Route to AI handler
    AI->>AI: Validate input & auth
    
    alt Agent Mode Selected
        AI->>LM: Initialize LangChain Agent
        LM->>LM: Load SQL tools
        LM->>DB: Query data if needed
        LM->>AI: Process with tools
    else Simple Chat Mode
        AI->>LM: Direct chat request
    end
    
    loop Streaming Response
        LM-->>AI: Chunk of response
        AI-->>Backend: Format as SSE
        Backend-->>Frontend: data: {"content": "chunk"}
        Frontend->>Frontend: Append to UI
    end
    
    LM-->>AI: [DONE] signal
    AI->>DB: Save conversation history
    AI-->>Backend: Close stream
    Backend-->>Frontend: Close SSE connection
```

### 4. Frontend Chat Interface States

```mermaid
stateDiagram-v2
    [*] --> CheckAuth
    CheckAuth --> LoadModels: Authenticated
    CheckAuth --> Redirect: Not Authenticated
    
    LoadModels --> Ready: Models Loaded
    LoadModels --> Error: Load Failed
    
    Ready --> Typing: User Types
    Typing --> Ready: Message Empty
    Typing --> Sending: Send Message
    
    Sending --> Streaming: Response Started
    Streaming --> Streaming: Receiving Chunks
    Streaming --> Ready: Stream Complete
    
    Streaming --> Stopped: User Stops
    Stopped --> Ready: Reset
    
    Error --> Retry: User Retry
    Retry --> LoadModels
    
    state Streaming {
        [*] --> ReceiveChunk
        ReceiveChunk --> UpdateUI
        UpdateUI --> ReceiveChunk
        UpdateUI --> [*]: Stream End
    }
```

### 5. Frontend Chat Interface Features (Updated)

```mermaid
stateDiagram-v2
    [*] --> CheckAuth
    CheckAuth --> LoadModels: Authenticated
    CheckAuth --> Redirect: Not Authenticated
    
    LoadModels --> Ready: Models Loaded
    LoadModels --> Error: Load Failed
    
    Ready --> SelectMode: Choose AI Mode
    SelectMode --> SelectModel: Choose Model
    SelectModel --> Typing: User Types
    
    Typing --> Ready: Message Empty
    Typing --> Sending: Send Message
    
    Sending --> Streaming: Response Started
    Streaming --> Streaming: Receiving Chunks
    Streaming --> Ready: Stream Complete
    
    Streaming --> Stopped: User Stops
    Stopped --> Ready: Reset
    
    Error --> Retry: User Retry
    Retry --> LoadModels
    
    state SelectMode {
        Ask --> Simple_Chat
        Agent --> Advanced_Chat
    }
    
    state Streaming {
        [*] --> ReceiveChunk
        ReceiveChunk --> UpdateUI
        UpdateUI --> ReceiveChunk
        UpdateUI --> [*]: Stream End
    }
```

### 6. User Experience & Accessibility Features

```mermaid
graph TB
    subgraph "Accessibility Features"
        A1["ARIA Labels for Select Elements"]
        A2["Keyboard Navigation Support"]
        A3["Screen Reader Compatibility"]
        A4["Focus Management"]
        A5["High Contrast Support"]
    end
    
    subgraph "User Interface"
        UI1["Real-time Typing Indicators"]
        UI2["Message Timestamps"]
        UI3["Character/Word Counter"]
        UI4["Auto-resizing Text Area"]
        UI5["Stop Generation Button"]
    end
    
    subgraph "Chat Features"
        CF1["Ask Mode - Simple Questions"]
        CF2["Agent Mode - Complex Queries"]
        CF3["Model Selection"]
        CF4["Stream Response Display"]
        CF5["Think/Answer Separation"]
    end
    
    subgraph "Error Handling"
        EH1["Connection Timeout Handling"]
        EH2["Fallback Error Messages"]
        EH3["Graceful Degradation"]
        EH4["User-Friendly Error Display"]
    end
    
    A1 --> UI1
    UI1 --> CF1
    CF1 --> EH1
    
    A2 --> UI2
    UI2 --> CF2
    CF2 --> EH2
    
    A3 --> UI3
    UI3 --> CF3
    CF3 --> EH3
    
    A4 --> UI4
    UI4 --> CF4
    CF4 --> EH4
    
    A5 --> UI5
    UI5 --> CF5
```

---

## 🚀 CẢI TIẾN ACCESSIBILITY & UX

### 1. Accessibility Improvements

#### A. Select Elements với ARIA Support
```typescript
// Mode Selection với accessibility labels
<select
  value={useAgent ? "agent" : "ask"}
  onChange={(e) => setUseAgent(e.target.value === "agent")}
  aria-label="Select AI mode"
  title="Choose between Ask mode for simple questions or Agent mode for complex queries"
  className="..."
>
  <option value="ask">Ask</option>
  <option value="agent">Agent</option>
</select>

// Model Selection với accessibility labels  
<select
  value={selectedModel}
  onChange={(e) => setSelectedModel(e.target.value)}
  aria-label="Select AI model"
  title="Choose which AI model to use for responses"
  className="..."
>
  {models.map((model, index) => (
    <option key={index} value={model}>
      {model.split('/').pop()}
    </option>
  ))}
</select>
```

#### B. Button Accessibility
```typescript
// Send Message Button với ARIA labels
<button
  onClick={handleSendMessage}
  disabled={!input.trim() || isTyping}
  aria-label="Send message"
  title="Send your message to the AI"
  className="..."
>
  <PaperAirplaneIcon className="h-5 w-5" />
</button>

// Stop Generation Button với ARIA labels
<button
  onClick={handleStopCompletion}
  title="Stop generating"
  aria-label="Stop generating"
  className="..."
>
  <StopIcon className="h-5 w-5" />
</button>
```

#### C. Animation với CSS Classes thay vì Inline Styles
```typescript
// Typing indicator với Tailwind CSS animation delays
<div className="flex items-center space-x-1">
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
</div>
```

### 2. User Experience Enhancements

```mermaid
graph TB
    subgraph "UX Improvements"
        UX1["Auto-resize Textarea"]
        UX2["Character/Word Counter"]
        UX3["Real-time Stream Display"]
        UX4["Stop Generation Control"]
        UX5["Keyboard Shortcuts"]
    end
    
    subgraph "Visual Feedback"
        VF1["Typing Indicators"]
        VF2["Loading States"]
        VF3["Error Messages"]
        VF4["Success Confirmations"]
    end
    
    subgraph "Responsive Design"
        RD1["Mobile Optimized"]
        RD2["Dark Mode Support"]
        RD3["High Contrast Mode"]
        RD4["Scalable Typography"]
    end
    
    UX1 --> VF1
    UX2 --> VF2
    UX3 --> VF3
    UX4 --> VF4
    UX5 --> RD1
    
    VF1 --> RD2
    VF2 --> RD3
    VF3 --> RD4
```

---

## 🛠️ API ENDPOINTS

### Cấu trúc API Endpoints

```mermaid
graph TB
    subgraph "FastAPI Main App"
        Root["Root / - Welcome"]
        Docs["API Documentation /docs"]
        Health["Health Check /health"]
        Debug["Debug Routes /debug/routes"]
    end
    
    subgraph "Authentication"
        Login["User Login /login"]
        Register["User Registration /register"]
        Token["Token Management /token"]
    end
    
    subgraph "AI Endpoints"
        Status["AI Service Status /ai/status"]
        Models["Available Models /ai/models"]
        Chat["Simple Chat /ai/chat"]
        Stream["Streaming Chat /ai/chat-stream"]
        Agent["Agent Chat /ai/agent-stream"]
        Analyze["Entry Analysis /ai/analyze-entry"]
        Prompts["Generate Prompts /ai/prompts"]
        Improve["Writing Help /ai/improve-writing"]
    end
    
    subgraph "Data Management"
        Users["User Management /users"]
        Topics["Topics CRUD /topics"]
        Entries["Journal Entries /entries"]
        Files["File Upload /files"]
        Gallery["Media Gallery /gallery"]
        Tags["Tag Management /tags"]
        Links["Link Management /links"]
    end
    
    subgraph "Static Assets"
        Uploads["File Serving /uploads"]
    end
```

---

## 📊 PHÂN TÍCH NGHIỆP VỤ

### 1. Business Model Canvas

```mermaid
graph TB
    subgraph "Value Proposition"
        VP1["Intelligent Learning Assistant"]
        VP2["24/7 Learning Support"]
        VP3["Personalized Study Experience"]
        VP4["Context-Aware Responses"]
    end
    
    subgraph "Customer Segments"
        CS1["Students & Learners"]
        CS2["Professionals"]
        CS3["Researchers"]
        CS4["Educational Institutions"]
    end
    
    subgraph "Key Activities"
        KA1["AI Model Training"]
        KA2["Content Processing"]
        KA3["User Experience Optimization"]
        KA4["Performance Monitoring"]
    end
    
    subgraph "Revenue Streams"
        RS1["Subscription Plans"]
        RS2["Premium AI Features"]
        RS3["Enterprise Licenses"]
        RS4["API Access"]
    end
    
    VP1 --> CS1
    VP2 --> CS2
    VP3 --> CS3
    VP4 --> CS4
    KA1 --> VP1
    KA2 --> VP2
    KA3 --> VP3
    KA4 --> VP4
    CS1 --> RS1
    CS2 --> RS2
    CS3 --> RS3
    CS4 --> RS4
```

### 2. User Journey Mapping

```mermaid
journey
    title Student Learning Journey with AI Chatbot
    section Discovery
      Visit TCC Log: 3: Student
      Explore AI Features: 4: Student
      Create Account: 3: Student
    section Onboarding
      First Chat Interaction: 4: Student
      Learn AI Commands: 5: Student
      Setup Preferences: 4: Student
    section Daily Usage
      Ask Study Questions: 5: Student
      Get Explanations: 5: Student, AI
      Solve Problems: 5: Student, AI
      Review Progress: 4: Student
    section Advanced Features
      Use Agent Mode: 5: Student, AI
      Analyze Journal Entries: 5: Student, AI
      Generate Study Plans: 5: Student, AI
    section Retention
      Share with Friends: 4: Student
      Upgrade to Premium: 3: Student
      Long-term Learning: 5: Student, AI
```

### 3. Use Cases & Scenarios

```mermaid
graph TD
    User["👤 User"] --> UC1["Study Assistant"]
    User --> UC2["Research Helper"]
    User --> UC3["Writing Improvement"]
    User --> UC4["Journal Analysis"]
    
    UC1 --> UC1A["Homework Help"]
    UC1 --> UC1B["Concept Explanation"]
    UC1 --> UC1C["Practice Problems"]
    
    UC2 --> UC2A["Topic Research"]
    UC2 --> UC2B["Source Validation"]
    UC2 --> UC2C["Literature Review"]
    
    UC3 --> UC3A["Grammar Check"]
    UC3 --> UC3B["Style Improvement"]
    UC3 --> UC3C["Content Enhancement"]
    
    UC4 --> UC4A["Mood Analysis"]
    UC4 --> UC4B["Learning Insights"]
    UC4 --> UC4C["Progress Tracking"]
```

---

## 🔧 CẤU HÌNH THỰC TẾ

### Environment Variables (Backend)
```bash
DATABASE_URL=postgresql+psycopg2://postgres:password@db:5432/postgres
SECRET_KEY=hZKxcKs2I92_s90ZVQNw4MF3BI1qKFFI-2PwhK8OlRM
ACCESS_TOKEN_EXPIRE_MINUTES=60
RUN_MIGRATIONS=true
SEED_DATA=true
ADDITIONAL_CORS_ORIGINS=http://frontend:3000,http://localhost:3000
LM_STUDIO_BASE_URL=http://host.docker.internal:1234/v1
LM_STUDIO_MODEL=deepseek-r1-distill-qwen-1.5b
```

### Environment Variables (Frontend)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_SERVER_API_URL=http://backend:8000
```

### Docker Services Configuration
1. **Database**: PostgreSQL 14 với persistent volume
2. **Backend**: FastAPI với auto-migration và seed data
3. **Frontend**: Next.js với static file serving
4. **AI Service**: LM Studio external service qua host.docker.internal

---

## ⚡ TỐI ƯU HÓA & ERROR HANDLING

### 1. Error Handling và Fallback Flow

```mermaid
flowchart TD
    Request["User Request"] --> LMStudio{LM Studio Available?}
    
    LMStudio -->|Yes| ProcessLM["Process with LM Studio"]
    LMStudio -->|No| TryOpenAI["Try OpenAI API"]
    
    ProcessLM --> LMError{LM Studio Error?}
    LMError -->|No| Success["Successful Response"]
    LMError -->|Yes| TryOpenAI
    
    TryOpenAI --> OpenAICheck{OpenAI Available?}
    OpenAICheck -->|Yes| ProcessOpenAI["Process with OpenAI"]
    OpenAICheck -->|No| ErrorResponse["Return Error Response"]
    
    ProcessOpenAI --> OpenAIError{OpenAI Error?}
    OpenAIError -->|No| Success
    OpenAIError -->|Yes| ErrorResponse
    
    Success --> SaveDB["Save to Database"]
    SaveDB --> End["Complete"]
    
    ErrorResponse --> LogError["Log Error"]
    LogError --> FallbackMessage["Return Fallback Message"]
    FallbackMessage --> End
```

### 2. Performance Optimization
```python
# CORS Configuration
app.add_middleware(RequestLoggingMiddleware)  # Custom logging
app.add_middleware(CORSMiddleware, ...)       # CORS handling

# Streaming Implementation
async def stream_generator():
    for chunk in ai_response:
        yield f"data: {json.dumps(chunk)}\n\n"

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})
```

---

## 📈 KPIs & METRICS

### Key Performance Indicators

```mermaid
graph TB
    subgraph "User Engagement"
        UE1["Daily Active Users"]
        UE2["Messages per Session"]
        UE3["Session Duration"]
        UE4["User Retention Rate"]
    end
    
    subgraph "AI Performance"
        AP1["Response Time"]
        AP2["Response Accuracy"]
        AP3["Error Rate"]
        AP4["Model Availability"]
    end
    
    subgraph "Business Metrics"
        BM1["Conversion Rate"]
        BM2["Revenue per User"]
        BM3["Customer Satisfaction"]
        BM4["Support Ticket Reduction"]
    end
    
    subgraph "Technical Metrics"
        TM1["API Response Time"]
        TM2["System Uptime"]
        TM3["Database Performance"]
        TM4["Infrastructure Cost"]
    end
```

---

## 🔍 SO SÁNH & CẢI TIẾN

### Điểm Khác biệt với Tài liệu Cũ

#### ✅ Chính xác trong implementation hiện tại:
- Cấu trúc FastAPI với multiple routers
- Authentication flow với JWT tokens
- Database integration với SQLAlchemy
- Docker compose setup
- Agent mode với LangChain tools
- Real-time streaming với Server-Sent Events

#### ❌ Cần cập nhật trong tương lai:
1. **LM Studio Connection**: Sử dụng `host.docker.internal` (tạm thời)
2. **No Redis**: Hiện tại không có Redis cache layer
3. **Single Instance**: Chưa có load balancing hay clustering
4. **No Vector Database**: Chưa có PGVector implementation
5. **Basic Monitoring**: Chưa có comprehensive monitoring

---

## 📅 ROADMAP PHÁT TRIỂN

### Phase 1 (Hiện tại) ✅
- Basic chat functionality
- Streaming responses
- Agent mode với tools
- Authentication & authorization
- File upload và gallery management

### Phase 2 (Gần) 🔄
- Redis caching layer
- PGVector for semantic search
- Better error handling và monitoring
- Performance optimization
- Advanced AI features

### Phase 3 (Tương lai) 📅
- Load balancing và clustering
- Multi-region deployment
- Enterprise features
- Advanced analytics
- Custom model training

---

## 🎯 KẾT LUẬN

AI Chatbot trong TCC Log đã được implement với kiến trúc vững chắc và luồng hoạt động rõ ràng. Hệ thống hiện tại hỗ trợ:

- **Real-time streaming chat** với LM Studio và OpenAI fallback
- **Agent mode** với LangChain tools để query database
- **Authentication & authorization** đầy đủ
- **Error handling** và fallback mechanisms
- **Docker deployment** với persistent data

Tài liệu này cung cấp cái nhìn toàn diện về chức năng AI Chatbot từ góc độ kỹ thuật, nghiệp vụ và vận hành, phù hợp cho việc review stakeholder và implementation planning.

---

**Last Updated**: June 25, 2025  
**Version**: 1.0 - Comprehensive Documentation
