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
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href={user ? '/topics' : '/'} className="text-xl font-bold">
          Journal App
        </Link>
        
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">
              Logged in as: <strong>{user.username}</strong>
            </span>
            <Link href="/topics" className="text-blue-500 hover:underline">
              My Topics
            </Link>
            <Link href="/profile" className="text-blue-500 hover:underline">
              Profile
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Login
            </Link>
            <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
