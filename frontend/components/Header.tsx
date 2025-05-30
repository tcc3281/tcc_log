'use client';
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getFileUrl } from "../lib/file-utils";
import AIStatus from "./AI/AIStatus";

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
              </Link>              <Link 
                href="/ai" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                <span className="mr-1">Chat</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 001.28.53l4.184-4.183a.39.39 0 01.266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0012 2.25z" clipRule="evenodd" />
                </svg>
              </Link>
              <div className="ml-2">
                <AIStatus />
              </div>
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
