# Email Notifier Lambda

Sends task assignment notification emails via SES when triggered by SNS.

## Setup

### 1. Create the Lambda Function

```bash
cd email-notifier
npm install
zip -r ../email-notifier.zip . -x "*.git*"
```

Upload `email-notifier.zip` to Lambda console:
- **Name**: `email-notifier`
- **Runtime**: Node.js 24.x
- **Handler**: `handler.js`
- **Memory**: 128 MB
- **Timeout**: 30 seconds

### 2. Configure Environment Variables

In Lambda console > Configuration > Environment variables:
```
AWS_REGION=us-east-1
SES_SENDER_EMAIL=amh247408@gmail.com
```

### 3. Add IAM Permissions

Attach policy to Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:VerifyEmailIdentity"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:154516701519:table/Users"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:154516701519:*"
    }
  ]
}
```

### 4. Subscribe to SNS Topic

1. Go to AWS SNS > Topics > `task-assignments`
2. Click "Create subscription"
3. **Protocol**: Lambda
4. **Lambda function**: `email-notifier`
5. Click "Create subscription"

### 5. Verify in CloudWatch Logs

After a task assignment:
1. Go to CloudWatch Logs
2. Search for `/aws/lambda/email-notifier`
3. Check logs for email sent status

## How It Works

1. **SNS triggers** the Lambda with task assignment event
2. **Lambda extracts** taskId, assigneeId, title, timestamp from SNS message
3. **Lambda fetches** assignee email from DynamoDB Users table
4. **Lambda auto-verifies** email in SES (VerifyEmailIdentity)
5. **Lambda sends** email via SES SendEmail API
6. **Results logged** to CloudWatch Logs

## Troubleshooting

- **"User not found"**: Ensure Users table has the assigneeId
- **"User has no email"**: Add email field to user record in Users table
- **"Email address is not verified"**: Lambda now auto-verifies; wait ~10 minutes for verification
- **Missing permissions**: Verify IAM policy includes ses:SendEmail, ses:VerifyEmailIdentity, dynamodb:GetItem
