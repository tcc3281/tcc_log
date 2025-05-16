'use client';
import { useState } from 'react';
import { getFileUrl } from '../../lib/file-utils';
import Image from 'next/image';

export default function ImageDebugPage() {
  const [imageUrl, setImageUrl] = useState('/uploads/profiles/8919ea2ee775410b9cba333d3a63ef6b.jpg');
  const fullImageUrl = getFileUrl(imageUrl);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Image Debug Page</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Image URL</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <p><strong>Full URL:</strong> {fullImageUrl}</p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Next.js Image Component</h2>
        <div className="w-32 h-32 border border-gray-300 relative overflow-hidden">
          {fullImageUrl && (
            <Image
              src={fullImageUrl}
              alt="Test image"
              width={128}
              height={128}
              className="object-cover"
            />
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Regular Img Tag</h2>
        <div className="w-32 h-32 border border-gray-300 overflow-hidden">
          {fullImageUrl && (
            <img 
              src={fullImageUrl} 
              alt="Test image" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Direct URL</h2>
        <p>
          <a href={fullImageUrl} target="_blank" rel="noopener noreferrer">
            Open image directly in new tab
          </a>
        </p>
      </div>
    </div>
  );
}
