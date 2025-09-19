# NutriTrack

A comprehensive nutrition and fitness tracking application built with React and Node.js. NutriTrack helps users monitor their daily nutrition intake, plan meals and workouts, and receive AI-powered coaching guidance.

## Features

- **User Authentication**: Secure login and registration with password reset functionality
- **Dashboard**: Personalized homepage with daily goals and progress tracking
- **Meal Planning**: Plan and track daily meals with nutritional information
- **Workout Planning**: Create and manage workout routines
- **Food Scanner**: Scan barcodes to quickly add food items
- **AI Coach**: Get personalized nutrition and fitness advice powered by Google's Generative AI
- **Goal Setting**: Set and track daily nutrition and fitness goals
- **Progress Monitoring**: Visual tracking of water intake, calories, and other metrics

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **React ZXing** - Barcode scanning

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email functionality
- **Google Generative AI** - AI coaching features

## Getting Started

### Prerequisites
- Node.js >= 16.0.0
- MongoDB database
- Google Generative AI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NutriTrack
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up environment variables:
Create a `.env` file in the backend directory with:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_AI_API_KEY=your_google_ai_api_key
EMAIL_USER=your_email_for_notifications
EMAIL_PASS=your_email_password
```

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the backend server:
```bash
cd backend
npm start
```

## API Endpoints

- `/api/auth` - Authentication routes (login, register, reset password)
- `/api/users` - User management
- `/api/goals` - Daily goals management
- `/api/progress` - Progress tracking
- `/api/meals` - Meal planning and tracking
- `/api/workouts` - Workout management
- `/api/foods` - Food database
- `/api/scanner` - Barcode scanning functionality
- `/api/chat` - AI coach chat interface

## Deployment

The application is configured for deployment on Vercel with the included `vercel.json` configuration file. The backend is deployed as serverless functions.

## Security Features

- Content Security Policy headers
- CORS protection
- Request rate limiting
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
