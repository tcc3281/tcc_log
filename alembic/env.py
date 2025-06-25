from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

# this is the Alembic Config object, which provides access to the values within the .ini file.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Debug the DATABASE_URL
print("DATABASE_URL:", os.getenv('DATABASE_URL'))  # Add this line to debug

# Comment out the environment variable override to use alembic.ini URL
# Set the database URL from the environment variable only if it exists and is valid
# database_url = os.getenv('DATABASE_URL')
# if database_url and not ('?' in database_url and '%3F' not in database_url):
#     config.set_main_option('sqlalchemy.url', database_url)

# Add your models' MetaData object here for 'autogenerate' support
from app.models import Base
target_metadata = Base.metadata

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
