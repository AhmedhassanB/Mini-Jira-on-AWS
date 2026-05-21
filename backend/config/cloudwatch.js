import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function publishMetric(metricName, value = 1, dimensions = []) {
  try {
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: "MiniJira",
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: "Count",
        Dimensions: dimensions,
        Timestamp: new Date()
      }]
    }));
  } catch (err) {
    console.error("CloudWatch metric error:", err.message);
  }
}
