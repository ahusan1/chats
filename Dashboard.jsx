import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { useSessionManager } from '../hooks/useSessionManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  Settings, 
  LogOut, 
  Users, 
  Search,
  Shield,
  CheckCircle
} from 'lucide-react';
import ConversationList from './chat/ConversationList';
import ChatWindow from './chat/ChatWindow';
import FriendSearch from './friends/FriendSearch';

const DashboardContent = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Use session manager to enforce single login
  useSessionManager();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const handleSelectConversation = (user) => {
    setSelectedUser(user);
    setActiveTab('chats');
  };

  const handleStartChat = (user) => {
    setSelectedUser(user);
    setActiveTab('chats');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* User Profile Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile?.avatar} />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(userProfile?.displayName || currentUser?.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold truncate">
                  {userProfile?.displayName || currentUser?.displayName}
                </h2>
                {userProfile?.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
                {userProfile?.isAdmin && (
                  <Shield className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">
                @{userProfile?.username}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <Button
            variant={activeTab === 'chats' ? 'default' : 'ghost'}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab('chats')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button
            variant={activeTab === 'friends' ? 'default' : 'ghost'}
            className="flex-1 rounded-none"
            onClick={() => setActiveTab('friends')}
          >
            <Users className="h-4 w-4 mr-2" />
            Friends
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={activeTab === 'chats' ? 'Search conversations...' : 'Search friends...'}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? (
            <div className="px-4">
              <ConversationList onSelectConversation={handleSelectConversation} />
            </div>
          ) : (
            <div className="px-4">
              <FriendSearch onStartChat={handleStartChat} />
            </div>
          )}
        </div>

        {/* Admin Panel Access */}
        {userProfile?.isAdmin && (
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveTab('admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatWindow otherUser={selectedUser} />
        ) : (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold">ChatConnect</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <Card className="w-96">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-600 rounded-full">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle>Welcome to ChatConnect!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">
                    Your real-time messaging platform is ready. Start by finding friends or selecting a conversation.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('friends')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Find Friends
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('chats')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Chats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <ChatProvider>
      <DashboardContent />
    </ChatProvider>
  );
};

export default Dashboard;

