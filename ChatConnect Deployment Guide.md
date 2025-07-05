# ChatConnect Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Storage**
   - **Hosting** (optional)

### 2. Configure Firebase Security Rules

**Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

**Storage Rules:**
```bash
firebase deploy --only storage
```

### 3. Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy
firebase deploy
```

### 4. Alternative Deployment Options

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Netlify
1. Build: `npm run build`
2. Upload `dist` folder to Netlify
3. Configure redirects for SPA

## 🔧 Environment Configuration

Create `.env` file with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📋 Pre-deployment Checklist

- [ ] Firebase project created and configured
- [ ] Authentication enabled with Email/Password
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Security rules deployed
- [ ] Environment variables configured
- [ ] Application built successfully
- [ ] All features tested locally

## 🔐 Security Considerations

1. **Firestore Rules**: Ensure proper access control
2. **Storage Rules**: Limit file sizes and types
3. **Authentication**: Enable only required providers
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never commit sensitive data

## 📱 Post-deployment Tasks

1. **Create Admin User**: Register first user and manually set `isAdmin: true` in Firestore
2. **Test All Features**: Verify messaging, calls, file sharing
3. **Monitor Usage**: Check Firebase console for usage metrics
4. **Set Up Monitoring**: Configure error tracking and analytics

## 🐛 Troubleshooting

### Common Issues:
1. **Permission Denied**: Check Firestore security rules
2. **File Upload Fails**: Verify Storage rules and file size limits
3. **WebRTC Issues**: Ensure HTTPS and proper browser permissions
4. **Build Errors**: Check Node.js version compatibility

### Support:
- Check Firebase Console for error logs
- Review browser developer tools
- Verify network connectivity
- Test with different browsers

## 📊 Performance Optimization

1. **Code Splitting**: Implement dynamic imports for large components
2. **Image Optimization**: Compress images before upload
3. **Caching**: Configure proper cache headers
4. **CDN**: Use Firebase Hosting CDN for global distribution

## 🔄 Updates and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Monitor for security vulnerabilities
3. **Backup**: Regular Firestore exports
4. **Monitoring**: Set up alerts for errors and performance issues

