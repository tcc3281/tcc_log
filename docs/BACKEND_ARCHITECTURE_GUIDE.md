# Tài liệu Chi tiết Backend Hệ thống TCC Log

## Lời mở đầu

Chào mừng bạn đến với dự án TCC Log! Tài liệu này là một hướng dẫn chuyên sâu về kiến trúc, công nghệ, và cơ chế hoạt động của phần backend. Mục tiêu là trang bị cho bạn, một nhà phát triển mới, kiến thức cần thiết để nhanh chóng hòa nhập, đóng góp hiệu quả và tiếp tục phát triển hệ thống. Chúng tôi sẽ cố gắng giải thích các khái niệm một cách dễ hiểu, đặc biệt là những phần liên quan đến FastAPI và LangChain.

## 1. Tổng quan về Công nghệ

Backend của TCC Log được xây dựng trên nền tảng các công nghệ Python hiện đại, tập trung vào hiệu suất, khả năng mở rộng và sự tiện lợi cho nhà phát triển.

*   **Python 3.10+**: Ngôn ngữ lập trình chính, nổi tiếng với cú pháp rõ ràng và hệ sinh thái thư viện phong phú.
*   **FastAPI**:
    *   **Tại sao FastAPI?**: Được chọn vì hiệu suất cực cao (ngang ngửa NodeJS và Go), dựa trên Starlette (cho phần ASGI) và Pydantic (cho validation dữ liệu). Nó tự động tạo tài liệu API tương tác (Swagger UI & ReDoc), giúp việc kiểm thử và tích hợp API trở nên dễ dàng.
    *   **Tính năng chính**: Hỗ trợ lập trình bất đồng bộ (`async/await`) từ đầu, dependency injection mạnh mẽ, và validation dữ liệu nghiêm ngặt.
*   **SQLAlchemy**:
    *   **Vai trò**: ORM (Object Relational Mapper) hàng đầu cho Python. Nó cho phép bạn tương tác với cơ sở dữ liệu (CSDL) quan hệ bằng các đối tượng Python thay vì viết các câu lệnh SQL thuần, giúp code dễ đọc và bảo trì hơn.
    *   **Core & ORM**: SQLAlchemy có hai phần chính: Core (cung cấp một SQL Expression Language gần với SQL) và ORM (cho phép mapping các lớp Python với bảng CSDL). Dự án này chủ yếu sử dụng ORM.
*   **Pydantic**:
    *   **Chức năng**: Thư viện validation dữ liệu. FastAPI sử dụng Pydantic model (gọi là "schema") để định nghĩa cấu trúc dữ liệu cho request và response. Nếu dữ liệu không khớp với schema, Pydantic sẽ tự động báo lỗi chi tiết.
*   **LangChain**:
    *   **Mục đích**: Framework để phát triển các ứng dụng dựa trên Mô hình Ngôn ngữ Lớn (LLM). Nó đơn giản hóa việc kết nối LLM với các nguồn dữ liệu, các công cụ khác, và quản lý trạng thái của cuộc hội thoại.
    *   **Dành cho Fresher**: Hãy tưởng tượng LangChain như một bộ công cụ giúp bạn "lắp ráp" các tính năng AI. Bạn không cần hiểu sâu về cách LLM được huấn luyện, mà chỉ cần biết cách sử dụng các "khối lắp ráp" của LangChain để gửi yêu cầu đến LLM và nhận kết quả.
*   **LM Studio**: Hoạt động như một server LLM cục bộ. Backend sẽ giao tiếp với API do LM Studio cung cấp (thường theo chuẩn OpenAI API) để thực hiện các tác vụ AI như chat, phân tích văn bản.
*   **Docker & Docker Compose**:
    *   **Containerization**: Đóng gói ứng dụng backend và các dependency của nó (bao gồm cả Python interpreter) vào một "container" nhẹ, đảm bảo ứng dụng chạy nhất quán trên mọi môi trường.
    *   **Orchestration**: `docker-compose.yml` định nghĩa và quản lý các service của ứng dụng (ví dụ: backend, frontend, database) và cách chúng kết nối với nhau. File `run_docker.ps1` sử dụng `docker-compose` để tự động hóa việc build và chạy các container này.
*   **PostgreSQL**: Hệ quản trị CSDL quan hệ mạnh mẽ, được sử dụng làm CSDL chính.
*   **Alembic**: Công cụ migration CSDL cho SQLAlchemy. Khi bạn thay đổi `models.py` (ví dụ: thêm một cột mới vào bảng), Alembic giúp bạn tạo và áp dụng các "script migration" để cập nhật schema CSDL mà không làm mất dữ liệu.
*   **`httpx`**: Thư viện client HTTP bất đồng bộ hiện đại, được LangChain và có thể cả code tùy chỉnh sử dụng để gửi request đến các dịch vụ bên ngoài (như LM Studio).
*   **`python-dotenv`**: Quản lý các biến môi trường (ví dụ: `DATABASE_URL`, `SECRET_KEY`) từ file `.env`, giúp tách biệt cấu hình khỏi code.
*   **Uvicorn**: Server ASGI (Asynchronous Server Gateway Interface) hiệu suất cao, được dùng để chạy ứng dụng FastAPI.

## 2. Kiến trúc và Các Thành phần Chính

Cấu trúc thư mục `app/` là trung tâm của backend:

```
app/
├── __init__.py
├── crud.py             # Logic CRUD (Create, Read, Update, Delete) cho DB
├── database.py         # Cấu hình kết nối và session DB
├── main.py             # Entry point của ứng dụng FastAPI, middleware, router chính
├── models.py           # Định nghĩa các model SQLAlchemy (bảng DB)
├── schemas.py          # Định nghĩa các schema Pydantic (validation dữ liệu)
├── seed_data.py        # (Có thể) Chứa logic để tạo dữ liệu mẫu ban đầu
├── ai/
│   ├── __init__.py
│   └── lm_studio.py    # Logic tương tác với LM Studio, sử dụng LangChain
└── api/
    ├── __init__.py
    ├── ai.py           # API endpoints cho các tính năng AI
    ├── auth.py         # API endpoints và logic cho xác thực người dùng (JWT)
    ├── dependencies.py # Các dependency dùng chung cho API (vd: lấy user hiện tại)
    ├── entries.py      # API endpoints cho quản lý journal entries
    ├── files.py        # API endpoints cho upload và quản lý file
    ├── gallery.py      # API endpoints cho thư viện ảnh/file của người dùng
    ├── links.py        # API endpoints cho quản lý links
    ├── tags.py         # API endpoints cho quản lý tags
    ├── topics.py       # API endpoints cho quản lý topics
    └── users.py        # API endpoints cho quản lý người dùng
uploads/                # Thư mục lưu trữ các file được upload (được tạo bởi main.py)
```

### Chức năng chi tiết của từng thành phần:

*   **`app/main.py`**:
    *   **Khởi tạo FastAPI**: `app = FastAPI()`
    *   **Middleware**:
        *   `CORSMiddleware`: Cho phép request từ các domain khác (ví dụ: frontend chạy trên `localhost:3000` gọi API backend trên `localhost:8000`).
        *   `RequestLoggingMiddleware`: Middleware tùy chỉnh để log thông tin về mỗi request đến.
    *   **Routers**: `app.include_router(users.router, prefix="/api/users", tags=["users"])`. Mỗi file trong `app/api/` thường định nghĩa một `APIRouter`. `include_router` gắn các router này vào ứng dụng chính, giúp tổ chức code theo module.
    *   **Static Files**: `app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")` cho phép phục vụ trực tiếp các file từ thư mục `uploads/` (ví dụ: ảnh profile).
    *   **Event Handlers**: Có thể có các hàm `@app.on_event("startup")` để thực hiện tác vụ khi server khởi động (ví dụ: tạo bảng DB nếu chưa có, kết nối tới các dịch vụ).

*   **`app/database.py`**:
    *   `SQLALCHEMY_DATABASE_URL`: Chuỗi kết nối CSDL (ví dụ: `postgresql://user:password@host:port/dbname`).
    *   `engine = create_engine(...)`: "Trái tim" của SQLAlchemy, quản lý kết nối đến CSDL.
    *   `SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)`: Một factory để tạo các `Session` DB. Mỗi `Session` là một "cuộc hội thoại" riêng biệt với CSDL. `autocommit=False` và `autoflush=False` là các cài đặt phổ biến để kiểm soát transaction một cách tường minh.
    *   `Base = declarative_base()`: Lớp cơ sở mà tất cả các model SQLAlchemy (trong `models.py`) sẽ kế thừa.
    *   **`get_db()`: Dependency Injection trong FastAPI**
        ```python
        # app/database.py
        def get_db():
            db = SessionLocal()
            try:
                yield db # Cung cấp session cho path operation function
            finally:
                db.close() # Đảm bảo session được đóng sau khi request hoàn tất
        ```
        Khi một endpoint cần tương tác với DB, nó sẽ khai báo `db: Session = Depends(get_db)`. FastAPI sẽ tự động gọi `get_db()`, cung cấp `db session` cho endpoint, và sau đó dọn dẹp (đóng session) khi request kết thúc.

*   **`app/models.py`**: Định nghĩa cấu trúc bảng CSDL.
    *   **Ví dụ một Model**:
        ```python
        # app/models.py
        from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
        from sqlalchemy.orm import relationship
        from .database import Base
        import datetime

        class User(Base):
            __tablename__ = "users" # Tên bảng trong CSDL

            id = Column(Integer, primary_key=True, index=True)
            email = Column(String, unique=True, index=True, nullable=False)
            hashed_password = Column(String, nullable=False)
            full_name = Column(String, index=True)
            profile_image_url = Column(String, nullable=True)
            created_at = Column(DateTime, default=datetime.datetime.utcnow)

            entries = relationship("Entry", back_populates="owner") # Mối quan hệ one-to-many
        ```
    *   Mỗi class kế thừa `Base` tương ứng với một bảng.
    *   Các thuộc tính của class (ví dụ: `id`, `email`) là các `Column` trong bảng.
    *   `relationship()` định nghĩa mối quan hệ giữa các bảng (ví dụ: một `User` có thể có nhiều `Entry`).

*   **`app/schemas.py`**: Định nghĩa Pydantic model cho validation và serialization.
    *   **Tại sao cần Schema riêng biệt với Model?**:
        *   **API Contract**: Schema định nghĩa "hợp đồng" dữ liệu giữa client và server, độc lập với cấu trúc lưu trữ trong DB.
        *   **Security**: Ngăn chặn mass assignment vulnerabilities (không phải tất cả các trường trong model DB đều nên được client set trực tiếp).
        *   **Flexibility**: Có thể có nhiều schema cho cùng một model (ví dụ: `UserCreate` không có `id`, `User` (read) có `id` nhưng không có `hashed_password`).
    *   **Ví dụ Schema**:
        ```python
        # app/schemas.py
        from pydantic import BaseModel, EmailStr
        from typing import Optional, List
        import datetime

        class UserBase(BaseModel): # Schema cơ sở, chứa các trường chung
            email: EmailStr
            full_name: Optional[str] = None

        class UserCreate(UserBase): # Schema để tạo user mới
            password: str

        class UserUpdate(BaseModel): # Schema để cập nhật user
            full_name: Optional[str] = None
            email: Optional[EmailStr] = None
            # Không cho phép cập nhật password qua endpoint này chẳng hạn

        class User(UserBase): # Schema để đọc thông tin user (trả về từ API)
            id: int
            profile_image_url: Optional[str] = None
            created_at: datetime.datetime

            class Config:
                orm_mode = True # Cho phép Pydantic đọc dữ liệu từ SQLAlchemy model
        ```

*   **`app/crud.py`**: Chứa các hàm thực hiện thao tác CSDL (Create, Read, Update, Delete).
    *   **Mục đích**: Tách biệt logic nghiệp vụ (trong API endpoints) khỏi logic truy cập dữ liệu. Giúp code dễ test và tái sử dụng.
    *   **Ví dụ một hàm CRUD**:
        ```python
        # app/crud.py
        from sqlalchemy.orm import Session
        from . import models, schemas
        from passlib.context import CryptContext # Để hash password

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        def create_user(db: Session, user: schemas.UserCreate):
            hashed_password = pwd_context.hash(user.password)
            db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
            db.add(db_user)
            db.commit()
            db.refresh(db_user) # Lấy lại thông tin user từ DB (ví dụ: id được tự động tạo)
            return db_user
        ```

*   **`app/api/` (thư mục)**:
    *   Mỗi file định nghĩa một `APIRouter` cho một nhóm tài nguyên.
    *   **`dependencies.py`**: Chứa các dependency dùng chung.
        *   **`get_current_active_user`**: Một dependency quan trọng để bảo vệ endpoint. Nó sẽ:
            1.  Lấy token JWT từ header `Authorization: Bearer <token>`.
            2.  Giải mã và xác thực token (kiểm tra chữ ký, thời gian hết hạn).
            3.  Nếu token hợp lệ, lấy `user_id` (hoặc `username`) từ payload của token.
            4.  Truy vấn CSDL để lấy đối tượng `User` tương ứng.
            5.  Trả về đối tượng `User` hoặc raise `HTTPException` nếu có lỗi.
    *   **`auth.py`**: Xử lý đăng nhập (tạo JWT), đăng ký.
        *   **JWT (JSON Web Token)**: Một chuỗi JSON được mã hóa và ký số, dùng để xác thực người dùng một cách an toàn và stateless. Khi user đăng nhập thành công, server tạo một JWT chứa thông tin user (ví dụ: `user_id`) và gửi về client. Client gửi JWT này trong header của mỗi request tiếp theo để chứng minh danh tính.
    *   **`files.py`**: Xử lý upload file, lưu file vào thư mục `uploads/` và metadata vào DB.
    *   **`ai.py`**: Các endpoint để client tương tác với tính năng AI, gọi các hàm trong `app/ai/lm_studio.py`.

*   **`app/ai/lm_studio.py`**: Trái tim của các tính năng AI.
    *   **Kết nối LM Studio**: Sử dụng `ChatOpenAI` từ LangChain, trỏ đến API của LM Studio (ví dụ: `base_url="http://localhost:1234/v1"`).
    *   **LangChain Components**:
        *   `ChatOpenAI`: Client để gửi request đến LLM.
        *   `ChatPromptTemplate`, `SystemMessage`, `HumanMessage`, `AIMessage`: Xây dựng prompt có cấu trúc. `SystemMessage` rất quan trọng để "hướng dẫn" LLM cách hành xử.
        *   `StrOutputParser`: Parser đơn giản để lấy nội dung text từ response của LLM.
        *   **Chains (`|`)**: Cách dễ nhất để kết hợp các component. Ví dụ:
            ```python
            # Conceptual example of a simple chain
            from langchain_openai import ChatOpenAI
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser

            llm = ChatOpenAI(openai_api_base="http://localhost:1234/v1", openai_api_key="not-needed")
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful assistant."),
                ("user", "{input}")
            ])
            output_parser = StrOutputParser()

            chain = prompt | llm | output_parser
            # response = chain.invoke({"input": "Tell me a joke."})
            # async for chunk in chain.astream({"input": "Write a short story."}):
            #     print(chunk, end="", flush=True)
            ```
        *   `AgentExecutor`, `create_openai_functions_agent`, `Tool`: Cho phép LLM sử dụng các "công cụ" (hàm Python) để thực hiện tác vụ.
        *   `ConversationBufferMemory`: Giúp agent "nhớ" lịch sử hội thoại.
    *   **Streaming**: Sử dụng phương thức `.astream()` của chain hoặc `stream=True` của client OpenAI để nhận phản hồi từ LLM từng phần, cải thiện trải nghiệm người dùng.

## 3. Sơ đồ Mermaid Liên kết Thành phần

```mermaid
graph TD
    subgraph Client ["Client (Browser/Mobile App)"]
        UserInterface
    end

    subgraph BackendServer ["Backend (FastAPI Application on Server)"]
        FApp[FastAPI App - main.py] -- Routes Request --> APIRouters
        Middleware["Middleware (CORS, Logging) - main.py"]:::middlewareClass --> FApp

        subgraph APILayer [API Layer - app/api/]
            RouterAuth[auth.py API Router]:::routerClass
            RouterUsers[users.py API Router]:::routerClass
            RouterEntries[entries.py API Router]:::routerClass
            RouterFiles[files.py API Router]:::routerClass
            RouterAI[ai.py API Router]:::routerClass
            APIDependencies["dependencies.py (e.g., get_current_user)"]:::dependenciesClass
        end
        APIRouters{API Routers} -->|Uses| RouterAuth
        APIRouters -->|Uses| RouterUsers
        APIRouters -->|Uses| RouterEntries
        APIRouters -->|Uses| RouterFiles
        APIRouters -->|Uses| RouterAI
        APIRouters -- Injects --> APIDependencies

        PydanticSchemas[Pydantic Schemas - schemas.py]:::schemaClass
        CRUDOps[CRUD Operations - crud.py]:::crudClass
        SQLAlchemyModels[SQLAlchemy Models - models.py]:::modelClass
        DBConfig["Database Config - database.py (engine, SessionLocal, get_db)"]:::dbConfigClass
        AILogic[AI Logic & LangChain - ai/lm_studio.py]:::aiClass

        RouterAuth -- Validates with/Serializes via --> PydanticSchemas
        RouterUsers -- Validates with/Serializes via --> PydanticSchemas
        RouterEntries -- Validates with/Serializes via --> PydanticSchemas
        RouterFiles -- Validates with/Serializes via --> PydanticSchemas
        RouterAI -- Validates with/Serializes via --> PydanticSchemas

        RouterAuth -- Calls --> CRUDOps
        RouterUsers -- Calls --> CRUDOps
        RouterEntries -- Calls --> CRUDOps
        RouterFiles -- Calls --> CRUDOps

        RouterAI -- Calls --> AILogic

        CRUDOps -- Interacts with (uses/creates instances of) --> SQLAlchemyModels
        CRUDOps -- Uses Session from --> DBConfig
        SQLAlchemyModels -- Mapped to --> ActualDB[(Database - PostgreSQL)]
        DBConfig -- Connects to --> ActualDB

        AILogic -- Uses LangChain Components --> LangChainLib[LangChain Library]
        LangChainLib -- HTTP Request via httpx --> LMStudioAPI["LM Studio API (External LLM Server)"]

        RouterFiles -- Saves/Reads Files --> UploadsFolder["/uploads/ Directory"]
    end

    UserInterface -- HTTP Request (e.g., GET, POST, PUT) --> Middleware
    Middleware -- HTTP Response (e.g., JSON, Streaming) --> UserInterface
    LMStudioAPI -- LLM Response (Text, JSON Chunks) --> LangChainLib

    classDef middlewareClass fill:#f9f,stroke:#333,stroke-width:2px;
    classDef routerClass fill:#ccf,stroke:#333,stroke-width:2px;
    classDef dependenciesClass fill:#ddf,stroke:#333,stroke-width:2px;
    classDef schemaClass fill:#cfc,stroke:#333,stroke-width:2px;
    classDef crudClass fill:#ffc,stroke:#333,stroke-width:2px;
    classDef modelClass fill:#fcc,stroke:#333,stroke-width:2px;
    classDef dbConfigClass fill:#fec,stroke:#333,stroke-width:2px;
    classDef aiClass fill:#cff,stroke:#333,stroke-width:2px;
```

## 4. Cơ chế Hoạt động Chi tiết

### 4.1. Luồng Request-Response Cơ bản (Ví dụ: Lấy danh sách Topics)

1.  **Client gửi Request**:
    *   Trình duyệt gửi `GET` request đến endpoint `/api/topics/`.
    *   Ví dụ dùng `curl`: `curl -X GET "http://localhost:8000/api/topics/" -H "accept: application/json"`
    *   Nếu endpoint yêu cầu xác thực, client sẽ gửi thêm header: `-H "Authorization: Bearer <your_jwt_token>"`
2.  **Middleware**: Request đi qua middleware (CORS, logging).
3.  **FastAPI Routing**: `app/main.py` chuyển request đến router trong `app/api/topics.py`.
4.  **Path Operation Function**: Hàm xử lý endpoint (ví dụ: `read_topics`) được gọi.
    ```python
    # app/api/topics.py (Simplified)
    @router.get("/", response_model=List[schemas.Topic])
    def read_topics(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        # current_user: models.User = Depends(get_current_active_user) # If auth is needed
    ):
        topics = crud.get_topics(db, skip=skip, limit=limit)
        return topics
    ```
5.  **Dependency Injection**:
    *   `db: Session = Depends(get_db)`: `get_db` được gọi, cung cấp một DB session.
    *   `current_user: models.User = Depends(get_current_active_user)`: Nếu endpoint yêu cầu, `get_current_active_user` được gọi để xác thực và lấy thông tin user.
6.  **Gọi CRUD Operation**: `crud.get_topics(db, skip=skip, limit=limit)` được gọi.

7.  **Tương tác Database (trong `app/crud.py`)**:
    ```python
    # app/crud.py (Simplified)
    def get_topics(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Topic).offset(skip).limit(limit).all()
    ```
    SQLAlchemy thực hiện truy vấn `SELECT * FROM topics OFFSET skip LIMIT limit;`.
8.  **Trả về Response**:
    *   Hàm CRUD trả về một list các object `models.Topic`.
    *   FastAPI tự động serialize list này thành JSON dựa trên `response_model=List[schemas.Topic]` và gửi HTTP response 200 OK.
    *   **Ví dụ Pydantic Validation Error**: Nếu client gửi dữ liệu `POST` để tạo topic mới nhưng thiếu trường bắt buộc (ví dụ `name`), FastAPI (thông qua Pydantic) sẽ tự động trả về lỗi 422:
        ```json
        {
          "detail": [
            {
              "loc": ["body", "name"],
              "msg": "field required",
              "type": "value_error.missing"
            }
          ]
        }
        ```
9.  **Đóng Session DB**: `get_db` đảm bảo `db.close()` được gọi.

### 4.2. Luồng Tương tác AI (Chat với AI có Streaming)

1.  **Client gửi Request**: `POST` request đến `/api/ai/chat-stream` với `AIRequest` (chứa message, history, model, etc.).
2.  **FastAPI Routing & Validation**: Request được route đến `app/api/ai.py`, dữ liệu được validate bằng `schemas.AIRequest`.
3.  **Gọi Logic AI**: Endpoint trong `app/api/ai.py` gọi `chat_with_ai(request_data, streaming=True)` từ `app/ai/lm_studio.py`.
4.  **Xử lý trong `chat_with_ai()` (`app/ai/lm_studio.py`)**:
    *   **Chuẩn bị Prompt**: Xây dựng prompt hoàn chỉnh (system, history, user message).
    *   **Khởi tạo LLM Chain**: Tạo một chain LangChain (ví dụ: `prompt | llm | StrOutputParser()`).
    *   **Gọi LLM (Streaming)**: `chain.astream({"input": user_message, "chat_history": history_messages})` được gọi.
    *   **Yield Chunks**: Hàm `chat_with_ai` `async for` qua các chunk từ `chain.astream()`:
        ```python
        # app/ai/lm_studio.py (Simplified streaming part)
        async for chunk_content in chain.astream(...):
            yield json.dumps({"type": "answer", "content": chunk_content}) + "\n\n"
        # After loop, yield stats
        yield json.dumps({"type": "stats", ...}) + "\n\n"
        ```
5.  **Xử lý Streaming trong API Endpoint (`app/api/ai.py`)**:
    *   Endpoint được định nghĩa với `response_class=StreamingResponse`.
    *   Nó nhận generator từ `chat_with_ai` và stream các chunk này về client.
    *   Mỗi `yield` từ `chat_with_ai` trở thành một "event" trong Server-Sent Events (SSE).
        *   **Server-Sent Events (SSE)**: Một cơ chế đơn giản để server đẩy dữ liệu đến client qua một kết nối HTTP duy nhất. Mỗi message được gửi dưới dạng `data: <your_json_string_or_text>`.
6.  **Client nhận và hiển thị**:
    *   Frontend sử dụng `EventSource` API để kết nối với endpoint streaming.
    *   Khi mỗi `message` event từ SSE được nhận, frontend parse JSON và cập nhật UI (ví dụ: nối thêm text vào ô chat).
    *   **Ví dụ Frontend (Conceptual JavaScript)**:
        ```javascript
        const eventSource = new EventSource("http://localhost:8000/api/ai/chat-stream"); // (POST request is more complex, this is for GET SSE)
        let fullResponse = "";
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === "answer") {
                fullResponse += data.content;
                document.getElementById("chatbox").innerText = fullResponse;
            } else if (data.type === "stats") {
                console.log("Stats:", data);
                eventSource.close(); // Close connection after stats
            }
        };
        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };
        ```

### 4.3. Hiểu sâu hơn về LangChain cho Fresher

LangChain là một thư viện mạnh mẽ, nhưng bạn có thể bắt đầu bằng cách hiểu các khối xây dựng cốt lõi của nó:

*   **LLMs / ChatModels (`ChatOpenAI`)**: Đây là giao diện của bạn với các mô hình ngôn ngữ. Bạn cấu hình nó với `base_url` của LM Studio và tên model.
*   **Prompts (`ChatPromptTemplate`, `SystemMessage`, `HumanMessage`, `AIMessage`)**:
    *   **Tầm quan trọng của System Prompt**: Đây là "bộ quy tắc" bạn đặt ra cho LLM. Một system prompt tốt có thể cải thiện đáng kể chất lượng đầu ra. Ví dụ, trong `LangChainAgent` của dự án, system prompt hướng dẫn LLM cách sử dụng LaTeX, cách trả lời, v.v.
    *   **Template**: Cho phép bạn dễ dàng chèn các biến vào prompt (ví dụ: `{input}` cho câu hỏi của người dùng, `{chat_history}` cho lịch sử).
*   **Output Parsers (`StrOutputParser`)**: Chuyển đổi output thô từ LLM thành một định dạng dễ sử dụng hơn (ví dụ: một chuỗi Python). Có nhiều loại parser phức tạp hơn để trích xuất JSON, list, v.v.
*   **Chains (`|` hoặc `LLMChain`, `SequentialChain`)**:
    *   **LCEL (LangChain Expression Language)**: Ký hiệu `|` là một phần của LCEL, cho phép bạn "nối" các component lại với nhau một cách trực quan. `prompt | llm | parser` là một chain đơn giản.
    *   **Mục đích**: Đóng gói một chuỗi các bước xử lý. Bạn có thể coi một chain như một "pipeline" cho dữ liệu đi qua.
*   **Agents và Tools**:
    *   **Khi nào dùng Agent?**: Khi bạn muốn LLM không chỉ trả lời dựa trên kiến thức sẵn có mà còn có thể thực hiện hành động (ví dụ: tìm kiếm web, truy vấn CSDL, tính toán).
    *   **Tool**: Một hàm Python được "đăng ký" với Agent. LLM sẽ quyết định khi nào cần gọi tool nào dựa trên input của người dùng.
    *   **ReAct (Reasoning and Acting)**: Nhiều agent sử dụng một framework như ReAct, nơi LLM "suy nghĩ" (Thought), quyết định "hành động" (Action - gọi tool), quan sát "kết quả" (Observation), và lặp lại cho đến khi có câu trả lời cuối cùng.
*   **Memory (`ConversationBufferMemory`, `ConversationSummaryMemory`)**:
    *   **Tại sao cần Memory?**: LLM vốn dĩ là stateless (không nhớ các tương tác trước). Memory giúp duy trì ngữ cảnh của cuộc hội thoại.
    *   `ConversationBufferMemory` lưu trữ toàn bộ lịch sử chat.
    *   Các loại memory khác có thể tóm tắt lịch sử để tiết kiệm token.
*   **Streaming với LangChain**: Hầu hết các component hỗ trợ `.stream()` hoặc `.astream()` (cho async) để nhận kết quả từng phần.

**LangChain giải quyết vấn đề gì cho bạn?**
Thay vì phải tự viết code để:
1.  Định dạng prompt phức tạp.
2.  Gửi HTTP request đến API của LLM.
3.  Parse response.
4.  Quản lý lịch sử hội thoại.
5.  Tích hợp LLM với các hàm Python khác (tools).
LangChain cung cấp các abstraction và component được xây dựng sẵn, giúp bạn tập trung vào logic ứng dụng AI thay vì các chi tiết kỹ thuật cấp thấp.

### 4.4. Cơ chế Upload File (`app/api/files.py`)

1.  **Client Upload**: Dùng `FormData` để gửi file.
2.  **FastAPI nhận File**: `file: UploadFile = File(...)`. `UploadFile` là một đối tượng chứa metadata và stream của file.
3.  **Đọc nội dung**: `contents = await file.read()`.
4.  **Tạo tên File duy nhất**: `unique_name = f"{uuid4().hex}{file_ext}"`.
5.  **Lưu File vào Disk**:
    *   Đường dẫn: `file_location = os.path.join(settings.UPLOADS_DIR, unique_name)` (giả sử `settings.UPLOADS_DIR` được cấu hình).
    *   Ghi file: `with open(file_location, "wb") as f: f.write(contents)`.
6.  **Lưu Metadata vào DB**: Thông tin (tên gốc, tên duy nhất, kích thước, user_id, entry_id) được lưu vào bảng `files` thông qua `crud.create_file()`.
7.  **Security Considerations (Nên có)**:
    *   **Filename Sanitization**: Không nên tin tưởng tên file gốc từ client. Tên file duy nhất đã giải quyết một phần.
    *   **Content Type Validation**: Kiểm tra `file.content_type` để đảm bảo chỉ chấp nhận các loại file mong muốn (ví dụ: `image/jpeg`, `application/pdf`).
    *   **File Size Limit**: FastAPI có thể cấu hình giới hạn kích thước request body.
    *   **Virus Scanning**: Đối với các hệ thống quan trọng, có thể tích hợp quét virus cho file upload.

## 5. Hướng dẫn và Lời khuyên cho Fresher

*   **Thiết lập Môi trường**:
    *   **Docker (Khuyến khích)**: Sử dụng `run_docker.ps1` để có môi trường phát triển nhất quán và dễ dàng.
    *   **Local Setup**: Nếu không dùng Docker, hãy đảm bảo bạn có Python (phiên bản như trong `Dockerfile.backend`), PostgreSQL server đang chạy, và đã cài đặt tất cả dependencies từ `requirements.txt` vào một virtual environment (ví dụ: Conda, venv).
*   **Sử dụng API Docs**: Mở trình duyệt và truy cập `http://localhost:8000/docs` (Swagger UI) hoặc `http://localhost:8000/redoc`. Đây là công cụ cực kỳ hữu ích để:
    *   Xem tất cả các API endpoint.
    *   Hiểu rõ schema request và response cho từng endpoint.
    *   **Thử nghiệm API trực tiếp từ trình duyệt.**
*   **Debugging**:
    *   **FastAPI**: Sử dụng `print()` hoặc `logging` (ví dụ: `import logging; logger = logging.getLogger(__name__); logger.info(...)`).
    *   **SQLAlchemy**: Để xem câu lệnh SQL mà SQLAlchemy tạo ra:
        ```python
        # Trong app/database.py, khi tạo engine:
        # engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True) # echo=True sẽ log SQL
        ```
    *   **Debugger**: Sử dụng debugger của IDE (VS Code, PyCharm) để đặt breakpoint và theo dõi giá trị biến.
*   **Đọc và Hiểu Code Hiện có**:
    *   Bắt đầu từ `app/main.py` để hiểu cách các router được gắn vào.
    *   Chọn một API endpoint đơn giản (ví dụ: lấy danh sách users) và theo dõi luồng của nó từ `app/api/users.py` -> `app/crud.py` -> `app/models.py` và `app/schemas.py`.
*   **LangChain từng bước**:
    *   Đọc tài liệu "Get Started" của LangChain.
    *   Thử nghiệm các ví dụ nhỏ, độc lập trước khi cố gắng hiểu các chain phức tạp trong dự án.
    *   Tập trung vào việc hiểu `ChatPromptTemplate`, `ChatOpenAI`, và cách kết hợp chúng bằng LCEL (`|`).
*   **Quản lý Phiên bản (Git)**:
    *   Làm quen với các lệnh Git cơ bản: `clone`, `branch`, `checkout`, `add`, `commit`, `push`, `pull`, `merge`.
    *   Luôn tạo branch mới cho mỗi feature hoặc bug fix.
    *   Viết commit message rõ ràng.
*   **Viết Tests**: (Nếu dự án có tests) Tìm hiểu cách chạy test và viết unit test/integration test cho code bạn viết.
*   **Alembic Migrations**: Khi bạn thay đổi `app/models.py`:
    1.  `alembic revision -m "Mô tả thay đổi của bạn" --autogenerate` (Docker: `docker-compose exec backend alembic revision ...`)
    2.  Kiểm tra file migration vừa được tạo trong `alembic/versions/`.
    3.  `alembic upgrade head` (Docker: `docker-compose exec backend alembic upgrade head`)
*   **Đặt câu hỏi**: Đừng ngần ngại hỏi các thành viên khác trong team. Thà hỏi sớm còn hơn là đi sai hướng hoặc tốn nhiều thời gian vô ích.

Chúc bạn có một khởi đầu thuận lợi và đóng góp hiệu quả cho dự án TCC Log!
