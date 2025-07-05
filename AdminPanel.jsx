import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search,
  BarChart3,
  MessageSquare,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle
} from 'lucide-react';

const AdminPanel = ({ onClose }) => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    onlineUsers: 0
  });
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (userProfile?.isAdmin) {
      fetchUsers();
    }
  }, [userProfile]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersData);
      setFilteredUsers(usersData);

      // Calculate stats
      const totalUsers = usersData.length;
      const verifiedUsers = usersData.filter(user => user.isVerified).length;
      const adminUsers = usersData.filter(user => user.isAdmin).length;
      const onlineUsers = usersData.filter(user => user.status === 'online').length;

      setStats({
        totalUsers,
        verifiedUsers,
        adminUsers,
        onlineUsers
      });

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, updates) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      
      await updateDoc(doc(db, 'users', userId), updates);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));

      // Recalculate stats
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      );
      
      const verifiedUsers = updatedUsers.filter(user => user.isVerified).length;
      const adminUsers = updatedUsers.filter(user => user.isAdmin).length;
      
      setStats(prev => ({
        ...prev,
        verifiedUsers,
        adminUsers
      }));

    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      
      await deleteDoc(doc(db, 'users', userId));
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1
      }));

    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (!userProfile?.isAdmin) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage users and system settings</p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Back to Chat
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.verifiedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admin Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-white rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Now</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.onlineUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={fetchUsers} disabled={loading}>
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{user.displayName}</h4>
                          {user.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                          {user.isAdmin && (
                            <Shield className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{user.username} • {user.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <div className={`h-2 w-2 rounded-full ${
                              user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="text-xs text-gray-500">
                              {user.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            Joined {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Verification Toggle */}
                      <Button
                        size="sm"
                        variant={user.isVerified ? "default" : "outline"}
                        onClick={() => updateUserStatus(user.id, { isVerified: !user.isVerified })}
                        disabled={actionLoading[user.id]}
                        className={user.isVerified ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {user.isVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>

                      {/* Admin Toggle */}
                      <Button
                        size="sm"
                        variant={user.isAdmin ? "default" : "outline"}
                        onClick={() => updateUserStatus(user.id, { isAdmin: !user.isAdmin })}
                        disabled={actionLoading[user.id]}
                        className={user.isAdmin ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {user.isAdmin ? (
                          <>
                            <Crown className="h-4 w-4 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-1" />
                            Make Admin
                          </>
                        )}
                      </Button>

                      {/* Delete User */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(user.id)}
                        disabled={actionLoading[user.id]}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;

