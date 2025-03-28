import React from 'react'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Home
            </Link>
            <h1 className="text-2xl font-bold text-stone-800">Admin Dashboard</h1>
            <form action="/auth/signout" method="post">
              <button 
                type="submit"
                className="px-4 py-2 bg-stone-600 text-white rounded-md hover:bg-stone-700"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4">
          <nav>
            <ul className="flex gap-1">
              <li>
                <Link 
                  href="/admin/products" 
                  className="inline-block px-6 py-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/quotes" 
                  className="inline-block px-6 py-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                >
                  Quote Requests
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 