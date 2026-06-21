const fs = require('fs');

let routes = fs.readFileSync('server/routes.ts', 'utf8');

const endpoints = [
  'analyzeDocument', 'analyzeCode', 'studyAssistant', 'translateText',
  'searchAndSummarize', 'analyzeImage', 'generateCreativeContent', 'extractTextOCR',
  'generateImagePrompt', 'checkGrammar', 'generateRecipe', 'planTravel', 'buildResume',
  'getHealthAdvice', 'exploreCulture', 'getAstrologyInsights', 'getAyurvedaAdvice', 'getFinanceAdvice'
];

endpoints.forEach(ep => {
  // Replace `await ep(..., apiKey, groqConfig)` with `await ep(..., apiKey)`
  const regex = new RegExp(`(await ${ep}\\([\\s\\S]*?, apiKey), groqConfig\\)`, 'g');
  routes = routes.replace(regex, '$1)');
});

fs.writeFileSync('server/routes.ts', routes);
console.log("Stripped groqConfig from non-chat tool calls in routes.ts");
