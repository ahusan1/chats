import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  Check, 
  X,
  CheckCircle,
  Shield,
  Clock
} from 'lucide-react';

const FriendsList = ({ onStartChat }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { getOrCreateConversation } = useChat();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchFriendsData();
    }
  }, [userProfile]);

  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      
      // Fetch friends
      if (userProfile.friends?.length > 0) {
        const friendsData = await Promise.all(
          userProfile.friends.map(async (friendId) => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            return friendDoc.exists() ? { id: friendId, ...friendDoc.data() } : null;
          })
        );
        setFriends(friendsData.filter(Boolean));
      } else {
        setFriends([]);
      }

      // Fetch friend requests
      if (userProfile.friendRequests?.length > 0) {
        const requestsData = await Promise.all(
          userProfile.friendRequests.map(async (requesterId) => {
            const requesterDoc = await getDoc(doc(db, 'users', requesterId));
            return requesterDoc.exists() ? { id: requesterId, ...requesterDoc.data() } : null;
          })
        );
        setFriendRequests(requestsData.filter(Boolean));
      } else {
        setFriendRequests([]);
      }

      // Fetch sent requests
      if (userProfile.sentRequests?.length > 0) {
        const sentData = await Promise.all(
          userProfile.sentRequests.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? { id: userId, ...userDoc.data() } : null;
          })
        );
        setSentRequests(sentData.filter(Boolean));
      } else {
        setSentRequests([]);
      }

    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      // Add to current user's friends
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayUnion(requesterId),
        friendRequests: arrayRemove(requesterId)
      });

      // Add to requester's friends and remove from sent requests
      await updateDoc(doc(db, 'users', requesterId), {
        friends: arrayUnion(currentUser.uid),
        sentRequests: arrayRemove(currentUser.uid)
      });

      // Update local state
      const acceptedUser = friendRequests.find(user => user.id === requesterId);
      if (acceptedUser) {
        setFriends(prev => [...prev, acceptedUser]);
        setFriendRequests(prev => prev.filter(user => user.id !== requesterId));
      }

      // Update user profile
      await updateUserProfile({
        friends: [...(userProfile.friends || []), requesterId],
        friendRequests: (userProfile.friendRequests || []).filter(id => id !== requesterId)
      });

    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (requesterId) => {
    try {
      // Remove from current user's friend requests
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friendRequests: arrayRemove(requesterId)
      });

      // Remove from requester's sent requests
      await updateDoc(doc(db, 'users', requesterId), {
        sentRequests: arrayRemove(currentUser.uid)
      });

      // Update local state
      setFriendRequests(prev => prev.filter(user => user.id !== requesterId));

      // Update user profile
      await updateUserProfile({
        friendRequests: (userProfile.friendRequests || []).filter(id => id !== requesterId)
      });

    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      // Remove from current user's friends
      await updateDoc(doc(db, 'users', currentUser.uid), {
        friends: arrayRemove(friendId)
      });

      // Remove from friend's friends
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(currentUser.uid)
      });

      // Update local state
      setFriends(prev => prev.filter(friend => friend.id !== friendId));

      // Update user profile
      await updateUserProfile({
        friends: (userProfile.friends || []).filter(id => id !== friendId)
      });

    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const cancelSentRequest = async (userId) => {
    try {
      // Remove from current user's sent requests
      await updateDoc(doc(db, 'users', currentUser.uid), {
        sentRequests: arrayRemove(userId)
      });

      // Remove from target user's friend requests
      await updateDoc(doc(db, 'users', userId), {
        friendRequests: arrayRemove(currentUser.uid)
      });

      // Update local state
      setSentRequests(prev => prev.filter(user => user.id !== userId));

      // Update user profile
      await updateUserProfile({
        sentRequests: (userProfile.sentRequests || []).filter(id => id !== userId)
      });

    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const startChat = async (friend) => {
    try {
      const conversationId = await getOrCreateConversation(friend.id);
      if (conversationId && onStartChat) {
        onStartChat(friend);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const UserCard = ({ user, actions }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold truncate">{user.displayName}</h4>
              {user.isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-600" />
              )}
              {user.isAdmin && (
                <Shield className="h-4 w-4 text-purple-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">@{user.username}</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`h-2 w-2 rounded-full ${
                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-gray-500">
                {user.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="friends">
          Friends ({friends.length})
        </TabsTrigger>
        <TabsTrigger value="requests">
          Requests ({friendRequests.length})
        </TabsTrigger>
        <TabsTrigger value="sent">
          Sent ({sentRequests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="friends" className="mt-4">
        {friends.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
              <p className="text-sm">Start by searching for friends to connect with!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <UserCard
                key={friend.id}
                user={friend}
                actions={
                  <>
                    <Button
                      size="sm"
                      onClick={() => startChat(friend)}
                      className="w-full"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFriend(friend.id)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="requests" className="mt-4">
        {friendRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No friend requests</h3>
              <p className="text-sm">You'll see incoming friend requests here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {friendRequests.map((requester) => (
              <UserCard
                key={requester.id}
                user={requester}
                actions={
                  <>
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(requester.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectFriendRequest(requester.id)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sent" className="mt-4">
        {sentRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-sm">Friend requests you've sent will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sentRequests.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                actions={
                  <>
                    <Badge variant="outline" className="w-full justify-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelSentRequest(user.id)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default FriendsList;

