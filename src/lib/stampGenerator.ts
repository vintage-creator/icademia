/**
 * stampGenerator.ts
 * Canvas rendering logic for iCademia school stamps and official seals.
 * Supports:
 * 1. "circle"    - Classic circular rubber ink stamp with curved arcs & stars.
 * 2. "oval"      - Prestigious elliptical seal — elegant, used by many institutions.
 * 3. "rectangle" - Official rectangular box stamp with header, double rules & signature lines.
 */

export interface StampOpts {
  schoolName: string;
  city: string;
  logoUrl?: string;
  inkColor: string;
  shape?: "circle" | "oval" | "rectangle";
  subText?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Draw a 5-point star centred at (cx, cy). */
function star5(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/** Draw a 6-point rosette/snowflake decoration. */
function rosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(
      cx + (r * 0.55) * Math.cos(angle),
      cy + (r * 0.55) * Math.sin(angle),
      r * 0.45,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Render text character-by-character along a circular arc. */
function arcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  midAngleDeg: number,
  flip: boolean,
) {
  const chars = [...text.toUpperCase()];
  const GAP = 2.2;

  let totalW = chars.reduce((s, c) => s + ctx.measureText(c).width + GAP, 0) - GAP;
  const totalArc = totalW / radius;
  const midAngle = (midAngleDeg * Math.PI) / 180;
  let a = midAngle - totalArc / 2;

  chars.forEach((ch) => {
    const cw = ctx.measureText(ch).width + GAP;
    a += cw / (2 * radius);
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += cw / (2 * radius);
  });
}

/**
 * Render text along an ELLIPSE arc.
 * t = parameter angle in radians; point = (cx + rx*cos(t), cy + ry*sin(t)).
 * We distribute characters by arc-length approximation.
 */
function arcTextEllipse(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startT: number,
  endT: number,
  flip: boolean,
) {
  const chars = [...text.toUpperCase()];
  const GAP = 2.0;
  const steps = 200;
  const dt = (endT - startT) / steps;

  // Pre-compute cumulative arc-length table
  const cumLen: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const t0 = startT + (i - 1) * dt;
    const t1 = startT + i * dt;
    const dx = rx * Math.cos(t1) - rx * Math.cos(t0);
    const dy = ry * Math.sin(t1) - ry * Math.sin(t0);
    cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const totalArcLen = cumLen[steps];

  // Total text width
  const totalTextW = chars.reduce((s, c) => s + ctx.measureText(c).width + GAP, 0) - GAP;

  // Center the text
  let dist = (totalArcLen - totalTextW) / 2;

  // Lookup t for a given cumulative arc-length
  const tAtLen = (len: number) => {
    let lo = 0, hi = steps;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumLen[mid] < len) lo = mid + 1;
      else hi = mid;
    }
    return startT + lo * dt;
  };

  chars.forEach((ch) => {
    const cw = ctx.measureText(ch).width;
    const t = tAtLen(dist + cw / 2);
    const x = cx + rx * Math.cos(t);
    const y = cy + ry * Math.sin(t);
    const tx = -rx * Math.sin(t);
    const ty = ry * Math.cos(t);
    const tangentAngle = Math.atan2(ty, tx);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tangentAngle + (flip ? Math.PI : 0));
    ctx.textAlign = "center";
    ctx.textBaseline = flip ? "top" : "bottom";
    ctx.fillText(ch, 0, 0);
    ctx.restore();

    dist += cw + GAP;
  });
}

/** Extract up to 3 initials from a school name. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function drawMonogram(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  name: string,
  ink: string,
  size = 36,
) {
  const mono = initials(name);
  const fs = mono.length > 2 ? size * 0.8 : size;
  ctx.save();
  ctx.font = `900 ${fs}px "Outfit", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.fillText(mono, cx, cy);
  ctx.restore();
}

/** Subtle ink bleed & distressed rubber stamp effect. */
function applyInkDistress(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  // Scatter tiny random specks to simulate rubber stamp pressing on paper
  for (let i = 0; i < 90; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    const rw = Math.random() * 2 + 0.5;
    ctx.fillRect(rx, ry, rw, rw);
  }
  ctx.restore();
}

// ── Renderers ──────────────────────────────────────────────────────────────────

/** 1. CIRCULAR RUBBER STAMP — premium redesign with double outer ring & decorative centre */
async function renderCircle(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const R  = 136;   // Outer radius
  const R2 = 120;   // Inner ring 1
  const R3 = 116;   // Inner ring 2 (tight double-ring look)
  const ink = opts.inkColor;
  const labelText = opts.subText || "OFFICIAL";

  ctx.globalAlpha = 0.93;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // ── Outer ring (thick)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // ── Double inner ring for a premium engraved look
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, R2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, R3, 0, Math.PI * 2);
  ctx.stroke();

  // ── Four corner stars (at 0°, 90°, 180°, 270°)
  const starR = (R + R2) / 2;
  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((angle) => {
    star5(ctx, cx + starR * Math.cos(angle), cy + starR * Math.sin(angle), 5.5, 2.5);
  });

  // ── Top Arc: School Name (between outer + inner ring)
  const nameLen = Math.max(opts.schoolName.length, 1);
  const fsTop = Math.max(9, Math.min(13, Math.floor((R * Math.PI * 0.62) / nameLen)));
  ctx.font = `900 ${fsTop}px "Outfit", "Figtree", Arial, sans-serif`;
  arcText(ctx, opts.schoolName, cx, cy, R - 9, -90, false);

  // ── Bottom Arc: City
  const cityLen = Math.max(opts.city.length, 1);
  const fsBot = Math.max(8, Math.min(12, Math.floor((R * Math.PI * 0.55) / cityLen)));
  ctx.font = `700 ${fsBot}px "Outfit", "Figtree", Arial, sans-serif`;
  arcText(ctx, opts.city, cx, cy, R - 9, 90, true);

  // ── Centre Logo or Monogram
  const logoY = cy - 14;
  const logoSz = 58;

  if (opts.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = opts.logoUrl!;
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, logoY, logoSz / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - logoSz / 2, logoY - logoSz / 2, logoSz, logoSz);
      ctx.restore();
    } catch {
      drawMonogram(ctx, cx, logoY, opts.schoolName, ink);
    }
  } else {
    drawMonogram(ctx, cx, logoY, opts.schoolName, ink);
  }

  // ── Thin separator line
  const sepY = cy + 10;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 38, sepY);
  ctx.lineTo(cx + 38, sepY);
  ctx.stroke();

  // ── Sub-label (spaced caps)
  const officialY = cy + 24;
  ctx.font = `800 9px "Outfit", "Figtree", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const labelGap = 3.5;
  let totalLblW = labelText.split("").reduce((s, c) => s + ctx.measureText(c).width + labelGap, 0) - labelGap;
  let lx = cx - totalLblW / 2;
  labelText.split("").forEach((ch) => {
    const cw = ctx.measureText(ch).width;
    ctx.fillText(ch, lx + cw / 2, officialY);
    lx += cw + labelGap;
  });

  // ── Side dashes flanking label
  ctx.lineWidth = 0.7;
  const margin = totalLblW / 2 + 5;
  [[cx - margin - 8, cx - margin], [cx + margin, cx + margin + 8]].forEach(([x1, x2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, officialY);
    ctx.lineTo(x2, officialY);
    ctx.stroke();
  });

  applyInkDistress(ctx, W, H);
}

/** 2. OVAL / ELLIPTICAL SEAL — prestigious, elegant, widely used by institutions */
async function renderOval(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const rx  = 145;  // Horizontal semi-axis
  const ry  = 110;  // Vertical semi-axis (makes it oval)
  const rx2 = 131;  // Inner oval 1
  const ry2 = 96;
  const rx3 = 126;  // Inner oval 2 (tight double border)
  const ry3 = 91;
  const ink = opts.inkColor;
  const labelText = opts.subText || "OFFICIAL";

  ctx.globalAlpha = 0.93;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // ── Outer oval (thick)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── Double inner oval ring
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx3, ry3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── Side decorations (stars at left and right of ellipse rim)
  const sidePts = [
    { x: cx - (rx + rx2) / 2, y: cy },
    { x: cx + (rx + rx2) / 2, y: cy },
  ];
  sidePts.forEach((p) => star5(ctx, p.x, p.y, 5.5, 2.5));

  // ── Top arc text (school name) along the TOP half of the outer oval
  // t = -π to 0 goes left→right along the top
  const nameLen = Math.max(opts.schoolName.length, 1);
  const fsTop = Math.max(9, Math.min(13, Math.floor((2 * rx * Math.PI * 0.55) / nameLen)));
  ctx.font = `900 ${fsTop}px "Outfit", "Figtree", Arial, sans-serif`;
  arcTextEllipse(ctx, opts.schoolName, cx, cy, rx - 9, ry - 9, -Math.PI + 0.1, -0.1, false);

  // ── Bottom arc text (city) along the BOTTOM half
  const cityLen = Math.max(opts.city.length, 1);
  const fsBot = Math.max(8, Math.min(12, Math.floor((2 * rx * Math.PI * 0.5) / cityLen)));
  ctx.font = `700 ${fsBot}px "Outfit", "Figtree", Arial, sans-serif`;
  arcTextEllipse(ctx, opts.city, cx, cy, rx - 9, ry - 9, 0.1, Math.PI - 0.1, true);

  // ── Centre logo / monogram
  const logoY = cy - 10;
  const logoSz = 54;

  if (opts.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = opts.logoUrl!;
      });
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, logoY, logoSz / 2, logoSz / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - logoSz / 2, logoY - logoSz / 2, logoSz, logoSz);
      ctx.restore();
    } catch {
      drawMonogram(ctx, cx, logoY, opts.schoolName, ink);
    }
  } else {
    drawMonogram(ctx, cx, logoY, opts.schoolName, ink);
  }

  // ── Separator line
  const sepY = cy + 8;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 38, sepY);
  ctx.lineTo(cx + 38, sepY);
  ctx.stroke();

  // ── Sub-label
  const officialY = cy + 22;
  ctx.font = `800 9px "Outfit", "Figtree", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const labelGap = 3.5;
  let totalLblW = labelText.split("").reduce((s, c) => s + ctx.measureText(c).width + labelGap, 0) - labelGap;
  let lx = cx - totalLblW / 2;
  labelText.split("").forEach((ch) => {
    const cw = ctx.measureText(ch).width;
    ctx.fillText(ch, lx + cw / 2, officialY);
    lx += cw + labelGap;
  });

  // ── Dash flankers
  ctx.lineWidth = 0.7;
  const margin = totalLblW / 2 + 5;
  [[cx - margin - 8, cx - margin], [cx + margin, cx + margin + 8]].forEach(([x1, x2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, officialY);
    ctx.lineTo(x2, officialY);
    ctx.stroke();
  });

  applyInkDistress(ctx, W, H);
}

/** 3. RECTANGULAR BOX RUBBER STAMP */
async function renderRectangle(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const boxW = 260;
  const boxH = 150;
  const left = cx - boxW / 2;
  const top = cy - boxH / 2;
  const ink = opts.inkColor;
  const labelText = (opts.subText || "OFFICIAL STAMP").toUpperCase();

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // Outer Border Box
  ctx.lineWidth = 4;
  ctx.strokeRect(left, top, boxW, boxH);

  // Inner Border Box (Double line look)
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left + 5, top + 5, boxW - 10, boxH - 10);

  // Top Header Box (School Name)
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left + 5, top + 42);
  ctx.lineTo(left + boxW - 5, top + 42);
  ctx.stroke();

  // Header Text
  const nameLen = Math.max(opts.schoolName.length, 1);
  const fsName = Math.max(11, Math.min(15, Math.floor(220 / (nameLen * 0.6))));
  ctx.font = `900 ${fsName}px "Outfit", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.schoolName.toUpperCase(), cx, top + 24);

  // Middle Section (Logo/Monogram + SubText)
  const midY = top + 80;
  const logoSz = 44;

  if (opts.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = opts.logoUrl!;
      });
      ctx.drawImage(img, left + 20, midY - logoSz / 2, logoSz, logoSz);
    } catch {
      drawMonogram(ctx, left + 40, midY, opts.schoolName, ink, 28);
    }
  } else {
    drawMonogram(ctx, left + 40, midY, opts.schoolName, ink, 28);
  }

  // Middle Text Block
  const textLeft = left + (opts.logoUrl ? 80 : 75);
  ctx.textAlign = "left";
  ctx.font = `900 13px "Outfit", Arial, sans-serif`;
  ctx.fillText(labelText, textLeft, midY - 10);

  ctx.font = `700 9px "Outfit", Arial, sans-serif`;
  ctx.fillText("VERIFIED ACADEMIC RECORD", textLeft, midY + 8);

  // Bottom Line & Footer (City + Date)
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left + 5, top + 115);
  ctx.lineTo(left + boxW - 5, top + 115);
  ctx.stroke();

  ctx.font = `800 10px "Outfit", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`LOCATION: ${opts.city.toUpperCase()}`, left + 16, top + 132);

  ctx.textAlign = "right";
  ctx.fillText("DATE: ____________", left + boxW - 16, top + 132);

  applyInkDistress(ctx, W, H);
}

// ── Main Render Entry ─────────────────────────────────────────────────────────

export async function renderStamp(
  canvas: HTMLCanvasElement,
  opts: StampOpts,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // Clear with full transparency
  ctx.clearRect(0, 0, W, H);

  const shape = opts.shape || "circle";

  if (shape === "oval") {
    await renderOval(ctx, opts, W, H);
  } else if (shape === "rectangle") {
    await renderRectangle(ctx, opts, W, H);
  } else {
    await renderCircle(ctx, opts, W, H);
  }
}
