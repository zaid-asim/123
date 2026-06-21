const fs = require('fs');

// 1. Update gemini.ts
let gemini = fs.readFileSync('server/gemini.ts', 'utf8');

// Replace getClient
const newGetClient = `function getClient(apiKey?: string) {
  return apiKey ? new GoogleGenAI({ apiKey }) : ai;
}

export type GroqConfig = {
  useGroq: boolean;
  groqApiKey?: string;
  groqModel?: string;
};

async function generateWithGroq(contents: string, systemInstruction: string, config: GroqConfig, temperature: number) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const model = config.groqModel || "llama3-8b-8192";
  const apiKey = config.groqApiKey;

  if (!apiKey) throw new Error("Groq API key is missing");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${apiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: contents }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", errorText);
    throw new Error(\`Groq API error: \${response.status}\`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}`;

gemini = gemini.replace(/function getClient\(customKey\?: string\) \{\n  return customKey \? new GoogleGenAI\(\{ apiKey: customKey \}\) : ai;\n\}/, newGetClient);

// Add groqConfig to signatures
gemini = gemini.replace(/apiKey\?: string\): Promise<string> \{/g, 'apiKey?: string, groqConfig?: GroqConfig): Promise<string> {');
gemini = gemini.replace(/apiKey\?: string\): Promise<(.*?)> \{/g, 'apiKey?: string, groqConfig?: GroqConfig): Promise<$1> {');
// Special case for chat which has apiKey?: string on a new line
gemini = gemini.replace(/apiKey\?: string\n\): Promise<string> \{/, 'apiKey?: string,\n  groqConfig?: GroqConfig\n): Promise<string> {');

// In every function, we replace the `await getClient(apiKey).models.generateContent({ ... })` with a wrapper.
// But writing regex to replace the complex block is hard.
// Let's replace `const response = await getClient(apiKey).models.generateContent({` 
// with something that checks groqConfig.

const generateContentPattern = /const response = await getClient\(apiKey\)\.models\.generateContent\(\{\n\s*model: "gemini-2\.5-flash",\n\s*contents: (.*?),\n\s*config: \{\n\s*systemInstruction: (.*?),\n\s*temperature(.*?),?([\s\S]*?)\},\n\s*\}\);/g;

gemini = gemini.replace(generateContentPattern, (match, contents, sys, temp, rest) => {
  return \`let responseText = "";
    if (groqConfig?.useGroq) {
      responseText = await generateWithGroq(\${contents}, \${sys}, groqConfig, \${temp.replace(/,$/, '') || "0.7"});
    } else {
      const response = await getClient(apiKey).models.generateContent({
        model: "gemini-2.5-flash",
        contents: \${contents},
        config: {
          systemInstruction: \${sys},
          temperature\${temp},\${rest}},
      });
      responseText = response.text || "";
    }\`;
});

// Since the original code does `try { return response.text || "..."; } catch (e) { ... }`, we need to change those too.
// We'll replace `response.text` with `responseText`.
gemini = gemini.replace(/response\.text/g, 'responseText');
gemini = gemini.replace(/if \(response\.candidates && response\.candidates\.length > 0\) \{/g, 'if (!groqConfig?.useGroq && typeof response !== "undefined" && response.candidates && response.candidates.length > 0) {');

fs.writeFileSync('server/gemini.ts', gemini);
console.log("Updated gemini.ts");

// 2. Update routes.ts
let routes = fs.readFileSync('server/routes.ts', 'utf8');

// Add the extraction of headers
routes = routes.replace(
  /const apiKey = req.headers\["x-gemini-api-key"\] as string \| undefined;/g,
  \`const apiKey = req.headers["x-gemini-api-key"] as string | undefined;
    const groqConfig = {
      useGroq: req.headers["x-use-groq"] === "true",
      groqApiKey: req.headers["x-groq-api-key"] as string | undefined,
      groqModel: req.headers["x-groq-model"] as string | undefined,
    };\`
);

// Append groqConfig to all function calls.
// E.g., `await chat(..., apiKey)` -> `await chat(..., apiKey, groqConfig)`
const endpoints = [
  'chat', 'analyzeDocument', 'analyzeCode', 'studyAssistant', 'translateText',
  'searchAndSummarize', 'analyzeImage', 'generateCreativeContent', 'extractTextOCR',
  'generateImagePrompt', 'checkGrammar', 'generateRecipe', 'planTravel', 'buildResume',
  'getHealthAdvice', 'exploreCulture', 'getAstrologyInsights', 'getAyurvedaAdvice', 'getFinanceAdvice'
];

endpoints.forEach(ep => {
  const regex = new RegExp(\`await \${ep}\\(([\s\S]*?), apiKey\\)\`, 'g');
  routes = routes.replace(regex, \`await \${ep}($1, apiKey, groqConfig)\`);
});

fs.writeFileSync('server/routes.ts', routes);
console.log("Updated routes.ts");
