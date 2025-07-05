import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const FileUpload = ({ conversationId, onFileUploaded, onClose }) => {
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const getFileType = (file) => {
    for (const [type, mimeTypes] of Object.entries(ALLOWED_TYPES)) {
      if (mimeTypes.includes(file.type)) {
        return type;
      }
    }
    return 'other';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'audio':
        return <Music className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    let hasError = false;

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 50MB.`);
        hasError = true;
        return;
      }

      const fileType = getFileType(file);
      if (fileType === 'other') {
        setError(`File type "${file.type}" is not supported.`);
        hasError = true;
        return;
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        type: fileType,
        name: file.name,
        size: file.size
      });
    });

    if (!hasError) {
      setError('');
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
  };

  const uploadFile = async (fileData) => {
    const { file, id, type } = fileData;
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `files/${conversationId}/${fileName}`);

    setUploadStatus(prev => ({ ...prev, [id]: 'uploading' }));

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadStatus(prev => ({ ...prev, [id]: 'error' }));
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadStatus(prev => ({ ...prev, [id]: 'completed' }));
            resolve({
              url: downloadURL,
              name: file.name,
              size: file.size,
              type: type
            });
          } catch (error) {
            setUploadStatus(prev => ({ ...prev, [id]: 'error' }));
            reject(error);
          }
        }
      );
    });
  };

  const handleUploadAll = async () => {
    if (!conversationId) {
      setError('No conversation selected');
      return;
    }

    try {
      const uploadPromises = selectedFiles.map(async (fileData) => {
        try {
          const result = await uploadFile(fileData);
          
          // Send file message
          await sendMessage(conversationId, JSON.stringify({
            fileName: result.name,
            fileUrl: result.url,
            fileSize: result.size,
            fileType: result.type
          }), 'file');

          return result;
        } catch (error) {
          console.error(`Error uploading ${fileData.name}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      
      if (onFileUploaded) {
        onFileUploaded();
      }
      
      // Clear files after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadStatus({});
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      setError('Some files failed to upload. Please try again.');
    }
  };

  const allFilesCompleted = selectedFiles.length > 0 && 
    selectedFiles.every(f => uploadStatus[f.id] === 'completed');

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload Files</h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">
            Support for images, videos, audio, and documents up to 50MB
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Select Files
          </Button>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
            {selectedFiles.map((fileData) => (
              <div key={fileData.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-blue-600">
                  {getFileIcon(fileData.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileData.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(fileData.size)}</p>
                  
                  {/* Progress bar */}
                  {uploadProgress[fileData.id] !== undefined && (
                    <div className="mt-2">
                      <Progress value={uploadProgress[fileData.id]} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(uploadProgress[fileData.id])}%
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  {uploadStatus[fileData.id] === 'completed' && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {uploadStatus[fileData.id] === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  {!uploadStatus[fileData.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {selectedFiles.length > 0 && !allFilesCompleted && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedFiles([])}>
              Clear All
            </Button>
            <Button onClick={handleUploadAll}>
              Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {allFilesCompleted && (
          <div className="text-center text-green-600">
            <Check className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">All files uploaded successfully!</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;

