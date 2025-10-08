import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Mail,
  Users,
  MessageSquare,
  Menu,
  X,
  Sun,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/role';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();

  // Normalize role values using shared helper
  const rawRole = (userRole ?? (user as any)?.role) as any;
  const admin = isAdmin(rawRole);

  // layout intentionally does not redirect; AppContent decides whether to show Login

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-[#00A86B]' },
    { id: 'categories', label: 'Categories', icon: FolderOpen, color: 'text-[#0077B6]' },
    { id: 'articles', label: 'Articles', icon: FileText, color: 'text-[#00A86B]' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'text-[#0077B6]' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, color: 'text-[#FFD700]' },
    { id: 'users', label: 'Users', icon: Users, color: 'text-[#FFD700]' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-lg">
            <Sun className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl text-gray-900">Quantum Solar</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-xl z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#FFD700] to-[#FFC700] rounded-xl shadow-lg">
              <Sun className="text-white" size={32} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">Quantum Solar</h1>
              <p className="text-xs text-gray-500">Energy CMS</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00A86B]/10 to-[#00A86B]/5 text-[#00A86B] font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={isActive ? item.color : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500">
              {admin ? '🛡️ Administrator' : '✍️ Publisher'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 min-h-screen">
        <div className="pt-20 lg:pt-0 p-6 lg:p-8">{children}</div>
        <footer className="border-t border-gray-200 bg-white p-6 text-center text-gray-600 text-sm">
          © 2025 Quantum Solar Energy — All rights reserved.
        </footer>
      </main>
    </div>
  );
};
