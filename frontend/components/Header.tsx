'use client';
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
          </div>
        ) : user ? (
          <div className="flex items-center gap-6">
            <span className="text-sm hidden sm:inline text-gray-600 dark:text-gray-300">
              Welcome, <strong className="font-medium">{user.username}</strong>
            </span>
            <nav className="flex items-center gap-4">              <Link 
                href="/topics" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                My Topics
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors shadow-md"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors shadow-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
