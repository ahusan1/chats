import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  UserPlus, 
  MessageCircle, 
  CheckCircle, 
  Shield,
  Clock,
  UserCheck
} from 'lucide-react';

const FriendSearch = ({ onStartChat }) => {
  const { currentUser, userProfile } = useAuth();
  const { getOrCreateConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const searchUser = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a username');
      return;
    }

    if (searchQuery === userProfile?.username) {
      setError('You cannot search for yourself');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);

    try {
      // First check if username exists
      const usernameDoc = await getDoc(doc(db, 'usernames', searchQuery));
      
      if (!usernameDoc.exists()) {
        setError('User not found');
        return;
      }

      const userId = usernameDoc.data().uid;
      
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        setSearchResult({ id: userId, ...userDoc.data() });
      } else {
        setError('User profile not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setError('Error searching for user');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchResult || !currentUser) return;

    setActionLoading(true);
    try {
      // Add to current user's sent requests
      await updateDoc(doc(db, 'users', currentUser.uid), {
        sentRequests: arrayUnion(searchResult.id)
      });

      // Add to target user's friend requests
      await updateDoc(doc(db, 'users', searchResult.id), {
        friendRequests: arrayUnion(currentUser.uid)
      });

      setSearchResult(prev => ({ ...prev, requestSent: true }));
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Error sending friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const startChat = async () => {
    if (!searchResult || !currentUser) return;

    setActionLoading(true);
    try {
      const conversationId = await getOrCreateConversation(searchResult.id);
      if (conversationId && onStartChat) {
        onStartChat(searchResult);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Error starting chat');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getRelationshipStatus = () => {
    if (!searchResult || !userProfile) return 'none';
    
    if (userProfile.friends?.includes(searchResult.id)) return 'friend';
    if (userProfile.sentRequests?.includes(searchResult.id)) return 'sent';
    if (userProfile.friendRequests?.includes(searchResult.id)) return 'received';
    if (searchResult.requestSent) return 'sent';
    
    return 'none';
  };

  const relationshipStatus = getRelationshipStatus();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && searchUser()}
          />
        </div>
        <Button 
          onClick={searchUser} 
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Result */}
      {searchResult && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={searchResult.avatar} />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitials(searchResult.displayName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold">{searchResult.displayName}</h3>
                  {searchResult.isVerified && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                  {searchResult.isAdmin && (
                    <Shield className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <p className="text-gray-600">@{searchResult.username}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className={`h-2 w-2 rounded-full ${
                    searchResult.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-500">
                    {searchResult.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                {relationshipStatus === 'friend' && (
                  <>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <UserCheck className="h-3 w-3" />
                      <span>Friends</span>
                    </Badge>
                    <Button 
                      onClick={startChat}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}

                {relationshipStatus === 'sent' && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Request Sent</span>
                  </Badge>
                )}

                {relationshipStatus === 'received' && (
                  <div className="space-y-2">
                    <Badge className="flex items-center space-x-1">
                      <UserPlus className="h-3 w-3" />
                      <span>Wants to be friends</span>
                    </Badge>
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">Accept</Button>
                      <Button size="sm" variant="outline" className="flex-1">Decline</Button>
                    </div>
                  </div>
                )}

                {relationshipStatus === 'none' && (
                  <div className="space-y-2">
                    <Button 
                      onClick={sendFriendRequest}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                    <Button 
                      onClick={startChat}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!searchResult && !loading && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Find Friends</h3>
            <p className="text-sm">
              Search for friends by their username to connect and start chatting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FriendSearch;

