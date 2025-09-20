# Aviatrix CNSF Sales Enablement App

A sales intelligence and coaching tool for Aviatrix sales teams to better sell Cloud Network Security Fabric (CNSF) to enterprise accounts.

## Features

- **Account Plan Generation**: Research-based account intelligence for target companies
- **Interactive Sales Coaching**: Role-play with AI-powered CISO personas
- **Competitor Battle Cards**: Understand competitor positioning strategies
- **Analyst Reports**: Objective analysis of solution fit

## Setup

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   CLAUDE_API_KEY=your_claude_api_key_here
   PORT=3000
   ```

4. Run the application:
   ```bash
   npm start
   ```

5. Open browser to `http://localhost:3000`

### Deployment to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set environment variable in Vercel:
   - Go to your Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add `CLAUDE_API_KEY` with your API key

4. Deploy to production:
   ```bash
   vercel --prod
   ```

## Usage

1. Enter target company name (required)
2. Optionally add known contacts and competitors
3. Generate account plan
4. Engage in sales coaching session
5. Review feedback and competitive insights

## Notes

- The app uses Claude Opus for deep research and analysis
- No authentication required - share the Vercel URL with your sales team
- All outputs can be copied and pasted into other documents