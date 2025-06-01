"""add_profile_image_url

Revision ID: 7caa9d81e9b3
Revises: 
Create Date: 2025-05-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7caa9d81e9b3'
down_revision = None  # Adjust this to match your previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Không làm gì cả vì cột đã được định nghĩa trong model và sẽ được tạo
    # bởi Base.metadata.create_all khi khởi động ứng dụng
    pass


def downgrade():
    # Không làm gì cả vì chúng ta muốn giữ cột này
    pass
