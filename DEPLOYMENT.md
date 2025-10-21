# Deployment Guide - TechShop

This guide covers deploying the TechShop e-commerce platform to production.

## Prerequisites

- AWS Account (or alternative cloud provider)
- Domain name
- Stripe account
- SendGrid account
- Basic knowledge of DevOps and cloud infrastructure

## Local Development Setup

### 1. Using Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd Repo-of-Greatness/backend

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development environment
docker-compose --profile development up

# The API will be available at http://localhost:5000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# pgAdmin: http://localhost:5050
```

### 2. Manual Setup

```bash
# Install dependencies
npm install

# Set up PostgreSQL database
createdb techshop_db

# Run migrations
psql techshop_db < database/migrations/001_initial_schema.sql
psql techshop_db < database/seeds/001_seed_data.sql

# Start development server
npm run dev
```

## Production Deployment

### Option 1: AWS Elastic Beanstalk

#### Step 1: Prepare Application

```bash
# Build TypeScript
npm run build

# Create .ebignore
echo "node_modules/
src/
*.ts
.git/
.env" > .ebignore
```

#### Step 2: Initialize Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js techshop-api --region us-east-1

# Create environment
eb create techshop-production --database.engine postgres
```

#### Step 3: Configure Environment Variables

```bash
eb setenv \
  NODE_ENV=production \
  JWT_SECRET=your_secret_here \
  STRIPE_SECRET_KEY=sk_live_... \
  SENDGRID_API_KEY=SG... \
  DATABASE_URL=your_rds_url
```

#### Step 4: Deploy

```bash
eb deploy
```

### Option 2: AWS ECS with Docker

#### Step 1: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t techshop-api .

# Tag image
docker tag techshop-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/techshop-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/techshop-api:latest
```

#### Step 2: Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "techshop-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "techshop-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/techshop-api:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "5000" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/techshop-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 3: Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster techshop-cluster \
  --service-name techshop-api-service \
  --task-definition techshop-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:xxx,containerName=techshop-api,containerPort=5000"
```

### Option 3: DigitalOcean App Platform

#### Step 1: Create App Spec

Create `.do/app.yaml`:

```yaml
name: techshop-api
services:
  - name: api
    github:
      repo: your-username/your-repo
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_size_slug: professional-xs
    instance_count: 2
    http_port: 5000
    health_check:
      http_path: /health
    envs:
      - key: NODE_ENV
        value: "production"
      - key: JWT_SECRET
        value: "${JWT_SECRET}"
        type: SECRET
      - key: DATABASE_URL
        value: "${db.DATABASE_URL}"
        type: SECRET

databases:
  - name: db
    engine: PG
    version: "15"

```

#### Step 2: Deploy

```bash
doctl apps create --spec .do/app.yaml
```

## Database Setup

### PostgreSQL on AWS RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier techshop-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your_password \
  --allocated-storage 20

# Run migrations
psql $DATABASE_URL < database/migrations/001_initial_schema.sql
psql $DATABASE_URL < database/seeds/001_seed_data.sql
```

### Redis on AWS ElastiCache

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id techshop-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test

      - name: Build
        run: cd backend && npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: techshop-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster techshop-cluster --service techshop-api-service --force-new-deployment
```

## SSL/TLS Configuration

### Using AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.techshop.com \
  --validation-method DNS

# Add certificate to load balancer
aws elbv2 add-listener-certificates \
  --listener-arn arn:aws:elasticloadbalancing:xxx \
  --certificates CertificateArn=arn:aws:acm:xxx
```

## Monitoring & Logging

### CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/techshop-api

# Create metric alarm
aws cloudwatch put-metric-alarm \
  --alarm-name techshop-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Sentry Integration

```bash
# Install Sentry
npm install @sentry/node

# Add to server.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Backup Strategy

### Automated Database Backups

```bash
# Enable automated backups on RDS
aws rds modify-db-instance \
  --db-instance-identifier techshop-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Manual Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="techshop_backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://techshop-backups/
```

## Performance Optimization

### Enable Compression

Already enabled via `compression` middleware in server.ts

### Database Indexing

Indexes are defined in migration files. Monitor slow queries:

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Caching Strategy

- Product data: 1 hour TTL
- User sessions: 7 days TTL
- API responses: 5 minutes TTL

### CDN for Static Assets

Configure CloudFront to cache static files from S3.

## Security Checklist

- [ ] All environment variables stored in AWS Secrets Manager
- [ ] Database encryption at rest enabled
- [ ] SSL/TLS certificates configured
- [ ] Security groups properly configured (least privilege)
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured for specific origins only
- [ ] Helmet.js middleware active
- [ ] Regular security updates (npm audit)
- [ ] Database backups automated
- [ ] Monitoring and alerts configured

## Scaling Considerations

### Horizontal Scaling

```bash
# Update ECS service desired count
aws ecs update-service \
  --cluster techshop-cluster \
  --service techshop-api-service \
  --desired-count 4
```

### Auto Scaling

```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/techshop-cluster/techshop-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/techshop-cluster/techshop-api-service \
  --policy-name cpu75-target-tracking-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Troubleshooting

### Common Issues

1. **Database connection timeout**
   - Check security group rules
   - Verify VPC configuration
   - Check database credentials

2. **High memory usage**
   - Increase ECS task memory
   - Check for memory leaks
   - Enable connection pooling

3. **Slow API responses**
   - Check database indexes
   - Enable Redis caching
   - Review N+1 queries

### Useful Commands

```bash
# View logs
aws logs tail /ecs/techshop-api --follow

# Connect to database
psql $DATABASE_URL

# Check Redis
redis-cli -h your-redis-host.cache.amazonaws.com ping

# Test API health
curl https://api.techshop.com/health
```

## Cost Optimization

### Development Environment
- Use t3.micro instances
- Enable spot instances for non-critical workloads
- Schedule scaling down during off-hours

### Production Recommendations
- Use Reserved Instances for stable workloads
- Enable S3 lifecycle policies
- Use CloudFront for static content
- Monitor and optimize database queries

## Support

For deployment issues:
1. Check CloudWatch logs
2. Review Sentry error reports
3. Contact DevOps team
4. Review this documentation

---

**Last Updated**: 2024
**Version**: 1.0.0
