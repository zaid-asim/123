const fs = require('fs');

let code = fs.readFileSync('server/gemini.ts', 'utf8');

// 1. Add getClient function
code = code.replace(
  'const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });',
  'const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });\n\nfunction getClient(customKey?: string) {\n  return customKey ? new GoogleGenAI({ apiKey: customKey }) : ai;\n}'
);

// 2. Add apiKey parameter to function signatures
code = code.replace(/export async function ([a-zA-Z0-9_]+)\((.*?)\): Promise<string> {/g, 'export async function $1($2, apiKey?: string): Promise<string> {');
code = code.replace(/export async function searchAndSummarize\((.*?)\): Promise<(.*?)> {/g, 'export async function searchAndSummarize($1, apiKey?: string): Promise<$2> {');

// 3. Special case for chat function which spans multiple lines. Let's fix chat specifically if the regex didn't catch it correctly.
code = code.replace(/mode: "chat" \| "voice" = "chat",\n  settings\?: any\n\): Promise<string> {/, 'mode: "chat" | "voice" = "chat",\n  settings?: any,\n  apiKey?: string\n): Promise<string> {');

// 4. Replace ai.models.generateContent
code = code.replace(/ai\.models\.generateContent/g, 'getClient(apiKey).models.generateContent');

fs.writeFileSync('server/gemini.ts', code);
console.log("Updated gemini.ts successfully.");
