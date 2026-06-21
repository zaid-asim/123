# Pitch Email: 6. Felix Rieseberg

## 6. Felix Rieseberg
*Lead for Claude Cowork & Claude Code Desktop, Anthropic*

### Context & Psychology Angle
* **Recipient Profile:** Engineering lead for Claude Cowork and Claude Code. Co-maintainer of Electron, former Slack and Notion engineering leader. Known for his "go one abstraction layer up" philosophy. Built the first version of Claude Cowork in 10 days.
* **Corporate OKRs:** Optimize developer experience in Claude Code, handle local-first workflows, and scale Model Context Protocol (MCP) integrations.
* **Psychological Hook:** Speak to desktop app engineering, Electron main-process IPC latencies, and local NPU offloading. Pitch a local-first speculative execution engine that makes Claude Code feel instantaneous by running edge routing gates on client hardware.

### Email

**Subject:** Local-First Speculative Execution: Accelerating Claude Code with Edge SLM Distillation

Dear Felix,

Your work on Claude Code and desktop agentic workflows has set the standard for developer tooling. Building the first version of Claude Cowork in 10 days—with the AI writing its own code—was a masterclass in modern developer velocity.

However, the developer experience for local-first agents remains bottlenecked by network latency and API costs. When Claude Code has to make a cloud round-trip just to determine routing (e.g., whether to execute a shell command, read a file, or prompt the user), the developer’s loop velocity drops.

We have engineered an orchestration framework that integrates with local NPUs to offload reasoning gates, serving as the perfect companion for local-first desktop agents.

I have attached our architectural deep-dive presentation (**`Swadesh_AI_Speculative_Orchestration.pdf`**), which outlines our local-first implementation benchmarks and Electron integration schemas. As detailed on Page 22, we showcase how running our local routing gate on client NPUs reduces perceived round-trip latency to under 20ms:
* **Local SLM Edge Distillation (LSED):** We compile routing decisions and context sketching into highly distilled, quantized 8B Small Language Models (SLMs) running locally on the developer's machine (leveraging Ryzen AI or Apple Silicon NPUs). Cloud APIs are called only when the local routing gate escalates to high-reasoning depth.
* **Speculative Streaming & Dynamic Patching (SS-DP):** The local agent streams an immediate speculative response to the terminal or editor. If background cloud audits detect a code syntax or logic error, the system pushes surgical diff patches to the specific code blocks using paragraph-level hashes, avoiding full file rewrites.
* **Model Context Protocol (MCP) Integration:** Our context-distillation sketcher outputs structured JSON schemas that align with MCP, allowing local tools to ingest metadata without bloating Claude's context window.

This architecture delivers a responsive, zero-latency developer experience while slashing API token costs. I would love to share our research and discuss how this speculative framework can enhance Claude Code’s developer loop.

Please refer to the attached PDF presentation for our benchmark details. Are you available for a quick chat next week?

Best regards,

[Your Name]  
Swadesh AI Research