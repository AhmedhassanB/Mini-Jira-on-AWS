# s3-to-dynamodb-update Lambda

This Lambda updates the `Tasks` DynamoDB item when a new object is uploaded to the `tasks/{taskId}/...` prefix in S3.

Deployment steps (AWS CLI)

1. Zip the function directory from inside `backend/lambdas/s3-to-dynamodb-update`:

```bash
zip -r function.zip handler.js node_modules package.json README.md
```

2. Create an IAM role for the Lambda (trust policy for lambda.amazonaws.com) and attach a policy like below (least-privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:<region>:<account-id>:table/Tasks"
    }
  ]
}
```

Also allow the Lambda service principal (Lambda execution role) with CloudWatch logs.

3. Create the Lambda:

```bash
aws lambda create-function \
  --function-name s3-to-dynamodb-update \
  --runtime nodejs18.x \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --role <role-arn> \
  --environment Variables={AWS_REGION=us-east-1,TABLE_NAME=Tasks} \
  --timeout 30
```

4. Give S3 permission to invoke the Lambda:

```bash
aws lambda add-permission \
  --function-name s3-to-dynamodb-update \
  --statement-id s3invoke \
  --action "lambda:InvokeFunction" \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::mini-jira-images
```

5. Configure S3 notification (notification.json):

```json
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:<region>:<account-id>:function:s3-to-dynamodb-update",
      "Events": ["s3:ObjectCreated:Put"],
      "Filter": {"Key":{"FilterRules":[{"Name":"prefix","Value":"tasks/"}]}}
    }
  ]
}
```

Then:

```bash
aws s3api put-bucket-notification-configuration --bucket mini-jira-images --notification-configuration file://notification.json
```

Notes:
- The Lambda retries update on `backfilling index` errors with exponential backoff.
- For production, consider wiring SQS + DLQ instead of in-function long retries.
