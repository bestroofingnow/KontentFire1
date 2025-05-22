# Kontent Fire - AI Content Generation Platform

> An advanced AI-powered content generation and publishing platform that enables intelligent, dynamic content creation through comprehensive multi-service AI analysis and personalized user experiences.

## 🚀 Features

- **Multi-Service AI Content Generation**: Leverages OpenAI GPT-4o, Anthropic Claude 3.7, and Perplexity for high-quality content
- **Content Templates**: Pre-built templates including Battle Royale for structured content creation
- **Subscription Plans**: Tiered access with Ember Plan ($99/month) and Inferno Plan ($999/month)
- **Social Media Integration**: Publish directly to Facebook, LinkedIn, and other platforms
- **Analytics Dashboard**: Track content performance and audience engagement
- **Business Listings Management**: Manage your business presence across multiple platforms
- **Auto-Content Generation**: Schedule content creation and publication automatically
- **API Diagnostic Tools**: Built-in tools to verify AI service connectivity

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Tailwind CSS with Shadcn UI components
- **Animations**: Framer Motion
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Payment Processing**: Stripe
- **AI Services**: OpenAI, Anthropic Claude, Perplexity

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- API keys for OpenAI, Anthropic, and Perplexity

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kontent-fire.git
   cd kontent-fire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # AI Service API Keys
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/kontent_fire
   
   # Session Secret
   SESSION_SECRET=your_random_session_secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🔧 API Configuration

### Getting API Keys

**OpenAI API Key:**
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an account and add payment method
3. Generate a new API key

**Anthropic API Key:**
1. Visit [console.anthropic.com/keys](https://console.anthropic.com/keys)
2. Create an account and add payment method
3. Generate a new API key

**Perplexity API Key:**
1. Visit [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Create an account and add payment method
3. Generate a new API key

### Testing API Connectivity

The platform includes built-in diagnostic tools:

- Visit `/api-diagnostic` to test all API connections
- Visit `/content-generation-test` to test content generation

## 📁 Project Structure

```
kontent-fire/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database connection
│   └── *.ts               # Various service modules
├── shared/                # Shared types and schemas
└── public/                # Static assets
```

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   
   Ensure all API keys and database credentials are properly configured for production.

2. **Database Migration**
   ```bash
   npm run db:push
   ```

3. **Build the Application**
   ```bash
   npm run build
   ```

### Deployment Options

- **Replit Deployments**: Use the built-in deployment feature
- **Vercel**: Connect your GitHub repository
- **Railway**: Deploy with automatic database provisioning
- **DigitalOcean App Platform**: Container-based deployment

## 🔍 Content Generation System

### Battle Royale Template

The platform includes a reliable Battle Royale template that works even when external AI services are unavailable:

- Generates comparison articles between two options
- Built-in fallback mechanism for reliable operation
- Customizable industry focus and comparison criteria

### Multi-Service AI Integration

1. **Primary Generation**: GPT-4o creates initial content
2. **Enhancement**: Claude 3.7 refines and improves the content  
3. **Research**: Perplexity adds facts and citations (for blog content)
4. **Visuals**: DALL-E 3 generates accompanying images

## 📊 Subscription Plans

### Ember Plan - $99/month
- 1 post per day
- 1 platform
- Basic analytics
- Standard templates

### Inferno Plan - $999/month
- Unlimited posts
- Multiple platforms
- Advanced analytics
- Auto-content generation
- Premium templates
- Priority support

## 🛡️ Security

- Secure authentication with Passport.js
- Environment variable protection for API keys
- Database query parameterization
- HTTPS enforcement in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary - All rights reserved.

## 🆘 Support

For support, email support@kontentfire.com or create an issue in this repository.

---

**Built with ❤️ for content creators who want to scale their impact**