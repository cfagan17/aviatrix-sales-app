# Deploying Aviatrix Sales App to Vercel

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Your Anthropic API key

## Step-by-Step Deployment

### Step 1: Push Code to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial deployment of Aviatrix Sales App"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/aviatrix-sales-app.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: Leave empty (we're not building anything)
   - **Output Directory**: Leave as default
   - **Install Command**: `npm install`

5. Add Environment Variables (IMPORTANT):
   Click "Environment Variables" and add:
   - Name: `CLAUDE_API_KEY`
   - Value: Your Anthropic API key
   - Name: `PORT`
   - Value: `3000`

6. Click "Deploy"

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from the aviatrix-sales-app directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? aviatrix-sales-app
# - In which directory is your code located? ./
# - Want to override the settings? No

# Set environment variables
vercel env add CLAUDE_API_KEY
# Enter your Anthropic API key when prompted

vercel env add PORT
# Enter: 3000
```

### Step 3: Configure Production Deployment
After the initial deployment:

1. Go to your project on Vercel Dashboard
2. Go to Settings → Environment Variables
3. Ensure CLAUDE_API_KEY is set for Production
4. Ensure PORT is set to 3000

### Step 4: Custom Domain (Optional)
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Important Notes

### Environment Variables
- **CLAUDE_API_KEY**: Required. Get from https://console.anthropic.com/
- **PORT**: Set to 3000

### File Structure
Your repository should have:
```
aviatrix-sales-app/
├── server.js           # Express server
├── package.json        # Dependencies
├── vercel.json        # Vercel configuration
├── .env               # Local environment variables (don't commit!)
├── .gitignore         # Git ignore file
└── public/            # Static files
    ├── index.html
    ├── app.js
    ├── styles.css
    └── aviatrix-logo.svg
```

### Security
- Never commit your `.env` file
- Keep your API key secret
- Use Vercel's environment variables for production

## Troubleshooting

### "Module not found" errors
- Ensure all dependencies are in package.json
- Run `npm install` locally to verify

### API not working
- Check environment variables in Vercel dashboard
- Verify CLAUDE_API_KEY is correctly set
- Check Vercel function logs

### Static files not loading
- Verify public folder structure
- Check vercel.json routes configuration

## Testing Your Deployment
Once deployed, your app will be available at:
- `https://aviatrix-sales-app.vercel.app` (or your custom domain)

Test all features:
1. Generate Account Plan
2. Test all 4 analyst chats
3. Verify coaching session works
4. Check that all styling loads correctly

## Support
For issues with:
- Vercel deployment: https://vercel.com/docs
- Anthropic API: https://docs.anthropic.com/