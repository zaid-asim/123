const fs = require('fs');

let code = fs.readFileSync('server/routes.ts', 'utf8');

// 1. Import the new functions from gemini
code = code.replace(
  /getHealthAdvice,\n} from "\.\/gemini";/,
  `getHealthAdvice,\n  exploreCulture,\n  getAstrologyInsights,\n  getAyurvedaAdvice,\n  getFinanceAdvice,\n} from "./gemini";`
);

// 2. Add the endpoints before the end of registerRoutes
const endpoints = `

  app.post("/api/tools/culture", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {
      const result = await exploreCulture(req.body.topic, apiKey);
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: "Failed to explore culture" });
    }
  });

  app.post("/api/tools/astrology", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {
      const result = await getAstrologyInsights(req.body.details, apiKey);
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: "Failed to get astrology insights" });
    }
  });

  app.post("/api/tools/ayurveda", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {
      const result = await getAyurvedaAdvice(req.body.symptoms, apiKey);
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: "Failed to get ayurveda advice" });
    }
  });

  app.post("/api/tools/finance", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {
      const result = await getFinanceAdvice(req.body.query, apiKey);
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: "Failed to get finance advice" });
    }
  });
`;

code = code.replace(/return server;\n}/, `${endpoints}\n  return server;\n}`);

fs.writeFileSync('server/routes.ts', code);
console.log("Added 4 new endpoints to routes.ts");
