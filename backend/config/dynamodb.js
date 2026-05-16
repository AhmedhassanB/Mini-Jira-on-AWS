import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";

const clientOptions = {
  region,
};

// Allow connecting to a local DynamoDB endpoint for development/testing
if (process.env.DYNAMODB_ENDPOINT) {
  clientOptions.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(clientOptions);

const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Remove undefined values before sending to DynamoDB
    removeUndefinedValues: true,
    // Do not convert empty strings/sets automatically
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export default dynamoDB;
