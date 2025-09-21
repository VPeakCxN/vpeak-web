'use client';

import { createClient } from '@supabase/supabase-js';
import { PostCard } from '@/components/posts/PostCard';
import type { Database } from '@/lib/database.types';
import { AuthSession } from '@/lib/cookies.types';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let isAuthenticated = false;
  let currentUserId: string | null = null;
  let userName = 'User';

  // Parse session (in real app, this would come from cookies)
  if (session) {
    isAuthenticated = true;
    currentUserId = session.uid;
    userName = session.user_metadata?.name || session.email?.split('@')[0] || 'User';
  }

  useEffect(() => {
    // In a real app, you'd fetch this from cookies/auth
    // For demo purposes, using mock session
    setSession({
      uid: 'demo-user',
      email: 'demo@example.com',
      user_metadata: { name: 'Alex' }
    } as AuthSession);

    // Mock posts for demo
    setPosts([
      {
        post_id: '1',
        title: 'First Post',
        content: 'This is a sample post',
        created_at: new Date().toISOString(),
        author_id: 'demo-user'
      },
      {
        post_id: '2',
        title: 'Another Post',
        content: 'Another sample post for the feed',
        created_at: new Date().toISOString(),
        author_id: 'demo-user'
      }
    ]);
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
            <div className="text-red-500">
              Error loading posts: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full shadow-lg border transition-all duration-300 hover:scale-110 ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isDark ? (
            // Sun icon
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
          ) : (
            // Moon icon
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-2xl mx-auto pt-6 px-4">
        
        {/* Tweet Composer */}
        <div className={`rounded-xl shadow-sm border mb-6 overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Composer Content */}
              <div className="flex-1">
                <Link href="/posts/create" className="block">
                  <div className="group cursor-pointer">
                    <div className={`text-xl transition-colors mb-4 ${
                      isDark 
                        ? 'text-gray-400 group-hover:text-gray-300' 
                        : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      Hi {userName}, what's on your mind today?
                    </div>
                    
                    {/* Action Area */}
                    <div className={`flex items-center justify-between pt-4 border-t transition-colors ${
                      isDark ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <div className="flex items-center space-x-4 text-blue-500">
                        {/* Icons */}
                        <div className="w-5 h-5 opacity-60 group-hover:opacity-80 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5C5.224 5 5 5.224 5 5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13z"/>
                            <path d="M11 7h2v10h-2V7zM7 11h10v2H7v-2z"/>
                          </svg>
                        </div>
                        <div className="w-5 h-5 opacity-60 group-hover:opacity-80 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5C5.224 5 5 5.224 5 5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13z"/>
                            <circle cx="15.5" cy="9.5" r="1.5"/>
                            <path d="M7 15.5l3-3 2.5 2.5 3-3 3.5 3.5V18.5c0 .276-.224.5-.5.5H7.5c-.276 0-.5-.224-.5-.5v-3z"/>
                          </svg>
                        </div>
                        <div className="w-5 h-5 opacity-60 group-hover:opacity-80 transition-opacity">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
                            <path d="M10 8h4v8h-4z"/>
                            <path d="M8 10h8v4H8z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Post Button */}
                      <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-105">
                        <div className="flex items-center space-x-2">
                          <span>Post</span>
                          <div className="w-4 h-4">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C13.1 2 14 2.9 14 4V11H21C21.6 11 22 11.4 22 12S21.6 13 21 13H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V13H3C2.4 13 2 12.6 2 12S2.4 11 3 11H10V4C10 2.9 10.9 2 12 2Z"/>
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className={`rounded-xl shadow-sm border p-8 text-center transition-colors duration-300 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No posts yet</div>
              <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Be the first to share something!</div>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.post_id} className={`rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 ${
                isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200'
              }`}>
                <div className="p-6">
                  <div className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {post.title}
                  </div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {post.content}
                  </div>
                  <div className={`text-sm mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Bottom spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}