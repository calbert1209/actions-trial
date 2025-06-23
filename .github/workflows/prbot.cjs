const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const textElement = (text, bold = false, italic = false) => ({
  type: "text",
  text,
  style: {
    bold,
    italic,
  },
});

const drawPRTable = (items) => {
  const tableBlocks = [];
  items.forEach(({ number, title, author, repo, createdAt, url }) => {
    tableBlocks.push({
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            textElement(createdAt, false, true),
            textElement(" - "),
            textElement(author, true),
            textElement("\n"),
            {
              type: "link",
              url,
              text: `${repo}#${number} ${title}`,
            },
            textElement("\n\n"),
          ],
        },
      ],
    });
    tableBlocks.push({
      type: "divider",
    });
  });

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: items.length ? "Pending Reviews" : "No Pending Reviews",
          emoji: true,
        },
      },
      ...(items.length
        ? [
            {
              type: "divider",
            },
          ]
        : []),
      ...tableBlocks,
    ],
  };
};

const postToSlack = (path, data) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "hooks.slack.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    
    const req = https.request(options, (res) => {
      let data = "";
    
      res.on("data", (chunk) => {
        data += chunk;
      });
    
      res.on("end", () => {
        resolve(true);
      });
    });
    
    req.on("error", (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  });
  
}

const filePath = path.join(__dirname, "result.json");

if (!fs.existsSync(filePath)) {
  console.error(`Error: The file ${filePath} does not exist.`);
  process.exit(2);
}

const jsonData = fs.readFileSync(filePath, "utf8");
const blockData = drawPRTable(JSON.parse(jsonData));
const webHookPath = process.env.WEBHOOK_PATH;


postToSlack(webHookPath, blockData).then(console.log).catch(console.error);

