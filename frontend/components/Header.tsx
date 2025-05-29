'use client';
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFileUrl } from "../lib/file-utils";

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md py-4 sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center">        <Link href={user ? '/topics' : '/'} className="text-xl font-bold text-blue-600 dark:text-blue-400 transition-colors">
          Journal App
        </Link>
        
        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-pulse h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>        ) : user ? (
          <div className="flex items-center gap-6">            <div className="flex items-center gap-3">
              {user.profile_image_url && (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src={getFileUrl(user.profile_image_url)} 
                    alt={user.username}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <span className="text-sm hidden sm:inline text-gray-600 dark:text-gray-300">
                Welcome, <strong className="font-medium">{user.username}</strong>
              </span>
            </div>            <nav className="flex items-center gap-4">
              <Link 
                href="/topics" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                My Topics
              </Link>
              <Link 
                href="/gallery" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Gallery
              </Link>
              <Link 
                href="/ai" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                <span className="mr-1">AI</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M16.5 7.5h-9v9h9v-9z" />
                  <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link 
                href="/profile" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>        ) : (          <div className="flex gap-3">            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 !text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors shadow-md"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 !text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors shadow-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
