# Pitch Email: 13. Naveen Rao

## 13. Naveen Rao
*CEO & Co-founder, Unconventional AI*

### Context & Psychology Angle
* **Recipient Profile:** Co-founded MosaicML (acquired by Databricks) and left in September 2025 to launch Unconventional AI, focused on analog computing hardware to solve AI's energy and compute costs. Serves as advisor to Databricks.
* **Corporate OKRs:** Rebuild computing from first principles, bypass the silicon "energy wall," and build energy-efficient analog AI hardware.
* **Psychological Hook:** Position our software orchestration layer as the perfect algorithmic counterpart to his analog hardware vision. Show how minimizing digital logic transitions and optimizing data flow at the software layer supports his energy-reduction goals.

### Email

**Subject:** The Software Counterpart to Analog Hardware: Speculative Execution for Compute Reduction

Dear Naveen,

I’ve been following your career since Nervana and MosaicML, and your new venture, Unconventional AI, is tackling the most critical bottleneck in computing: the energy and cost limitations of silicon-based AI hardware.

As you develop analog computing systems to solve this physical bottleneck, there remains an immediate software-level challenge: how we orchestrate AI models to minimize token volume and compute load before they even reach the hardware layer.

We have built a speculative execution engine that achieves a **60% reduction in compute overhead** and a **4.5x improvement in execution speed** through algorithmic orchestration. We view this software layer as the perfect algorithmic counterpart to your analog hardware vision.

I have attached our technical presentation (**`Swadesh_AI_Speculative_Orchestration.pdf`**), which outlines our energy efficiency benchmarks and FLOPs reduction metrics. Page 35 of the PDF outlines how our token cascading and context compression minimize digital logic transitions, aligning directly with your physical energy-reduction goals.

Our orchestration framework implements:
1. **Speculative Streaming & Dynamic Patching (SS-DP):** We decouple user delivery from heavy reasoning audits. We stream a speculative draft response immediately, running verification and critic loops asynchronously. Revisions are pushed via block-level patches only when errors are detected.
2. **Context-Distillation Sketching (CDS):** We distill long-context inputs into structured JSON summaries, reducing the token footprint and memory load before processing.
3. **Dynamic Token Budget Cascading (TBC):** We enforce sliding token budgets across multi-agent chains, preventing quadratic compute scaling.

While Unconventional AI reimagines hardware architecture, this software orchestration framework provides an immediate path to reducing inference costs and latency on existing and next-generation systems. I would love to discuss how our software layer might align with your vision for the future of compute.

Please refer to the attached PDF presentation for our complete system diagrams. Are you available for a brief call next Thursday?

Sincerely,

[Your Name]  
Swadesh AI Research