# Image Resize Lambda

Automatically resizes images uploaded to the Mini-Jira originals S3 bucket and creates thumbnails in a separate resized bucket.

## Trigger

- **S3 ObjectCreated** event on `mini-jira-originals` bucket with prefix `tasks/`

## Behavior

1. Extracts `taskId` from S3 key path: `tasks/{taskId}/uuid.ext`
2. Downloads the original image from originals bucket
3. Resizes the image to multiple sizes (100x100, 300x300) using Sharp
4. Uploads thumbnails to `mini-jira-resized` bucket under `tasks/{taskId}/thumbnail-{size}.{ext}`
5. Updates the Tasks table `thumbnailUrl` field with the smallest thumbnail URL

## Environment Variables

```
AWS_REGION=us-east-1
S3_BUCKET_ORIGINALS=mini-jira-originals
S3_BUCKET_RESIZED=mini-jira-resized
```

## Dependencies

- `@aws-sdk/client-s3`
- `@aws-sdk/lib-dynamodb`
- `@aws-sdk/client-dynamodb`
- `sharp` ⚠️ **Requires Lambda Layer** — Sharp has native C++ bindings; it cannot be bundled with Node modules. You must use either:
  - AWS Lambda Layer ([lambda-layer-sharp](https://github.com/Umkus/lambda-layer-sharp/releases)) pre-built for Node.js 18.x
  - Or build Sharp locally in an Amazon Linux environment, zip it, and deploy as a layer

## Deployment Steps

### 1. Create S3 Resized Bucket (if not exists)

```bash
aws s3api create-bucket \
  --bucket mini-jira-resized \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1
```

Or via console: S3 → Create bucket → `mini-jira-resized` → Block public access → Create.

### 2. Create IAM Execution Role

```bash
aws iam create-role \
  --role-name mini-jira-image-resize-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "Service": "lambda.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }
    ]
  }'
```

### 3. Attach IAM Policy

Create and attach a policy with S3 and DynamoDB permissions:

```bash
aws iam put-role-policy \
  --role-name mini-jira-image-resize-lambda-role \
  --policy-name mini-jira-image-resize-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": "arn:aws:s3:::mini-jira-originals/tasks/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject"
        ],
        "Resource": "arn:aws:s3:::mini-jira-resized/tasks/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:UpdateItem"
        ],
        "Resource": "arn:aws:dynamodb:us-east-1:*:table/Tasks"
      },
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:us-east-1:*:*"
      }
    ]
  }'
```

### 4. Build Lambda Package with Sharp

Sharp requires native bindings. Use a Lambda Layer or build in EC2.

**Option A: Build locally (Windows → Linux)**

```bash
# From backend/lambdas/image-resize directory
npm install aws-sdk sharp

# Zip for Lambda (change path if on different directory)
$files = @('handler.js', 'node_modules', 'package.json')
Compress-Archive -Path $files -DestinationPath function.zip -Force
```

**Option B: Use AWS Lambda Layer (recommended)**

- Download the [Sharp Lambda Layer](https://github.com/Umkus/lambda-layer-sharp/releases)
- Upload to Lambda as a layer: **Lambda → Layers → Create Layer**
- Attach layer to function when creating

### 5. Create Lambda Function

```bash
aws lambda create-function \
  --function-name mini-jira-image-resize \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/mini-jira-image-resize-lambda-role \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables={AWS_REGION=us-east-1,S3_BUCKET_RESIZED=mini-jira-resized}
```

**With Layer:**

```bash
aws lambda create-function \
  --function-name mini-jira-image-resize \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/mini-jira-image-resize-lambda-role \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --layers arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:layer:sharp-nodejs:1 \
  --environment Variables={AWS_REGION=us-east-1,S3_BUCKET_RESIZED=mini-jira-resized}
```

### 6. Add S3 Notification

```bash
aws s3api put-bucket-notification-configuration \
  --bucket mini-jira-originals \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:mini-jira-image-resize",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {
                "Name": "prefix",
                "Value": "tasks/"
              }
            ]
          }
        }
      }
    ]
  }'
```

### 7. Add Lambda Permission (S3 → Lambda)

```bash
aws lambda add-permission \
  --function-name mini-jira-image-resize \
  --statement-id AllowS3Invoke \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::mini-jira-originals
```

## Testing

Upload an image to `mini-jira-originals/tasks/{task-id}/test.png` and verify:

1. CloudWatch Logs show "Image resize Lambda triggered"
2. `mini-jira-resized` bucket contains `tasks/{task-id}/thumbnail-100.png` and `thumbnail-300.png`
3. Tasks table `taskId` row has `thumbnailUrl` set to the smallest thumbnail URL

## Troubleshooting

- **"Cannot find module 'sharp'"** → Layer not attached; rebuild with layer or use npm rebuild
- **"S3: NoSuchBucket"** → Verify bucket names in IAM policy and env vars
- **"ValidationException" on DynamoDB Update** → Ensure Tasks table exists and has Global Secondary Indexes; Lambda will continue if update fails but log the error
- Check logs: `aws logs tail /aws/lambda/mini-jira-image-resize --follow`

## Future Enhancements

- Add support for multiple size profiles (thumbnail, medium, large)
- Implement Dead Letter Queue (DLQ) for failed resizes
- Add CloudWatch metrics for resize performance
- Support image format conversion (WebP, AVIF)
