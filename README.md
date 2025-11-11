# MemeOn

Foundational project for the MemeOn.ai marketing site and serverless API.

## Project layout

- `web/` – Vite-powered frontend that displays `Hello MemeOn.ai` and calls the serverless API.
- `api/` – TypeScript Lambda handler plus an Express dev server that serves `/api` routes on port `3001`, returning a JSON description (from `api/src/api-description.ts`) for any unimplemented path.
- `infra/terraform/` – Terraform configuration for S3, CloudFront, ACM, API Gateway, Lambda and Route53.
- `.github/workflows/` – CI/CD automation for build and deploy (see below).

## Prerequisites

- Node.js 20+
- npm 10+
- Terraform 1.8+
- AWS CLI v2 with credentials that can manage S3, CloudFront, Lambda, API Gateway, ACM and Route53.

## Local development

Install dependencies once:

```
npm install
```

Then launch both the Vite dev server and the API server locally:

```
npm run dev
```

The site runs on http://localhost:5173 and proxies `/api` requests to http://localhost:3001.

## Building

Build the frontend and package the Lambda bundle:

```
npm run build
```

The Lambda package is written to `api/lambda.zip` and is referenced by Terraform.

## Infrastructure

Terraform is organised under `infra/terraform`.

1. Generate the Lambda bundle: `npm run bundle:api`.
2. Ensure the S3 bucket `memeon.ai` exists. You can create it with the AWS CLI:
   ```
   aws s3api create-bucket --bucket memeon.ai --region us-west-2 --create-bucket-configuration LocationConstraint=us-west-2
   ```
3. Initialise and plan:
   ```
   cd infra/terraform
   terraform init
   terraform plan -var='route53_zone_id=Z123456789ABC'
   ```
4. Apply when ready:
   ```
   terraform apply -var='route53_zone_id=Z123456789ABC'
   ```

The configuration provisions:

- S3 bucket for the static site with CORS set to mirror the Masky project.
- CloudFront distribution with behaviours for the site and `/api/*` requests.
- CloudFront function to redirect `www.memeon.ai` to `memeon.ai`.
- ACM certificate in `us-east-1` for `memeon.ai` and `www.memeon.ai`.
- API Gateway HTTP endpoint integrated with the `memeon-api` Lambda function.
- Route53 records for apex and `www`.

Certificate validation requires DNS. Terraform creates the CNAME records automatically in the hosted zone you supply.

## Deployment workflow

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the frontend, uploads assets to S3, invalidates the CloudFront cache, and updates the Lambda function code using AWS CLI commands. Configure the following repository secrets before running the workflow:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `SITE_BUCKET_NAME`
- `LAMBDA_FUNCTION_NAME` (set to `memeon-api`)
- `API_GATEWAY_ID` *(optional – used for post-deploy smoke tests)*

Trigger the workflow with pushes to `main` or manually from the Actions tab.
