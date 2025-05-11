'use client';
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href={user ? '/topics' : '/'} className="text-xl font-bold">
          Journal App
        </Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Logged in as: <strong>{user.username}</strong>
            </span>
            <Link href="/profile" className="text-blue-500 hover:underline">
              Edit Profile
            </Link>
            <button 
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
