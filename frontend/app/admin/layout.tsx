"use client"

import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NotificationProvider } from '../contexts/NotificationContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the current path is the login page
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    router.push('/');
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        if (!isLoginPage) {
          router.push('/admin/login');
        }
        return;
      }

      try {
        const userData = JSON.parse(user);
        if (userData.role === 'ADMIN' || userData.role === 'MANAGER') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!isLoginPage) {
            router.push('/admin/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isLoginPage, router]);

  // Loading durumunda
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If it's the login page, only render the children without the admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Authenticated olmayan kullanıcılar için
  if (!isAuthenticated) {
    return null;
  }

  // Otherwise, render the full admin layout with sidebar
  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
          </div>
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin/dashboard"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/dashboard' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/orders"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/orders' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Siparişler</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/users"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/users' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Kullanıcılar</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/tables"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/tables' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Masalar</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/menu"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/menu' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Menü</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/stock"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/stock' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Stok</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/suppliers"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/suppliers' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Tedarikçiler</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/reports"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/reports' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Raporlar</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/settings"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/settings' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ayarlar</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/printer-debug"
                  className={`flex items-center space-x-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg ${pathname === '/admin/printer-debug' ? 'bg-blue-50 text-blue-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Yazıcı Debug</span>
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Çıkış Yap</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </main>
      </div>
    </NotificationProvider>
  )
} 