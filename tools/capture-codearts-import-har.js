const path = require("node:path");
const { chromium } = require("playwright");

const PROJECT_URL =
  "https://devcloud.cn-north-4.huaweicloud.com/projectman/scrum/e590e9bcd23e4b99b9d9052a0b3fa983/workitem/list";
const HAR_PATH = path.resolve(__dirname, "../output/codearts-xmi-import.har");

async function main() {
  const context = await chromium.launchPersistentContext(
    path.resolve(__dirname, "../output/edge-capture-profile"),
    {
      channel: "msedge",
      headless: false,
      recordHar: {
        path: HAR_PATH,
        mode: "full",
        content: "embed",
      },
    }
  );
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(process.argv[2] || PROJECT_URL);
  console.log("Browser opened.");
  console.log("1. Log in if needed.");
  console.log("2. Navigate to the XMI import page.");
  console.log("3. Import the XMI file and wait for the server error.");
  console.log("4. Return here and press Enter to save HAR.");

  await new Promise((resolve) => process.stdin.once("data", resolve));
  await context.close();
  console.log(`HAR saved to ${HAR_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
