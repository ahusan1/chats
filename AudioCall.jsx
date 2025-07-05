import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mic, 
  MicOff, 
  PhoneOff,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

const AudioCall = ({ otherUser, onEndCall }) => {
  const { currentUser } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);

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
      // Get user media (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      localStreamRef.current = stream;

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

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    // In a real app, you would change the audio output device here
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center z-50">
      <Card className="w-96 p-8 text-center bg-white bg-opacity-10 backdrop-blur-lg border-white border-opacity-20">
        {/* User Avatar */}
        <div className="mb-6">
          <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-white ring-opacity-30">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-white bg-opacity-20 text-white text-3xl">
              {getInitials(otherUser?.displayName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {otherUser?.displayName}
          </h2>
          <p className="text-white text-opacity-80">
            {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
          </p>
        </div>

        {/* Call Status Indicator */}
        {callStatus === 'connecting' && (
          <div className="mb-6">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Audio Visualization */}
        {callStatus === 'connected' && (
          <div className="mb-6">
            <div className="flex justify-center items-end space-x-1 h-12">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-white rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-16 h-16 bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30"
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white" />
            )}
          </Button>

          <Button
            variant={isSpeakerEnabled ? "secondary" : "outline"}
            size="lg"
            onClick={toggleSpeaker}
            className="rounded-full w-16 h-16 bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30"
          >
            {isSpeakerEnabled ? (
              <Volume2 className="h-6 w-6 text-white" />
            ) : (
              <VolumeX className="h-6 w-6 text-white" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Settings */}
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white text-opacity-70 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AudioCall;

