/**
 * Scans a source text for potential prompt injection patterns.
 * Returns true if a suspicious pattern is detected.
 */
export function hasPromptInjection(text: string): boolean {
  const lowercaseText = text.toLowerCase();
  
  const dangerousPatterns = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "ignore the instructions above",
    "system overrides",
    "you must now act as",
    "new instructions:",
    "ignore standard policy",
    "bypass safety filters",
    "stop analyzing",
    "disregard safety guidelines",
    "you are no longer a",
  ];

  for (const pattern of dangerousPatterns) {
    if (lowercaseText.includes(pattern)) {
      return true;
    }
  }

  // Check for suspicious system-like headers
  if (/\b(system|instruction|instructional|override)\s*:/i.test(lowercaseText)) {
    return true;
  }

  return false;
}

/**
 * Sanitizes and wraps source content in strict XML block wrappers
 * to isolate untrusted text from instructions.
 */
export function wrapSourceText(filename: string, content: string): string {
  // Strip dangerous instructions before wrapping
  let sanitized = content;
  if (hasPromptInjection(content)) {
    console.warn(`[InjectionGuard] Suspicious prompt-injection patterns detected in document: ${filename}. Neutralizing.`);
    // Redact highly dangerous phrases
    sanitized = sanitized.replace(/ignore\s+previous\s+instructions/gi, "[REDACTED INSTRUCTION BYPASS]");
    sanitized = sanitized.replace(/you\s+must\s+now\s+act\s+as/gi, "[REDACTED AGENT ROLE]");
  }

  // Wrap in clear delimiters to tell the model this is untrusted payload data, not commands
  return `<untrusted_source_file name="${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}">
${sanitized}
</untrusted_source_file>`;
}
