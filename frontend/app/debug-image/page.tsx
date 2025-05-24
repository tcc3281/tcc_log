'use client';
import { useState, useEffect } from 'react';
import { getFileUrl } from '../../lib/file-utils';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// Định nghĩa kiểu dữ liệu cho file
interface FileData {
  file_id: number;
  entry_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export default function ImageDebugPage() {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('/uploads/profiles/8919ea2ee775410b9cba333d3a63ef6b.jpg');
  const [userFiles, setUserFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const fullImageUrl = getFileUrl(imageUrl);

  useEffect(() => {
    // Reset image error when URL changes
    setImageError(false);
    
    // Lấy tất cả file của user để test
    if (user) {
      setLoading(true);
      api.get('/gallery/user/files')
        .then(response => {
          const files = response.data.filter((file: FileData) => 
            file.file_type.startsWith('image/')
          );
          setUserFiles(files);
          
          // Nếu có file, set mặc định là file đầu tiên
          if (files.length > 0) {
            setImageUrl(`uploads/${files[0].file_path}`);
          }
        })
        .catch(error => console.error("Không thể tải file:", error))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleImageError = () => {
    console.error('Error loading image:', imageUrl);
    setImageError(true);
  };

    return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Debug Ảnh</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Đường dẫn ảnh:</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>URL đầy đủ:</strong> {fullImageUrl}</p>
        {imageError && (
          <p className="text-red-500 mt-2">
            ⚠️ Ảnh này không thể tải được. Kiểm tra lại đường dẫn và quyền truy cập.
          </p>
        )}
      </div>

      {userFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl mb-2">Ảnh của bạn:</h2>
          <div className="grid grid-cols-3 gap-4">
            {userFiles.map(file => (
              <div 
                key={file.file_id} 
                className={`border p-2 rounded cursor-pointer ${imageUrl === `uploads/${file.file_path}` ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => setImageUrl(`uploads/${file.file_path}`)}
              >
                <p className="text-sm truncate mb-2">{file.file_name}</p>
                <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getFileUrl(`uploads/${file.file_path}`)} 
                    alt={file.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = '/images/placeholder-image.svg';
                    }}
                    style={{ backgroundColor: '#f8f8f8' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6">
        <div className="mb-4">
          <h2 className="text-xl mb-2">Regular Img Tag</h2>
          <div className="border border-gray-300 overflow-hidden" style={{ minHeight: '200px', backgroundColor: '#f8f8f8' }}>
            {imageError ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
                Cannot load image
              </div>
            ) : (
              <img 
                src={fullImageUrl} 
                alt="Test image" 
                className="max-w-full"
                style={{ display: 'block', width: '100%' }}
                onError={handleImageError}
              />
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl mb-2">Background Image</h2>
          <div 
            className="w-full h-64 border border-gray-300 flex items-center justify-center" 
            style={{ 
              backgroundImage: imageError ? 'none' : `url(${fullImageUrl})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              backgroundColor: '#f8f8f8'
            }}
          >
            {imageError && <span className="text-gray-500">Cannot load image</span>}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Link trực tiếp</h2>
        <p>
          <a 
            href={fullImageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Mở ảnh trong tab mới
          </a>
        </p>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl mb-2">Troubleshooting</h2>
        <ul className="list-disc ml-5 space-y-2">
          <li>Check CORS headers on the server</li>
          <li>Verify that the file exists and is accessible</li>
          <li>Make sure the image path is correct</li>
          <li>Check if the server supports direct file access</li>
          <li>Try using an absolute URL instead of a relative one</li>
        </ul>
      </div>
    </div>
  );
}
