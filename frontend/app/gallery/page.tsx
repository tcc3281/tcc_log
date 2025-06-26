'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import { getFileUrl } from '../../lib/file-utils';

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

const GalleryPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<FileData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/gallery/user/files');
        
        // Lọc ra chỉ lấy các file hình ảnh
        const imageFiles = response.data.filter((file: FileData) => 
          file.file_type.startsWith('image/')
        );
        
        setFiles(imageFiles);
        setFilteredFiles(imageFiles);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load gallery images.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFiles();
    }
  }, [user]);

  // Áp dụng bộ lọc và sắp xếp
  useEffect(() => {
    let result = [...files];
    
    // Áp dụng tìm kiếm
    if (searchTerm) {
      result = result.filter(file => 
        file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Áp dụng sắp xếp
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.file_name.localeCompare(b.file_name));
    }
    
    setFilteredFiles(result);
  }, [files, searchTerm, sortBy]);

  // Xác định nguồn ảnh
  const getImageSrc = (filePath: string) => {
    if (!filePath) {
      console.error('Empty file path provided');
      return '/placeholder-image.png';
    }

    try {
      // Ensure we have the correct path format
      const path = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`;
      const imageUrl = getFileUrl(path);
      console.log('Generated image URL:', imageUrl); // Debug log
      return imageUrl;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return '/placeholder-image.png';
    }
  };

  // Handle image load error
  const handleImageError = (fileId: number) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [fileId]: true
    }));
  };

  // Mở modal xem ảnh chi tiết
  const openImageModal = (file: FileData) => {
    setSelectedImage(file);
  };

  // Đóng modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Định dạng kích thước file
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Định dạng ngày tháng
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Thư viện ảnh</h1>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Thư viện ảnh</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thư viện ảnh</h1>
        <Link 
          href="/topics" 
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Trở về Topics
        </Link>
      </div>
      
      {/* Tìm kiếm và sắp xếp */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="gallery-search" className="sr-only">
            Tìm kiếm theo tên file
          </label>
          <input
            id="gallery-search"
            type="text"
            placeholder="Tìm kiếm theo tên file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Tìm kiếm ảnh theo tên file"
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="gallery-sort" className="sr-only">
            Sắp xếp ảnh
          </label>
          <select
            id="gallery-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            aria-label="Sắp xếp ảnh theo"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="name">Sắp xếp theo tên</option>
          </select>
        </div>
      </div>

      {/* Thông tin số lượng */}
      {files.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Hiển thị {filteredFiles.length} / {files.length} ảnh
          {searchTerm && ` • Từ khóa: "${searchTerm}"`}
        </div>
      )}

      {filteredFiles.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {files.length === 0 
              ? "Bạn chưa có ảnh nào trong thư viện."
              : "Không tìm thấy ảnh nào phù hợp với tìm kiếm của bạn."}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {files.length === 0 
              ? "Các ảnh bạn tải lên trong các bản ghi sẽ xuất hiện ở đây."
              : "Hãy thử với từ khóa khác hoặc xóa bộ lọc."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div 
              key={file.file_id} 
              className="relative group rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800"
              onClick={() => openImageModal(file)}
            >
              <div className="aspect-square relative">
                {imageLoadErrors[file.file_id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center">
                      Không thể tải ảnh
                    </span>
                  </div>
                ) : (
                  <img
                    src={getImageSrc(file.file_path)}
                    alt={file.file_name}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 bg-gray-100 block"
                    onError={(e) => {
                      console.error('Image load error:', file.file_path);
                      handleImageError(file.file_id);
                    }}
                    loading="lazy"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-end">
                <div className="p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-sm truncate">{file.file_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xem ảnh chi tiết */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={closeImageModal}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {selectedImage.file_name}
              </h3>
              <button 
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close image modal"
                title="Close image modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <div className="w-full max-h-[50vh] mb-4 flex justify-center bg-gray-100 dark:bg-gray-900 rounded">
                {imageLoadErrors[selectedImage.file_id] ? (
                  <div className="w-full h-[50vh] flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      Không thể tải ảnh. Nhấn vào 
                      <a 
                        href={getImageSrc(selectedImage.file_path)} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 mx-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        đây
                      </a> 
                      để thử mở trực tiếp.
                    </span>
                  </div>
                ) : (
                  <img
                    src={getImageSrc(selectedImage.file_path)}
                    alt={selectedImage.file_name}
                    className="max-h-full max-w-full object-contain p-2"
                    onError={() => handleImageError(selectedImage.file_id)}
                  />
                )}
              </div>
              
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Thông tin chi tiết</h4>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-gray-600 dark:text-gray-400">Tên file:</p>
                  <p className="text-gray-900 dark:text-white">{selectedImage.file_name}</p>
                  
                  <p className="text-gray-600 dark:text-gray-400">Loại file:</p>
                  <p className="text-gray-900 dark:text-white">{selectedImage.file_type}</p>
                  
                  <p className="text-gray-600 dark:text-gray-400">Kích thước:</p>
                  <p className="text-gray-900 dark:text-white">{formatFileSize(selectedImage.file_size)}</p>
                  
                  <p className="text-gray-600 dark:text-gray-400">Ngày tải lên:</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedImage.uploaded_at)}</p>
                  
                  <p className="text-gray-600 dark:text-gray-400">URL:</p>
                  <p className="text-gray-900 dark:text-white text-xs break-all">
                    {getImageSrc(selectedImage.file_path)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <Link 
                href={`/entries/${selectedImage.entry_id}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Xem bài viết chứa ảnh này
              </Link>
              <a 
                href={getImageSrc(selectedImage.file_path)} 
                download={selectedImage.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tải xuống
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;