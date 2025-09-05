# AssetPro - AWS Amplify Deployment Guide

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Prepare your environment variables

## Step 1: Prepare Your Repository

Ensure your repository contains:

- ✅ `amplify.yml` - Build configuration
- ✅ `next.config.mjs` - Next.js configuration
- ✅ `package.json` - Dependencies
- ✅ `.gitignore` - Proper exclusions

## Step 2: Set Up AWS Amplify

### 2.1 Access AWS Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sign in to your AWS account
3. Click "New app" → "Host web app"

### 2.2 Connect Your Repository

1. Choose "GitHub" as your repository service
2. Authorize AWS Amplify to access your GitHub account
3. Select your AssetPro repository
4. Choose the branch you want to deploy (usually `main` or `master`)

### 2.3 Configure Build Settings

1. **Build settings**: Amplify will auto-detect the `amplify.yml` file
2. **Environment variables**: Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=your_amplify_domain
```

### 2.4 Deploy

1. Click "Save and deploy"
2. Amplify will start the build process
3. Monitor the build logs for any issues

## Step 3: Environment Variables Setup

### Required Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://your-app.amplifyapp.com
NODE_ENV=production

# Optional: Sentry (if using)
SENTRY_DSN=your_sentry_dsn
```

## Step 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your custom domain
4. Follow the DNS configuration instructions

### 4.2 Environment Variables in Amplify

1. Go to "App settings" → "Environment variables"
2. Add all required environment variables
3. Redeploy the app after adding variables

## Step 5: Monitoring and Maintenance

### 5.1 Build Monitoring

- Monitor build logs in Amplify Console
- Set up notifications for build failures
- Check for any dependency issues

### 5.2 Performance Monitoring

- Use AWS CloudWatch for monitoring
- Set up alerts for performance issues
- Monitor application logs

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs in Amplify Console
   - Verify all dependencies are in `package.json`
   - Ensure `amplify.yml` is correctly configured

2. **Environment Variables**
   - Verify all required variables are set
   - Check variable names match your code
   - Redeploy after adding new variables

3. **Runtime Errors**
   - Check browser console for client-side errors
   - Monitor server logs in Amplify Console
   - Verify Supabase connection

### Build Commands Reference:

```bash
# Local build test
pnpm install
pnpm build

# Check for issues
pnpm lint
pnpm type-check
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **API Keys**: Use environment variables for all API keys
3. **CORS**: Configure CORS settings in Supabase
4. **Authentication**: Ensure proper auth flow setup

## Cost Optimization

1. **Build Time**: Optimize build process to reduce costs
2. **Caching**: Use Amplify's caching features
3. **CDN**: Leverage CloudFront for global distribution

## Support

- **AWS Amplify Documentation**: https://docs.aws.amazon.com/amplify/
- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs

---

**Deployment Status**: ✅ Ready for deployment
**Last Updated**: $(date)
**Version**: 1.0.0
