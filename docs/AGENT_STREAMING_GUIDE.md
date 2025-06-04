# Agent Streaming Guide

## Tổng quan

Hệ thống hiện tại đã được cải thiện để hỗ trợ streaming text trong agent mode, cho phép bạn nhận phản hồi theo thời gian thực khi AI agent đang xử lý.

## Các loại Streaming

### 1. Basic Agent Streaming
Streaming cơ bản với agent mode, hiển thị output cuối cùng:

```python
from app.ai.lm_studio import chat_with_ai, create_default_tools

async def basic_streaming_example():
    async for chunk in chat_with_ai(
        message="What is 2 + 2?",
        streaming=True,
        use_agent=True,
        tools=create_default_tools()
    ):
        print(chunk, end="", flush=True)
```

### 2. Enhanced Agent Streaming
Streaming chi tiết với thông tin về tool usage và thinking process:

```python
from app.ai.lm_studio import chat_with_ai_agent_enhanced_streaming

async def enhanced_streaming_example():
    async for event_chunk in chat_with_ai_agent_enhanced_streaming(
        message="Calculate something and search for info",
        tools=create_default_tools()
    ):
        print(event_chunk, end="", flush=True)
```

### 3. Regular Streaming (Non-Agent)
Streaming thông thường không dùng agent:

```python
async def regular_streaming_example():
    async for chunk in chat_with_ai(
        message="Explain something",
        streaming=True,
        use_agent=False  # Không dùng agent
    ):
        print(chunk, end="", flush=True)
```

## Features của Agent Streaming

### 🤔 Thinking Process
- Hiển thị quá trình suy nghĩ của AI agent
- Thông báo khi agent đang lập kế hoạch

### 🔧 Tool Usage Indicators  
- Thông báo khi agent bắt đầu sử dụng tools
- Hiển thị kết quả từ tools
- Theo dõi quá trình thực thi tools

### 📋 Result Streaming
- Stream kết quả trực tiếp từ LLM
- Hiển thị output cuối cùng từ agent

### ✅ Completion Status
- Thông báo khi agent hoàn thành task
- Tổng hợp kết quả cuối cùng

## Cấu hình và Setup

### Environment Variables
Đảm bảo bạn đã cấu hình:

```bash
# LM Studio configuration
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=your-model-name
LM_MAX_INFERENCE_TIME=60000

# Database (optional, for PostgreSQL tools)
DATABASE_URL=postgresql://user:password@host:port/dbname
```

### Tools Configuration
Agent có thể sử dụng các tools sau:

#### Default Tools:
- **search**: Tìm kiếm thông tin
- **calculator**: Thực hiện tính toán

#### PostgreSQL Tools (tự động thêm nếu có DATABASE_URL):
- **database_query**: Thực thi SQL queries
- **get_database_schema**: Lấy schema database
- **analyze_query**: Phân tích SQL query
- **get_table_info**: Thông tin chi tiết về table
- **inspect_data**: Xem mẫu dữ liệu
- **get_table_relationships**: Mối quan hệ giữa tables
- **get_table_sizes**: Kích thước của tables

## Sử dụng trong Application

### FastAPI Endpoint Example
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

@app.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        async for chunk in chat_with_ai(
            message=request.message,
            streaming=True,
            use_agent=request.use_agent,
            tools=create_default_tools()
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")
```

### WebSocket Example
```python
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        data = await websocket.receive_text()
        message_data = json.loads(data)
        
        async for chunk in chat_with_ai(
            message=message_data["message"],
            streaming=True,
            use_agent=True
        ):
            await websocket.send_text(json.dumps({
                "type": "chunk",
                "content": chunk
            }))
```

## Testing

Chạy test script để kiểm tra streaming:

```bash
python test_agent_streaming.py
```

Test script sẽ kiểm tra:
- ✅ Basic agent streaming
- ✅ Enhanced agent streaming với detailed events
- ✅ Regular non-agent streaming (để so sánh)
- ✅ Database agent streaming (nếu có DATABASE_URL)

## Troubleshooting

### Common Issues:

1. **Agent không stream**: 
   - Kiểm tra LM Studio có đang chạy không
   - Xác nhận model đã được load

2. **Tools không hoạt động**:
   - Kiểm tra DATABASE_URL (cho PostgreSQL tools)
   - Verify tools được khởi tạo đúng cách

3. **Streaming bị chậm**:
   - Tăng `LM_MAX_INFERENCE_TIME` 
   - Kiểm tra network latency đến LM Studio

4. **Empty chunks**:
   - Code đã được filter để chỉ yield non-empty chunks
   - Check logs để debug

### Debug Tips:

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check agent status với color indicators:
- 🟢 **[AGENT MODE ACTIVE]**: Agent đang hoạt động
- 🔵 **[NON-AGENT MODE]**: Chế độ thông thường  
- 🔴 **[AGENT FAILED]**: Agent lỗi, fallback to non-agent
- 🌊 **Starting streaming**: Bắt đầu streaming
- 🔍 **Starting detailed streaming**: Enhanced streaming mode

## API Reference

### chat_with_ai()
```python
async def chat_with_ai(
    message: str,
    history: List[Dict[str, str]] = None,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    streaming: bool = False,
    use_agent: bool = False,
    tools: Optional[List[Tool]] = None
):
```

### chat_with_ai_agent_enhanced_streaming()
```python
async def chat_with_ai_agent_enhanced_streaming(
    message: str,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    tools: Optional[List[Tool]] = None
):
```

### LangChainAgent Methods
```python
# Basic streaming
async def chat(self, message: str, streaming: bool = False)

# Enhanced streaming with events
async def astream_events(self, message: str)
```

## Best Practices

1. **Always handle exceptions** trong streaming loops
2. **Filter empty chunks** để tránh hiển thị content trống
3. **Use flush=True** khi print streaming content
4. **Implement timeout** cho streaming operations
5. **Provide visual indicators** cho user về trạng thái streaming
6. **Test với different message types** để ensure robustness

---

Với implementation này, bạn giờ đã có thể sử dụng streaming text trong agent mode một cách mượt mà và chi tiết! 🎉 