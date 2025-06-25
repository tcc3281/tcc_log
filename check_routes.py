#!/usr/bin/env python3

from app.main import app
from fastapi.routing import APIRoute

print('Available routes:')
print('=' * 50)
for route in app.router.routes:
    if isinstance(route, APIRoute):
        methods = ', '.join(route.methods)
        print(f'{methods:15} {route.path}')

print('\n' + '=' * 50)
print('Looking for entries routes specifically:')
for route in app.router.routes:
    if isinstance(route, APIRoute) and 'entries' in route.path:
        methods = ', '.join(route.methods)
        print(f'{methods:15} {route.path}')
