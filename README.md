# Real-Time Chat Application

A full-stack, real-time communication platform inspired by Discord, featuring real-time text messaging, voice channels, file attachments, server management, and customizable UI themes.

## Features

### Messaging & Communication

- **Real-Time Text Chat:** Instant messaging using WebSockets (Socket.io).
- **File Attachments:** Upload images and PDFs (up to 10MB) directly into the chat. Images are rendered inline, and PDFs appear as downloadable widgets.
- **Voice Channels:** Real-time, high-quality audio communication powered by LiveKit. Toggle mute and deafen states instantly.

### Servers & Organization

- **Server Management:** Create, join (via invite links), edit, and delete custom servers.
- **Channel Organization:** Create text and voice channels within your servers to keep conversations organized.
- **Member Management:** View online/offline status and server participants.

### User Experience & Customization

- **Dynamic Theming:** Choose from over 30+ DaisyUI themes (dark, light, cyber, retro, etc.) with local storage persistence.
- **User Profiles:** Customize your username, profile photo, and password.

---

## Tech Stack

- **Frontend:** Angular 19, Tailwind CSS, DaisyUI
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io (Text Chat), LiveKit (Voice)
- **Storage:** Multer (Local file uploads)

---

## Installation & Setup

### Prerequisites

- **Node.js:** v22.0.0 or higher
- **npm:** v10.0.0 or higher
- **MongoDB:** A running local or cloud MongoDB instance
- **LiveKit Server:** A running LiveKit server for voice functionality

### 1. Clone & Install

Clone the repository and install dependencies from the root directory using npm workspaces:

```bash
git clone <repository-url>
cd chat-app
npm install
```

### 2. Environment Variables

Create a `.env` file in the `apps/api` directory (`apps/api/.env`) and add the following configuration:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chat-app  # Or your MongoDB Atlas URI
JWT_SECRET=your_super_secret_jwt_key

# LiveKit Configuration (Required for Voice Channels)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_WS_URL=ws://localhost:7880
```

### 3. Running the Application

This project uses npm workspaces. You can run the frontend and backend concurrently in separate terminal windows from the **root directory**.

**Start the Backend (API):**

```bash
npm run dev:api
```

_(Runs the Express server on <http://localhost:3000>)_

**Start the Frontend (Web):**

```bash
npm run dev:web
```

_(Runs the Angular development server on <http://localhost:4200>)_

**Start livekit server:**

- Make sure you have Docker Installed

```bash
docker compose up -d
```

---

## Usage Notes

- **File Uploads:** Uploaded attachments and profile pictures are stored locally in the `apps/api/uploads` directory.
- **Voice Testing:** To test voice channels locally, ensure your LiveKit server is running and matches the credentials in your `.env` file.
