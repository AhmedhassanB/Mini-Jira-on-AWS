import { SNSClient } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });

export default sns;
