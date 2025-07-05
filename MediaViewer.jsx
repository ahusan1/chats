import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  File,
  Image,
  Video,
  Music
} from 'lucide-react';

const MediaViewer = ({ fileData, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!fileData) return null;

  const { fileName, fileUrl, fileSize, fileType } = fileData;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const renderMediaContent = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              className="absolute top-2 right-2"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-96 rounded-lg"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
            <div className="p-3 bg-blue-600 rounded-full">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{fileName}</h4>
              <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
              <audio
                src={fileUrl}
                controls
                className="w-full mt-2"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
            <div className="p-3 bg-gray-600 rounded-full">
              <File className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{fileName}</h4>
              <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Click download to view this file
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              {fileType === 'image' && <Image className="h-5 w-5 text-white" />}
              {fileType === 'video' && <Video className="h-5 w-5 text-white" />}
              {fileType === 'audio' && <Music className="h-5 w-5 text-white" />}
              {!['image', 'video', 'audio'].includes(fileType) && <File className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold">{fileName}</h3>
              <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderMediaContent()}
        </div>

        {/* Footer with additional controls for media files */}
        {(fileType === 'video' || fileType === 'audio') && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {fileType === 'video' ? 'Video' : 'Audio'} • {formatFileSize(fileSize)}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Component for displaying file messages in chat
export const FileMessage = ({ fileData, onClick }) => {
  if (!fileData) return null;

  const { fileName, fileSize, fileType } = fileData;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getFileColor = () => {
    switch (fileType) {
      case 'image':
        return 'bg-green-600';
      case 'video':
        return 'bg-red-600';
      case 'audio':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center space-x-3 p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors max-w-xs"
    >
      <div className={`p-2 rounded-lg ${getFileColor()}`}>
        <div className="text-white">
          {getFileIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{fileName}</p>
        <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
      </div>
    </div>
  );
};

export default MediaViewer;

