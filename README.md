# 🚀 Chattix - Real-Time Chat & Collaboration Platform

Chattix is a modern real-time communication platform inspired by applications like WhatsApp and Discord. It provides secure messaging, group collaboration, file sharing, polls, notifications, profile management, and a responsive user experience across desktop and mobile devices.

---

# ✨ Features

## 🔐 Authentication & Security

* User Registration
* Email OTP Verification
* Secure Login
* Forgot Password
* Password Reset
* JWT Authentication
* bcrypt Password Hashing
* Protected Routes
* Secure Session Management

---

## 👤 User Profile

Users can:

* Upload Profile Picture
* Update Profile Information
* Set Bio / Status
* Change Password
* Manage Account Settings

---

## 💬 Real-Time Messaging

* One-to-One Chat
* Instant Message Delivery
* Real-Time Updates via Socket.IO
* Message Read Receipts
* Message Delivery Status
* Typing Indicators
* Online / Offline Status
* Last Seen Information

---

## 👥 Group Chats

* Create Groups
* Group Profile Pictures
* Group Admin Management
* Add Members
* Remove Members
* Leave Group
* Multiple Admin Support
* Group Mentions (@username)
* Group Notifications

---

## 📁 Media & File Sharing

Users can share:

* Images
* PDFs
* Documents
* Files

Features include:

* File Upload
* File Preview
* File Download
* Media Rendering Inside Chat

---

## 😀 Interactive Chat Features

* Emoji Reactions
* Reply to Messages
* Forward Messages
* Delete Messages
* Pin Messages
* Poll Creation
* Mention Users
* Search Messages

---

## 🔔 Notifications

* New Message Alerts
* Friend Request Notifications
* Mention Notifications
* Group Activity Notifications
* Real-Time Notification Updates

---

## 🎨 Modern User Experience

* Responsive Design
* Mobile Optimized
* Desktop Optimized
* Modern UI Components
* Smooth Animations
* Professional Layout
* Custom Chat Wallpapers

---

# 👨‍💻 User Guide

## Creating an Account

1. Open Chattix.
2. Click **Create Account**.
3. Enter:

   * Full Name
   * Username
   * Email Address
   * Mobile Number
   * Password
4. Verify your email using the OTP sent to your inbox.
5. Complete registration.

---

## Logging In

1. Open Chattix.
2. Enter:

   * Email or Mobile Number
   * Password
3. Click Login.

After successful authentication, the user is redirected to the main dashboard.

---

## Finding People

1. Open the Search section.
2. Search using:

   * Username
   * Name
3. Send Friend Request.
4. Wait for the recipient to accept.

---

## Managing Friend Requests

Users can:

* Send Friend Requests
* Accept Requests
* Reject Requests
* View Pending Requests

---

## Starting a Chat

1. Select a contact.
2. Open the conversation.
3. Type a message.
4. Click Send.

Messages are delivered instantly through Socket.IO.

---

## Creating a Group

1. Open Groups.
2. Click Create Group.
3. Enter:

   * Group Name
   * Group Photo
4. Select Members.
5. Create Group.

The creator automatically becomes the Group Admin.

---

## Using Mentions

Inside groups:

```text
@username
```

Mentioned users receive notifications and highlighted messages.

---

## Creating Polls

1. Open a chat or group.
2. Select Create Poll.
3. Add:

   * Question
   * Options
4. Publish Poll.

Members can vote and view results in real time.

---

## Uploading Files

1. Click Attachment.
2. Select:

   * Image
   * PDF
   * Document
3. Upload.

Files become available within the conversation instantly.

---

## Updating Profile

1. Open Profile Settings.
2. Update:

   * Avatar
   * Bio
   * Personal Information
3. Save Changes.

---

# 🏗️ Tech Stack

## Frontend

* React.js
* Tailwind CSS
* React Router DOM
* Axios
* Context API / Redux Toolkit
* Socket.IO Client

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO

## Authentication

* JWT
* bcrypt
* Nodemailer OTP

## Media Storage

* Cloudinary
* Multer

---

# 📂 Project Structure

```text
backend/
├── controllers/
├── routes/
├── middleware/
├── models/
├── socket/
├── services/
├── utils/
├── config/

frontend/
├── components/
├── pages/
├── services/
├── hooks/
├── context/
├── redux/
├── layouts/
├── utils/
```

---

# 🚀 Deployment

Frontend:

* Vercel

Backend:

* Render

Database:

* MongoDB Atlas

Media:

* Cloudinary

---

# 🎯 Vision

Chattix aims to provide a modern, secure, and scalable communication platform that combines real-time messaging, collaboration, file sharing, and community interaction into a single user-friendly application.

Built with performance, security, and user experience as core priorities.
