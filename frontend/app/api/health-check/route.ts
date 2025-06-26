import { NextResponse } from 'next/server';

// Simple health check endpoint to test API connectivity
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API server is running'
  });
}

// Support HEAD requests for simple connectivity checks
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
