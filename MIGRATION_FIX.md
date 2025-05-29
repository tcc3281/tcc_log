# Hướng dẫn sửa lỗi Backend

## Vấn đề đã được phát hiện:

### 1. Thiếu module `httpx`
- **Lỗi**: `ModuleNotFoundError: No module named 'httpx'`
- **Nguyên nhân**: File `app/ai/lm_studio.py` sử dụng `httpx` nhưng module này không có trong `requirements.txt`
- **Đã sửa**: ✅ Thêm `httpx==0.24.1` vào `requirements.txt`

### 2. Lỗi Alembic migration
- **Lỗi**: `Can't locate revision identified by '312d52c29e6c'`
- **Nguyên nhân**: Database có migration history cũ không khớp với migration files hiện tại
- **Đã sửa**: ✅ Cập nhật `run_backend.py` để tự động xử lý lỗi này

## Cách chạy sau khi sửa:

### Cách 1: Chạy bình thường (Recommended)
```bash
# Rebuild container với dependencies mới
docker-compose down
docker-compose build
docker-compose up

# Hoặc với script
./run_docker.sh
```

### Cách 2: Nếu vẫn gặp lỗi migration
```bash
# Chạy script reset migration
python reset_migrations.py

# Sau đó chạy backend
python run_backend.py
```

### Cách 3: Reset hoàn toàn database
```bash
# Xóa volume database
docker-compose down -v
docker-compose up
```

## Thay đổi đã thực hiện:

1. **requirements.txt**: Thêm `httpx==0.24.1`
2. **run_backend.py**: Thêm auto-recovery cho migration errors
3. **reset_migrations.py**: Script backup để reset migration thủ công

## Kiểm tra sau khi sửa:

1. Backend khởi động thành công ✅
2. API endpoints hoạt động ✅
3. Database migration hoàn thành ✅
4. AI features (sử dụng httpx) hoạt động ✅

## Lưu ý:
- Nếu vẫn gặp vấn đề, có thể cần xóa toàn bộ database volume và tạo lại
- Module `httpx` được sử dụng cho AI features với LM Studio
- Migration được reset tự động khi phát hiện revision conflict 