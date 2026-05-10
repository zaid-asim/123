const fs = require('fs');

let code = fs.readFileSync('server/routes.ts', 'utf8');

// The best way is to modify the AST or do simple replacements.
// Since all endpoints that call gemini.ts follow a pattern:
// app.post("/api/...", async (req, res) => {
//    ...
//    const response = await chat(...)
// });
// We will replace `app.post("/api/chat", async (req, res) => {`
// with `app.post("/api/chat", async (req, res) => {\n    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;`
// And pass `apiKey` to `chat(..., apiKey)`.

// Since it's fragile with simple regex, I'll do manual precise replacements for `routes.ts`.

const endpoints = [
  { name: 'chat', url: '/api/chat', hasSettings: true },
  { name: 'chat', url: '/api/voice-chat', hasSettings: true },
  { name: 'analyzeDocument', url: '/api/analyze-document', args: 'data.content, data.action, data.targetLanguage' },
  { name: 'analyzeCode', url: '/api/analyze-code', args: 'data.code, data.action, data.language, data.prompt' },
  { name: 'studyAssistant', url: '/api/study-assistant', args: 'data.topic, data.level, data.mode' },
  { name: 'translateText', url: '/api/translate', args: 'data.text, data.sourceLanguage, data.targetLanguage, data.tone' },
  { name: 'searchAndSummarize', url: '/api/search', args: 'data.query, data.type' },
  { name: 'analyzeImage', url: '/api/analyze-image', args: 'data.imageBase64, data.action' },
  { name: 'generateCreativeContent', url: '/api/creative', args: 'data.topic, data.type' },
  { name: 'extractTextOCR', url: '/api/ocr', args: 'data.imageBase64, data.mimeType' },
  { name: 'generateImagePrompt', url: '/api/image-prompt', args: 'data.prompt, data.style' },
  { name: 'checkGrammar', url: '/api/grammar', args: 'data.text, data.mode' },
  { name: 'generateRecipe', url: '/api/recipe', args: 'data.query, data.dietary, data.cuisine' },
  { name: 'planTravel', url: '/api/travel', args: 'data.destination, data.duration, data.budget, data.interests' },
  { name: 'buildResume', url: '/api/resume', args: 'data.data' },
  { name: 'getHealthAdvice', url: '/api/health-advice', args: 'data.symptom, data.age, data.type' }
];

for (const ep of endpoints) {
  if (ep.hasSettings) {
    code = code.replace(
      `app.post("${ep.url}", async (req, res) => {
    try {`,
      `app.post("${ep.url}", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {`
    );
    code = code.replace(
      /const response = await chat\(([\s\S]*?)data\.settings\n\s*\);/,
      'const response = await chat($1data.settings,\n        apiKey\n      );'
    );
  } else {
    code = code.replace(
      `app.post("${ep.url}", async (req, res) => {
    try {`,
      `app.post("${ep.url}", async (req, res) => {
    const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    try {`
    );
    code = code.replace(
      new RegExp(`const (response|result) = await ${ep.name}\\((.*?)\\);`),
      `const $1 = await ${ep.name}($2, apiKey);`
    );
  }
}

fs.writeFileSync('server/routes.ts', code);
console.log("Updated routes.ts successfully.");
