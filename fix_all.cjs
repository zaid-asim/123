const fs = require('fs');

// 1. Fix the 4 frontend tool pages
const toolsPages = ['astrology.tsx', 'ayurveda.tsx', 'culture.tsx', 'finance.tsx'];
for (const page of toolsPages) {
  const filePath = `client/src/pages/tools/${page}`;
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<ToolActionFooter result=\{result\}/g, '<ToolActionFooter content={result}');
    fs.writeFileSync(filePath, content);
  }
}
console.log("Fixed frontend ToolActionFooter props");

// 2. Fix routes.ts backend missing vars and missing endpoints
let routes = fs.readFileSync('server/routes.ts', 'utf8');

// The generic template for missing variables in tools
const replaceHeaderCapture = `app.post("/api/tools/$1", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {`;

// We have tools like /api/tools/document, /api/tools/code, etc.
// Note: Some use (req: any, res)
routes = routes.replace(/app\.post\("\/api\/tools\/([^"]+)", async \(req:?.*?, res\) => \{\n\s*try \{/g, replaceHeaderCapture);

// Now all existing endpoints have apiKey and groqConfig defined.
// Wait, in my previous `scratch_update_groq.cjs` that failed, I didn't actually add groqConfig to the calls!
// Let's add groqConfig to all tool function calls if it's missing.
const endpoints = [
  'analyzeDocument', 'analyzeCode', 'studyAssistant', 'translateText',
  'searchAndSummarize', 'analyzeImage', 'generateCreativeContent', 'extractTextOCR',
  'generateImagePrompt', 'checkGrammar', 'generateRecipe', 'planTravel', 'buildResume',
  'getHealthAdvice', 'exploreCulture', 'getAstrologyInsights', 'getAyurvedaAdvice', 'getFinanceAdvice'
];

endpoints.forEach(ep => {
  // If it currently looks like `await fn(..., apiKey);`
  // We want to make it `await fn(..., apiKey, groqConfig);`
  const regex = new RegExp(`await ${ep}\\(([\\s\\S]*?), apiKey\\)`, 'g');
  routes = routes.replace(regex, `await ${ep}($1, apiKey, groqConfig)`);
});

// 3. Add the 4 missing endpoints for the new tools if they don't exist
const missingEndpointsTemplate = `
  app.post("/api/tools/culture", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { topic, action } = req.body;
      const result = await exploreCulture(topic, action || "general", apiKey, groqConfig);
      res.json({ result });
    } catch (error) {
      console.error("Culture error:", error);
      res.status(500).json({ error: "Failed to generate culture insights" });
    }
  });

  app.post("/api/tools/astrology", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query } = req.body;
      const result = await getAstrologyInsights(query, apiKey, groqConfig);
      res.json({ result });
    } catch (error) {
      console.error("Astrology error:", error);
      res.status(500).json({ error: "Failed to generate astrology insights" });
    }
  });

  app.post("/api/tools/ayurveda", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query, dosha } = req.body;
      const result = await getAyurvedaAdvice(query, dosha, apiKey, groqConfig);
      res.json({ result });
    } catch (error) {
      console.error("Ayurveda error:", error);
      res.status(500).json({ error: "Failed to generate ayurveda advice" });
    }
  });

  app.post("/api/tools/finance", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };
    try {
      const { query, topic } = req.body;
      const result = await getFinanceAdvice(query, topic, apiKey, groqConfig);
      res.json({ result });
    } catch (error) {
      console.error("Finance error:", error);
      res.status(500).json({ error: "Failed to generate finance advice" });
    }
  });
`;

if (!routes.includes("/api/tools/culture")) {
  routes = routes.replace("const httpServer = createServer(app);", missingEndpointsTemplate + "\n  const httpServer = createServer(app);");
}

fs.writeFileSync('server/routes.ts', routes);
console.log("Fixed routes.ts");
