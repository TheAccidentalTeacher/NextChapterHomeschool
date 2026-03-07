// ============================================
// Portfolio PDF Export
// Decisions 74, 82, 68: Portfolio PDF is the
// primary assessment artifact
// ============================================

export interface PortfolioData {
  // Cover page
  studentName: string;
  civName: string;
  teamName: string;
  classPeriod: string;
  flagUrl?: string;

  // Role history
  roleHistory: {
    epoch: number;
    role: string;
    absent: boolean;
  }[];

  // All submissions
  submissions: {
    epoch: number;
    round: number;
    role: string;
    questionPrompt: string;
    selectedOption: string;
    justification: string;
    multiplier: number;
  }[];

  // Mythology creatures
  creatures: {
    name: string;
    description: string;
    epoch: number;
  }[];

  // Cultural gallery
  artArtifacts: {
    title: string;
    imageUrl: string;
    approved: boolean;
  }[];

  // Wonder history
  wonders: {
    name: string;
    contribution: number;
    completed: boolean;
    milestones: string[];
  }[];

  // Map snapshot
  mapSnapshotUrl?: string;

  // Resource arc
  resourceArc: {
    epoch: number;
    production: number;
    reach: number;
    legacy: number;
    resilience: number;
    population: number;
  }[];

  // Haiku history
  civHistory: string;

  // Final standings
  standings: {
    victoryType: string;
    rank: number;
    achieved: boolean;
  }[];
}

/**
 * Generate portfolio PDF HTML content.
 * Uses a structured HTML format that can be rendered by a PDF library
 * or printed via browser print dialog.
 */
export function generatePortfolioHTML(data: PortfolioData): string {
  const sections: string[] = [];

  // ---- 1. Cover Page ----
  sections.push(`
    <div class="page cover-page">
      ${data.flagUrl ? `<img src="${data.flagUrl}" class="flag-image" alt="Civilization Flag" />` : ""}
      <h1 class="civ-name">${escapeHtml(data.civName)}</h1>
      <p class="team-name">${escapeHtml(data.teamName)}</p>
      <div class="student-info">
        <p>${escapeHtml(data.studentName)}</p>
        <p>Period ${escapeHtml(data.classPeriod)}</p>
        <p>ClassCiv — Civilization Simulation</p>
      </div>
    </div>
  `);

  // ---- 2. Role History ----
  sections.push(`
    <div class="page">
      <h2>Role History</h2>
      <table class="data-table">
        <thead>
          <tr><th>Epoch</th><th>Role</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${data.roleHistory
            .map(
              (r) =>
                `<tr><td>${r.epoch}</td><td>${escapeHtml(r.role)}</td><td>${r.absent ? "Absent" : "Present"}</td></tr>`
            )
            .join("\n")}
        </tbody>
      </table>
    </div>
  `);

  // ---- 3. All Submissions ----
  const submissionPages = chunkArray(data.submissions, 4);
  for (const chunk of submissionPages) {
    sections.push(`
      <div class="page">
        <h2>Submissions</h2>
        ${chunk
          .map(
            (s) => `
          <div class="submission-card">
            <div class="submission-header">
              <span>Epoch ${s.epoch}, Round ${s.round}</span>
              <span>${escapeHtml(s.role)}</span>
              <span class="multiplier">${s.multiplier}×</span>
            </div>
            <p class="question">${escapeHtml(s.questionPrompt)}</p>
            <p class="answer"><strong>Answer:</strong> ${escapeHtml(s.selectedOption)}</p>
            <p class="justification"><strong>Justification:</strong> ${escapeHtml(s.justification)}</p>
          </div>
        `
          )
          .join("\n")}
      </div>
    `);
  }

  // ---- 4. Mythology Creatures ----
  if (data.creatures.length > 0) {
    sections.push(`
      <div class="page">
        <h2>Mythology Creatures</h2>
        ${data.creatures
          .map(
            (c) => `
          <div class="creature-card">
            <h3>${escapeHtml(c.name)} <small>(Epoch ${c.epoch})</small></h3>
            <p>${escapeHtml(c.description)}</p>
          </div>
        `
          )
          .join("\n")}
      </div>
    `);
  }

  // ---- 5. Cultural Gallery ----
  if (data.artArtifacts.length > 0) {
    sections.push(`
      <div class="page">
        <h2>Cultural Gallery</h2>
        <div class="gallery-grid">
          ${data.artArtifacts
            .map(
              (a) => `
            <div class="gallery-item">
              <img src="${a.imageUrl}" alt="${escapeHtml(a.title)}" class="gallery-image" />
              <p class="gallery-caption">${escapeHtml(a.title)}</p>
            </div>
          `
            )
            .join("\n")}
        </div>
      </div>
    `);
  }

  // ---- 6. Wonder History ----
  if (data.wonders.length > 0) {
    sections.push(`
      <div class="page">
        <h2>Wonder Contributions</h2>
        ${data.wonders
          .map(
            (w) => `
          <div class="wonder-card">
            <h3>${escapeHtml(w.name)} ${w.completed ? "✅" : "🔨"}</h3>
            <p>Contribution: ${w.contribution}%</p>
            ${w.milestones.length > 0 ? `<p>Milestones: ${w.milestones.join(", ")}</p>` : ""}
          </div>
        `
          )
          .join("\n")}
      </div>
    `);
  }

  // ---- 7. Map Snapshot ----
  if (data.mapSnapshotUrl) {
    sections.push(`
      <div class="page">
        <h2>Final Map</h2>
        <img src="${data.mapSnapshotUrl}" class="map-snapshot" alt="Final map state" />
      </div>
    `);
  }

  // ---- 8. Resource Arc ----
  sections.push(`
    <div class="page">
      <h2>Resource Arc</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Epoch</th><th>Prod</th><th>Reach</th><th>Legacy</th><th>Resil</th><th>Pop</th>
          </tr>
        </thead>
        <tbody>
          ${data.resourceArc
            .map(
              (r) =>
                `<tr><td>${r.epoch}</td><td>${r.production}</td><td>${r.reach}</td><td>${r.legacy}</td><td>${r.resilience}</td><td>${r.population}</td></tr>`
            )
            .join("\n")}
        </tbody>
      </table>
    </div>
  `);

  // ---- 9. Civilization History ----
  sections.push(`
    <div class="page">
      <h2>Civilization History</h2>
      <div class="history-text">
        ${data.civHistory
          .split("\n\n")
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("\n")}
      </div>
    </div>
  `);

  // ---- 10. Final Standings ----
  sections.push(`
    <div class="page">
      <h2>Final Standings</h2>
      <table class="data-table">
        <thead>
          <tr><th>Victory Type</th><th>Rank</th><th>Achieved</th></tr>
        </thead>
        <tbody>
          ${data.standings
            .map(
              (s) =>
                `<tr><td>${escapeHtml(s.victoryType)}</td><td>#${s.rank}</td><td>${s.achieved ? "🏆 Yes" : "No"}</td></tr>`
            )
            .join("\n")}
        </tbody>
      </table>
    </div>
  `);

  // Build full HTML document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Portfolio — ${escapeHtml(data.studentName)} — ${escapeHtml(data.civName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
    .page { page-break-after: always; padding: 40px; min-height: 100vh; }
    .cover-page { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; }
    .flag-image { max-width: 200px; max-height: 133px; margin-bottom: 24px; border: 2px solid #ffd700; }
    .civ-name { font-size: 36px; margin-bottom: 8px; color: #ffd700; }
    .team-name { font-size: 18px; opacity: 0.8; margin-bottom: 32px; }
    .student-info { font-size: 14px; opacity: 0.7; }
    .student-info p { margin: 4px 0; }
    h2 { font-size: 20px; margin-bottom: 16px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 4px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .data-table th, .data-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 11px; }
    .data-table th { background: #f8f9fa; font-weight: bold; }
    .data-table tr:nth-child(even) { background: #f8f9fa; }
    .submission-card { border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .submission-header { display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-bottom: 6px; }
    .multiplier { font-weight: bold; color: #2c3e50; }
    .question { font-style: italic; margin-bottom: 4px; }
    .answer { margin-bottom: 4px; }
    .justification { color: #555; font-size: 11px; }
    .creature-card { border-left: 3px solid #9b59b6; padding: 8px 12px; margin-bottom: 12px; }
    .creature-card h3 { font-size: 14px; color: #8e44ad; }
    .creature-card small { font-weight: normal; color: #999; }
    .gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .gallery-image { width: 100%; max-height: 200px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; }
    .gallery-caption { text-align: center; font-size: 10px; color: #666; margin-top: 4px; }
    .wonder-card { border: 1px solid #f0c40f; border-radius: 6px; padding: 10px; margin-bottom: 8px; background: #fffdf0; }
    .wonder-card h3 { font-size: 14px; color: #b8860b; }
    .map-snapshot { width: 100%; max-height: 500px; object-fit: contain; border: 1px solid #ddd; }
    .history-text p { margin-bottom: 12px; font-size: 13px; line-height: 1.7; text-indent: 24px; }
    @media print {
      .page { page-break-after: always; padding: 20px; min-height: auto; }
    }
  </style>
</head>
<body>
  ${sections.join("\n")}
</body>
</html>`;
}

// ---- Helpers ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  if (chunks.length === 0) chunks.push([]);
  return chunks;
}
