#!/usr/bin/env node
/**
 * deploy-lambda.mjs — Deploy Remotion Lambda infrastructure.
 *
 * Prerequisites:
 *   1. AWS credentials configured (aws configure or env vars)
 *   2. @remotion/lambda installed
 *
 * Usage:
 *   node scripts/deploy-lambda.mjs              # Deploy function + site
 *   node scripts/deploy-lambda.mjs --teardown   # Remove everything
 *
 * This creates:
 *   - A Lambda function for rendering
 *   - An S3 site bundle of the Remotion project
 *   - Outputs the function name and serve URL for render-lambda.mjs
 */

import {
  deployFunction,
  deploySite,
  getOrCreateBucket,
  deleteSite,
  deleteFunction,
  getFunctions,
  getSites,
} from "@remotion/lambda";
import { bundle } from "@remotion/bundler";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGION = process.env.REMOTION_AWS_REGION || "us-east-1";
const MEMORY_SIZE = 2048; // MB — good balance for 1080p
const TIMEOUT = 240; // seconds
const DISK = 2048; // MB ephemeral storage

async function deploy() {
  console.log(`\n🚀 Deploying Remotion Lambda to ${REGION}...\n`);

  // 1. Bundle the project
  console.log("📦 Bundling project...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "../src/index.ts"),
    onProgress: (p) => {
      if (p % 25 === 0) process.stdout.write(`  ${p}%\r`);
    },
  });
  console.log("  ✓ Bundle complete\n");

  // 2. Get or create S3 bucket
  console.log("🪣 Getting S3 bucket...");
  const { bucketName } = await getOrCreateBucket({ region: REGION });
  console.log(`  ✓ Bucket: ${bucketName}\n`);

  // 3. Deploy site (upload bundle to S3)
  console.log("🌐 Deploying site...");
  const { serveUrl } = await deploySite({
    bucketName,
    entryPoint: bundleLocation,
    region: REGION,
    siteName: "parallax-templates",
  });
  console.log(`  ✓ Serve URL: ${serveUrl}\n`);

  // 4. Deploy Lambda function
  console.log("⚡ Deploying Lambda function...");
  const { functionName } = await deployFunction({
    region: REGION,
    memorySizeInMb: MEMORY_SIZE,
    timeoutInSeconds: TIMEOUT,
    diskSizeInMb: DISK,
  });
  console.log(`  ✓ Function: ${functionName}\n`);

  // 5. Output config
  console.log("━".repeat(50));
  console.log("✅ Deployment complete!\n");
  console.log("Add these to your .env or environment:");
  console.log(`  REMOTION_AWS_REGION=${REGION}`);
  console.log(`  REMOTION_FUNCTION_NAME=${functionName}`);
  console.log(`  REMOTION_SERVE_URL=${serveUrl}`);
  console.log(`  REMOTION_BUCKET=${bucketName}`);
  console.log("\nRender with:");
  console.log(`  node scripts/render-lambda.mjs --comp=DataChart --props=data/episodes/ep01/chart-lithography.json`);
}

async function teardown() {
  console.log(`\n🧹 Tearing down Lambda resources in ${REGION}...\n`);

  const functions = await getFunctions({ region: REGION, compatibleOnly: false });
  for (const fn of functions) {
    console.log(`  Deleting function: ${fn.functionName}`);
    await deleteFunction({ region: REGION, functionName: fn.functionName });
  }

  const { sites } = await getSites({ region: REGION });
  for (const site of sites) {
    console.log(`  Deleting site: ${site.id}`);
    await deleteSite({ bucketName: site.bucketName, siteName: site.id, region: REGION });
  }

  console.log("\n✅ Teardown complete.");
}

const args = process.argv.slice(2);
if (args.includes("--teardown")) {
  teardown().catch(console.error);
} else {
  deploy().catch(console.error);
}
