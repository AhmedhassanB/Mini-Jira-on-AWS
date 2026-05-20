# Task Assignment Worker Lambda — Deployment Guide

## Overview
This Lambda worker processes task assignment events from SQS queue, triggered by SNS topic when a manager assigns a task to an employee.

**Flow:**
1. Manager updates task with `assigneeId` via `PUT /api/tasks/{id}`
2. Backend publishes to SNS topic `task-assignments`
3. SNS → SQS subscription delivers message to queue
4. Lambda triggered by SQS event
5. Lambda logs assignment audit trail and publishes CloudWatch metrics

## Prerequisites
- SNS topic created: `task-assignments` (get the ARN)
- SQS queue created: `task-assignment-worker`
- SNS → SQS subscription configured
- DynamoDB tables: `Tasks`, `Users` (with proper data)
- IAM role with DynamoDB read + CloudWatch write permissions

## AWS Console Setup

### 1. Create SNS Topic
```bash
aws sns create-topic --name task-assignments --region us-east-1
# Note the TopicArn from output
```

**OR via Console:**
1. SNS → Topics → Create topic
2. Name: `task-assignments`
3. Copy ARN (e.g., `arn:aws:sns:us-east-1:154516701519:task-assignments`)

### 2. Create SQS Queue
```bash
aws sqs create-queue --queue-name task-assignment-worker --region us-east-1
# Note the QueueUrl from output
```

**OR via Console:**
1. SQS → Queues → Create queue
2. Name: `task-assignment-worker`
3. Type: Standard
4. Copy Queue URL (e.g., `https://sqs.us-east-1.amazonaws.com/154516701519/task-assignment-worker`)

### 3. Subscribe SQS to SNS
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:154516701519:task-assignments \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:154516701519:task-assignment-worker \
  --region us-east-1
```

**OR via Console:**
1. SNS → Topics → task-assignments → Create subscription
2. Protocol: Amazon SQS
3. Endpoint: (paste full SQS queue ARN)
4. Create

### 4. Create Lambda Function
1. Lambda → Create function
2. Name: `task-assignment-worker`
3. Runtime: **Node.js 24.x** (or latest)
4. Execution role: Create new (or use existing with DynamoDB + CloudWatch permissions)
5. Create

### 5. Attach Permissions to Lambda Role
**DynamoDB Read Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:154516701519:table/Tasks",
        "arn:aws:dynamodb:us-east-1:154516701519:table/Users"
      ]
    }
  ]
}
```

**CloudWatch Write Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

### 6. Deploy Lambda Code
1. Zip handler.js + package.json:
   ```bash
   cd backend/lambdas/task-assignment-worker
   Compress-Archive -Path handler.js, package.json -DestinationPath function.zip -Force
   ```

2. Upload to Lambda:
   - Lambda console → Code → Upload from → .zip file
   - Select `function.zip`

3. Set Handler: `handler.handler`

4. Set Environment Variables:
   - `AWS_REGION`: `us-east-1`

### 7. Add SQS Trigger to Lambda
1. Lambda function → Add trigger
2. Source: SQS
3. SQS queue: `task-assignment-worker`
4. Batch size: 10
5. Add

### 8. Backend Environment Variable
Add to `backend/.env`:
```
SNS_TASK_ASSIGNMENTS_TOPIC_ARN=arn:aws:sns:us-east-1:154516701519:task-assignments
```

Then restart backend server.

## Testing

### 1. Create a task via API
```bash
POST /api/tasks
{
  "title": "Test Task",
  "description": "Test assignment",
  "priority": "High",
  "teamId": "team-1",
  "assigneeId": "user-123"
}
```

### 2. Update task assignee
```bash
PUT /api/tasks/{taskId}
{
  "assigneeId": "user-456"
}
```

Backend should log SNS publish event.

### 3. Check SQS Queue
- SQS console → Select queue → Send/receive messages
- Should see message from SNS

### 4. Check Lambda Execution
- Lambda console → Monitor → View CloudWatch logs
- Should see assignment audit log and metrics

### 5. Verify CloudWatch Metrics
- CloudWatch → Metrics → MiniJira/TaskAssignments
- Should see `TaskAssignmentsProcessed` metric with TeamId and AssigneeId dimensions

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Lambda not triggered | Check SQS trigger attached; verify SNS → SQS subscription |
| "Cannot read property 'Message'" | Check SNS → SQS message wrapping (SNS wraps in `Message` field) |
| DynamoDB access denied | Attach `dynamodb:GetItem` + `dynamodb:Query` permissions to Lambda role |
| Environment variable not found | Add `SNS_TASK_ASSIGNMENTS_TOPIC_ARN` to Lambda env vars AND backend .env |
| CloudWatch metric not appearing | Check Lambda role has `cloudwatch:PutMetricData` permission |

## Next Steps
- Integrate SES email notifications (send email to assignee on task assignment)
- Add assignment audit log to separate DynamoDB table
- Create EventBridge rule for daily digest emails
