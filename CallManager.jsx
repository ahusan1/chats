import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import VideoCall from './VideoCall';
import AudioCall from './AudioCall';

const CallManager = () => {
  const { currentUser } = useAuth();
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'

  // Simulate incoming call (in real app, this would come from signaling server)
  useEffect(() => {
    // Demo: simulate an incoming call after 10 seconds
    const timer = setTimeout(() => {
      if (!activeCall && !incomingCall) {
        setIncomingCall({
          id: 'demo-call',
          caller: {
            displayName: 'Demo User',
            username: 'demouser',
            avatar: null
          },
          type: 'video'
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeCall, incomingCall]);

  const startCall = (otherUser, type = 'video') => {
    setActiveCall({
      id: `call-${Date.now()}`,
      otherUser,
      type,
      status: 'outgoing'
    });
    setCallType(type);
  };

  const acceptCall = () => {
    if (incomingCall) {
      setActiveCall({
        id: incomingCall.id,
        otherUser: incomingCall.caller,
        type: incomingCall.type,
        status: 'incoming'
      });
      setCallType(incomingCall.type);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  const endCall = () => {
    setActiveCall(null);
    setCallType(null);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  // Render active call
  if (activeCall) {
    if (callType === 'video') {
      return (
        <VideoCall
          otherUser={activeCall.otherUser}
          onEndCall={endCall}
          callType="video"
        />
      );
    } else {
      return (
        <AudioCall
          otherUser={activeCall.otherUser}
          onEndCall={endCall}
        />
      );
    }
  }

  // Render incoming call notification
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-96 p-6 text-center">
          <div className="mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={incomingCall.caller.avatar} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials(incomingCall.caller.displayName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mb-2">
              {incomingCall.caller.displayName}
            </h3>
            <p className="text-gray-600">
              Incoming {incomingCall.type} call...
            </p>
          </div>

          {/* Ringing animation */}
          <div className="mb-6">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 animate-ping"></div>
              <div className="relative w-full h-full rounded-full bg-blue-600 flex items-center justify-center">
                {incomingCall.type === 'video' ? (
                  <Video className="h-6 w-6 text-white" />
                ) : (
                  <Phone className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Call controls */}
          <div className="flex justify-center space-x-6">
            <Button
              variant="destructive"
              size="lg"
              onClick={rejectCall}
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={acceptCall}
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
            >
              {incomingCall.type === 'video' ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Return null when no calls are active
  return null;
};

// Hook to use call functionality
export const useCall = () => {
  const [callManager, setCallManager] = useState(null);

  const startVideoCall = (otherUser) => {
    if (callManager) {
      callManager.startCall(otherUser, 'video');
    }
  };

  const startAudioCall = (otherUser) => {
    if (callManager) {
      callManager.startCall(otherUser, 'audio');
    }
  };

  return {
    startVideoCall,
    startAudioCall,
    setCallManager
  };
};

export default CallManager;

