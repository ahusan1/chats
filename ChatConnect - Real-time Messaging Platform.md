# ChatConnect - Real-time Messaging Platform

A comprehensive real-time messaging web application built with React and Firebase, featuring video/audio calls, file sharing, friend management, and admin controls.

## 🚀 Features

### Core Messaging
- **Real-time messaging** with Firebase Firestore
- **Message history** and pagination
- **Read receipts** and message status indicators
- **Typing indicators** and online status
- **Message search** and conversation filtering

### Authentication & User Management
- **Secure user registration** with email/password
- **Password validation** with strength requirements
- **Username-based user search** and friend finding
- **Single session enforcement** to prevent multiple logins
- **User profiles** with avatars and status

### Video & Audio Calling
- **WebRTC-based video calls** with peer-to-peer connection
- **Audio-only calls** with beautiful UI
- **Call controls**: mute, camera toggle, screen sharing
- **Call duration tracking** and call history
- **Incoming call notifications** with accept/reject options

### File Sharing & Media
- **File upload** to Firebase Storage (up to 50MB)
- **Multiple file types**: images, videos, audio, documents
- **Media preview** and download functionality
- **Progress tracking** during uploads
- **File type validation** and size limits

### Friend System
- **Friend requests** and acceptance/rejection
- **Friend list management** with online status
- **User search by username** with verification badges
- **Contact management** and friend removal

### Admin Panel
- **User management** with verification controls
- **Admin privileges** assignment and removal
- **User statistics** and system overview
- **User moderation** tools and account deletion
- **Blue tick verification** system

### Security Features
- **Firebase Authentication** integration
- **Session management** with single login enforcement
- **Admin-only access** to management features
- **Secure file storage** with Firebase Storage
- **Input validation** and sanitization

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Real-time Communication**: WebRTC, Firebase Realtime Database
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite with hot module replacement

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd messaging-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Update `src/lib/firebase.js` with your Firebase configuration

4. **Set up Firebase Security Rules**

   **Firestore Rules** (`firestore.rules`):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         allow read: if request.auth != null; // Allow reading other users for search
       }
       
       // Username reservations
       match /usernames/{username} {
         allow read, write: if request.auth != null;
       }
       
       // Conversations
       match /conversations/{conversationId} {
         allow read, write: if request.auth != null && 
           request.auth.uid in resource.data.participants;
       }
       
       // Messages
       match /messages/{messageId} {
         allow read, write: if request.auth != null;
       }
       
       // Active sessions
       match /activeSessions/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

   **Storage Rules** (`storage.rules`):
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /files/{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

## 🚀 Deployment

### Option 1: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase: `firebase init hosting`
4. Build the project: `npm run build`
5. Deploy: `firebase deploy`

### Option 2: Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Build the project: `npm run build`
3. Deploy: `vercel --prod`

### Option 3: Netlify
1. Build the project: `npm run build`
2. Drag and drop the `dist` folder to Netlify
3. Or connect your Git repository for automatic deployments

## 📱 Usage

### For Regular Users
1. **Register** with email, username, and strong password
2. **Search for friends** using their username
3. **Send friend requests** and manage your friend list
4. **Start conversations** and send messages
5. **Make video/audio calls** with friends
6. **Share files** and media in conversations

### For Administrators
1. **Access admin panel** from the sidebar (admin users only)
2. **Manage users**: verify accounts, assign admin roles
3. **View system statistics** and user activity
4. **Moderate content** and manage user accounts

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Configuration
Update `src/lib/firebase.js` with your Firebase project credentials.

## 🎨 Customization

### Styling
- Modify `src/App.css` for global styles
- Update Tailwind configuration in `tailwind.config.js`
- Customize UI components in `src/components/ui/`

### Features
- Add new message types in `src/contexts/ChatContext.jsx`
- Extend user profile fields in `src/contexts/AuthContext.jsx`
- Add new admin features in `src/components/admin/AdminPanel.jsx`

## 🐛 Troubleshooting

### Common Issues

1. **Firebase permissions error**
   - Ensure Firestore security rules are properly configured
   - Check that Authentication is enabled in Firebase Console

2. **WebRTC connection issues**
   - Ensure HTTPS is used in production
   - Check browser permissions for camera/microphone

3. **File upload failures**
   - Verify Firebase Storage is enabled
   - Check file size limits (50MB max)
   - Ensure storage security rules allow uploads

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## 🔮 Future Enhancements

- **Group chats** and channels
- **Message encryption** for enhanced security
- **Push notifications** for mobile devices
- **Voice messages** and audio recording
- **Message reactions** and emoji responses
- **Dark mode** theme support
- **Mobile app** development with React Native
- **Advanced admin analytics** and reporting

