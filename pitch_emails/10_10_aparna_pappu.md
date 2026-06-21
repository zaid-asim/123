# Pitch Email: 10. Aparna Pappu

## 10. Aparna Pappu
*VP and GM Advisor, Google Workspace / GenAI*

### Context & Psychology Angle
* **Recipient Profile:** Recently stepped down as GM of Workspace to a new GenAI role within Google. Workspace user base of 3 billion users, focusing on developer integration and collaboration.
* **Corporate OKRs:** Integrate Gemini deep into Google Workspace (Docs, Sheets, Gmail), improve user experience (UX), and manage the token cost of Workspace AI.
* **Psychological Hook:** Focus on user psychology and collaboration UX. Address layout safety, preventing Cumulative Layout Shift (CLS) during real-time AI document revisions, and managing context bloat across Gmail threads. Pitch "Saffron-Pulse Block Patching" as a way to build user trust.

### Email

**Subject:** Layout-Safe Speculative AI: Solving Layout Shifts and Token Costs in Workspace GenAI

Dear Aparna,

Your leadership in scaling Google Workspace to over 3 billion users proved that the success of collaboration tools depends on seamless, intuitive user experience. As Google integrates agentic AI deeper into Workspace, two major friction points emerge:
1. **Cumulative Layout Shift (CLS):** If an AI assistant dynamically revises or fact-checks a document in real-time, the moving text creates layout jumps that disrupt the user’s reading flow.
2. **Context Bloat:** Processing multi-document context histories in Workspace (Docs, Sheets, Gmail) spikes API token costs and slows down response times.

We have built a speculative execution engine that solves these issues, delivering a responsive, layout-safe experience for enterprise collaboration platforms.

I have attached our architectural presentation (**`Swadesh_AI_Speculative_Orchestration.pdf`**), detailing our user experience frameworks and layout-safety telemetry. Page 31 of the PDF demonstrates how our block-level patching protocols eliminate visual jitter and minimize cognitive load in collaboration threads.

Our architecture features:
* **Saffron-Pulse Block Patching:** We split streamed responses into individual paragraph nodes and compute their `djb2` block hashes. When background verification edits are pushed, the client-side UI performs a surgical, block-level patch highlighted by a temporary saffron glow. This prevents layout jumps and protects user cognitive load.
* **Context-Distillation Sketching (CDS):** We pre-summarize large document histories into a compact, factual JSON sketch, keeping token footprints minimal and maintaining real-time response speeds.
* **Epistemic Timestamp Invalidation (ETI):** If a user edits a document while the AI is processing, our ETI framework detects the state change and aborts stale background writes, preventing context pollution.

I believe this speculative UX framework is critical for the next stage of Google Workspace's generative AI roadmap. I would love to share our design framework and explore how we can collaborate.

Please refer to the attached PDF presentation for our complete system diagrams. Are you available for a brief call next week?

Warm regards,

[Your Name]  
Swadesh AI Research