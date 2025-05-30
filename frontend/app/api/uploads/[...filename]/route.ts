import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to get MIME type from file extension
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    // Build the file path from URL segments
    const filename = params.filename.join('/');
    
    // For security, ensure we only serve files from the uploads directory
    if (!filename.startsWith('profiles/')) {
      return new NextResponse('Not found', { status: 404 });
    }
<<<<<<< HEAD
      // Construct the full file path - look in public/uploads when in Docker
    // or try the parent directory (../uploads) as fallback for development
    let filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    // Check if file exists, if not try the alternative path
    if (!fs.existsSync(filePath)) {
      // Try the parent directory
      const altPath = path.join(process.cwd(), '..', 'uploads', filename);
      if (fs.existsSync(altPath)) {
        filePath = altPath;
      } else {
        console.error(`File not found: ${filePath} or ${altPath}`);
        return new NextResponse('Not found', { status: 404 });
      }
=======
    
    // Construct the full file path
    const filePath = path.join(process.cwd(), '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return new NextResponse('Not found', { status: 404 });
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Get MIME type from file extension
    const extension = path.extname(filePath);
    const mimeType = getMimeType(extension);
    
    // Return file with proper content type
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
