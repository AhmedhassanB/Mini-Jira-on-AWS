import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;
const client = new DynamoDBClient({ region, endpoint });

function pickPrimaryKey(keys, modelName) {
  const prefer = `${modelName.toLowerCase()}Id`;
  if (keys.includes(prefer)) return prefer;
  const idKey = keys.find((k) => k.toLowerCase().endsWith("id"));
  if (idKey) return idKey;
  return keys[0];
}

async function loadSchemas(modelsDir) {
  const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".js"));
  const schemas = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(modelsDir, f)).href);
    if (!mod || !mod.default || !mod.default.describe) continue;
    const desc = mod.default.describe();
    const keys = Object.keys(desc.keys || {});
    if (keys.length === 0) continue;
    const base = path.basename(f, ".js");
    const modelName = base.replace(/Schema$/i, "");
    schemas.push({ modelName, keys });
  }
  return schemas;
}

function buildTableParams(model) {
  const tableName = model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1) + (model.modelName.toLowerCase().endsWith('s') ? '' : 's');
  const primary = pickPrimaryKey(model.keys, model.modelName);

  const attrSet = new Set();
  attrSet.add(primary);

  const KeySchema = (tableName === "Comments")
    ? [{ AttributeName: "taskId", KeyType: "HASH" }, { AttributeName: "commentId", KeyType: "RANGE" }]
    : [{ AttributeName: primary, KeyType: "HASH" }];

  if (tableName === "Comments") {
    attrSet.add("taskId");
    attrSet.add("commentId");
  }

  const GSIs = [];
  const has = (attr) => model.keys.includes(attr);
  if (has("teamId") && has("createdAt")) {
    GSIs.push({ IndexName: "GSI_teamId", KeySchema: [{ AttributeName: "teamId", KeyType: "HASH" }, { AttributeName: "createdAt", KeyType: "RANGE" }], Projection: { ProjectionType: "ALL" } });
    attrSet.add("teamId");
    attrSet.add("createdAt");
  }
  if (has("assigneeId") && has("createdAt")) {
    GSIs.push({ IndexName: "GSI_assigneeId", KeySchema: [{ AttributeName: "assigneeId", KeyType: "HASH" }, { AttributeName: "createdAt", KeyType: "RANGE" }], Projection: { ProjectionType: "ALL" } });
    attrSet.add("assigneeId");
    attrSet.add("createdAt");
  }
  if (has("projectId") && has("createdAt")) {
    GSIs.push({ IndexName: "GSI_projectId", KeySchema: [{ AttributeName: "projectId", KeyType: "HASH" }, { AttributeName: "createdAt", KeyType: "RANGE" }], Projection: { ProjectionType: "ALL" } });
    attrSet.add("projectId");
    attrSet.add("createdAt");
  }
  if (has("status") && has("createdAt")) {
    GSIs.push({ IndexName: "GSI_status", KeySchema: [{ AttributeName: "status", KeyType: "HASH" }, { AttributeName: "createdAt", KeyType: "RANGE" }], Projection: { ProjectionType: "ALL" } });
    attrSet.add("status");
    attrSet.add("createdAt");
  }

  const AttributeDefinitions = Array.from(attrSet).map((a) => ({ AttributeName: a, AttributeType: "S" }));

  const params = {
    TableName: tableName,
    AttributeDefinitions,
    KeySchema,
    BillingMode: "PAY_PER_REQUEST",
  };

  if (GSIs.length > 0) params.GlobalSecondaryIndexes = GSIs;

  return params;
}

async function tableExists(tableName) {
  try {
    const resp = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return !!resp.Table;
  } catch (err) {
    return false;
  }
}

async function createTable(params) {
  const exists = await tableExists(params.TableName);
  if (exists) {
    console.log(`Table ${params.TableName} already exists — skipping`);
    return;
  }
  console.log(`Creating table ${params.TableName} ...`);
  const cmd = new CreateTableCommand(params);
  const resp = await client.send(cmd);
  console.log(`CreateTable response for ${params.TableName}:`, resp.TableDescription?.TableStatus);
}

async function main() {
  const modelsDir = path.resolve(process.cwd(), "models");
  const schemas = await loadSchemas(modelsDir);
  console.log("Discovered models:", schemas.map((s) => s.modelName).join(", "));

  const tables = schemas.map(buildTableParams);

  for (const t of tables) {
    try {
      await createTable(t);
    } catch (err) {
      console.error("Error creating table", t.TableName, err);
    }
  }

  const list = await client.send(new ListTablesCommand({}));
  console.log("Current tables:", list.TableNames?.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
