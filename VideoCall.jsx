import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';

const VideoCall = ({ otherUser, onEndCall, callType = 'video' }) => {
  const { currentUser } = useAuth();
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // Initialize WebRTC
  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      callStartTimeRef.current = Date.now();
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setCallStatus('ended');
        }
      };

      // Simulate connection for demo (in real app, you'd use signaling server)
      setTimeout(() => {
        setCallStatus('connected');
      }, 2000);

    } catch (error) {
      console.error('Error initializing call:', error);
      setCallStatus('ended');
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share end
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack);
            }
          }
        };
      } else {
        // Stop screen sharing and switch back to camera
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && cameraTrack) {
          await sender.replaceTrack(cameraTrack);
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const endCall = () => {
    cleanup();
    setCallStatus('ended');
    onEndCall?.();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  if (callStatus === 'ended') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Call Ended</h3>
          <p className="text-gray-600 mb-4">
            Call duration: {formatDuration(callDuration)}
          </p>
          <Button onClick={onEndCall}>Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${isFullscreen ? 'p-0' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-gray-600 text-white">
              {getInitials(otherUser?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser?.displayName}</h3>
            <p className="text-sm text-gray-300">
              {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Remote User Placeholder */}
        {callStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback className="bg-gray-600 text-white text-2xl">
                  {getInitials(otherUser?.displayName)}
                </AvatarFallback>
              </Avatar>
              <p className="text-lg">Connecting to {otherUser?.displayName}...</p>
            </div>
          </div>
        )}

        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white">
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser?.photoURL} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {getInitials(currentUser?.displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 p-6 bg-black bg-opacity-50">
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        {callType === 'video' && (
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
        )}

        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
          className="rounded-full w-14 h-14"
        >
          <Monitor className="h-6 w-6" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={endCall}
          className="rounded-full w-14 h-14"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;

