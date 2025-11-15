# Pickly - AI-Powered Decision Assistant

Pickly is an intelligent decision-making assistant that helps you make better choices in everyday situations. Whether you're deciding what to cook for dinner, what activity to do, or need help with any decision, Pickly uses AI to analyze your context and provide personalized suggestions.

## Features

### 🔍 Universal Decision Search
Ask any decision-related question and get AI-powered guidance through an interactive conversation that understands context and asks follow-up questions when needed.

### 🍳 Smart Recipe Suggestions
Upload a photo of your fridge contents and receive personalized recipe suggestions based on available ingredients, dietary preferences, and cooking time.

### 🎯 Activity Recommendations
Get spontaneous activity suggestions tailored to:
- Current time of day
- Weather conditions
- Your personal preferences
- Available resources

### 🔐 User Authentication
Secure user accounts with email/password authentication, allowing personalized experiences and saved preferences.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **AI**: Gemini & GPT models
- **Routing**: React Router v6
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <project-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── auth/        # Authentication components
│   ├── pages/           # Page components
│   ├── integrations/    # Supabase integration
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions
├── supabase/
│   └── functions/       # Edge functions
└── public/              # Static assets
```

## Database Schema

The app uses the following main tables:
- `chat_history` - Stores conversation history
- `suggestion_history` - Tracks user decisions and suggestions
- `image_analysis_history` - Records fridge photo analyses
- `user_preferences` - Stores user preferences and settings

## Edge Functions

- `universal-search` - Handles AI-powered decision assistance
- `generate-recipes` - Creates recipe suggestions from ingredients
- `generate-activities` - Suggests activities based on context
- `analyze-ingredients` - Analyzes fridge photos for ingredients
- `chat-modify` - Manages conversational AI interactions


### Self-Hosting
This app can be deployed to any static hosting platform:
- Vercel
- Netlify
- AWS Amplify
- GitHub Pages

Make sure to configure environment variables in your hosting platform.



## License

This project is open source and available under the MIT License.


