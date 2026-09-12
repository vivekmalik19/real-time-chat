import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UserList from './components/UserList';
import AuthModal from './components/AuthModal';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-xl shadow-brand-500/30 animate-pulse">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
          <span>Starting PulseChat...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="flex h-screen w-screen bg-dark-bg overflow-hidden text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <ChatArea
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleMembers={() => setIsMembersOpen((prev) => !prev)}
        isMembersOpen={isMembersOpen}
      />

      {/* Right Members Drawer */}
      <UserList
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
      />

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}
    </div>
  );
}
