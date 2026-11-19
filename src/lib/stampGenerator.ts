/**
 * stampGenerator.ts
 * High-definition Canvas rendering engine for authentic institutional school stamps & official seals.
 *
 * Designed to meet Nigerian & international academic standards:
 * - Concentric double rings & beaded/serrated security borders
 * - Precision arc text geometry with uppercase letter-spacing
 * - Heraldic academic crests (open book, laurels, shield & torch)
 * - Authentic date & examination office ribbons
 * - Microscopic rubber stamp distress & ink bleed physics
 */

export interface StampOpts {
  schoolName: string;
  city: string;
  logoUrl?: string;
  inkColor: string;
  shape?: "circle" | "oval" | "rectangle" | "rosette";
  subText?: string;
  motto?: string;
  includeDate?: boolean;
}

// ── COLOR PRESETS ─────────────────────────────────────────────────────────────

export const INK_PALETTES = [
  { label: "Royal Blue", color: "#1a3680", desc: "Standard UK/Commonwealth school ink" },
  { label: "Deep Navy", color: "#0c2340", desc: "Executive institutional navy" },
  { label: "Scarlet Red", color: "#991b1b", desc: "Official verification & exam stamp" },
  { label: "Forest Green", color: "#14532d", desc: "Administrative clearance ink" },
  { label: "Imperial Purple", color: "#581c87", desc: "Chancellor / Principal seal ink" },
  { label: "Rich Black", color: "#18181b", desc: "Classic archival carbon black" },
];

// ── VECTOR DRAWING HELPERS ────────────────────────────────────────────────────

/** Draw a sharp 5-pointed star. */
function drawStar5(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  fill = true,
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
  if (fill) ctx.fill();
  else ctx.stroke();
}

/** Draw beaded / dotted ring along a circle for security seal effect. */
function drawBeadedCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dotCount = 56,
  dotRadius = 1.4,
) {
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw beaded / dotted ring along an ellipse. */
function drawBeadedEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  dotCount = 64,
  dotRadius = 1.4,
) {
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw serrated / 32-point rosette outer scalloped border. */
function drawRosetteBorder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points = 36,
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

/** Precision curved text along a circular arc with letter-spacing. */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  midAngleDeg: number,
  flip: boolean,
  letterSpacing = 2.4,
) {
  if (!text) return;
  const chars = [...text.toUpperCase().trim()];
  if (chars.length === 0) return;

  const glyphWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const maximumArcWidth = Math.PI * radius * 0.9;
  const effectiveSpacing =
    chars.length > 1
      ? Math.max(0, Math.min(letterSpacing, (maximumArcWidth - glyphWidth) / (chars.length - 1)))
      : 0;
  const totalWidth = glyphWidth + effectiveSpacing * Math.max(0, chars.length - 1);
  const totalArc = totalWidth / radius;
  const midAngle = (midAngleDeg * Math.PI) / 180;
  let angle = midAngle - totalArc / 2;

  chars.forEach((ch) => {
    const charW = ctx.measureText(ch).width + effectiveSpacing;
    angle += charW / (2 * radius);
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += charW / (2 * radius);
  });
}

/** Precision curved text along an ellipse arc. */
function drawEllipseArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startT: number,
  endT: number,
  flip: boolean,
  letterSpacing = 2.0,
) {
  if (!text) return;
  const chars = [...text.toUpperCase().trim()];
  if (chars.length === 0) return;

  const steps = 240;
  const dt = (endT - startT) / steps;
  const cumLen: number[] = [0];

  for (let i = 1; i <= steps; i++) {
    const t0 = startT + (i - 1) * dt;
    const t1 = startT + i * dt;
    const dx = rx * Math.cos(t1) - rx * Math.cos(t0);
    const dy = ry * Math.sin(t1) - ry * Math.sin(t0);
    cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }

  const totalArcLen = cumLen[steps];
  const glyphWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
  const effectiveSpacing =
    chars.length > 1
      ? Math.max(0, Math.min(letterSpacing, (totalArcLen * 0.94 - glyphWidth) / (chars.length - 1)))
      : 0;
  const totalTextW = glyphWidth + effectiveSpacing * Math.max(0, chars.length - 1);
  let dist = Math.max(0, (totalArcLen - totalTextW) / 2);

  const getT = (targetLen: number) => {
    let lo = 0, hi = steps;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumLen[mid] < targetLen) lo = mid + 1;
      else hi = mid;
    }
    return startT + lo * dt;
  };

  chars.forEach((ch) => {
    const cw = ctx.measureText(ch).width;
    const t = getT(dist + cw / 2);
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

    dist += cw + effectiveSpacing;
  });
}

/** Draw heraldic academic coat of arms (Shield, open book, torch, laurels). */
function drawAcademicCoatOfArms(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size = 64,
  ink: string,
) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.4;

  const s = size / 64;

  // ── Heraldic Shield
  ctx.beginPath();
  ctx.moveTo(cx - 20 * s, cy - 22 * s);
  ctx.lineTo(cx + 20 * s, cy - 22 * s);
  ctx.lineTo(cx + 20 * s, cy + 2 * s);
  ctx.bezierCurveTo(cx + 20 * s, cy + 18 * s, cx, cy + 26 * s, cx, cy + 28 * s);
  ctx.bezierCurveTo(cx, cy + 26 * s, cx - 20 * s, cy + 18 * s, cx - 20 * s, cy + 2 * s);
  ctx.closePath();
  ctx.stroke();

  // Inner shield border
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 16 * s, cy - 19 * s);
  ctx.lineTo(cx + 16 * s, cy - 19 * s);
  ctx.lineTo(cx + 16 * s, cy + 1 * s);
  ctx.bezierCurveTo(cx + 16 * s, cy + 14 * s, cx, cy + 21 * s, cx, cy + 23 * s);
  ctx.bezierCurveTo(cx, cy + 21 * s, cx - 16 * s, cy + 14 * s, cx - 16 * s, cy + 1 * s);
  ctx.closePath();
  ctx.stroke();

  // ── Open Book inside Shield
  const bookY = cy - 6 * s;
  ctx.beginPath();
  // Left page
  ctx.moveTo(cx, bookY + 6 * s);
  ctx.quadraticCurveTo(cx - 6 * s, bookY + 8 * s, cx - 12 * s, bookY + 6 * s);
  ctx.lineTo(cx - 12 * s, bookY - 4 * s);
  ctx.quadraticCurveTo(cx - 6 * s, bookY - 2 * s, cx, bookY - 4 * s);
  ctx.closePath();
  ctx.stroke();

  // Right page
  ctx.beginPath();
  ctx.moveTo(cx, bookY + 6 * s);
  ctx.quadraticCurveTo(cx + 6 * s, bookY + 8 * s, cx + 12 * s, bookY + 6 * s);
  ctx.lineTo(cx + 12 * s, bookY - 4 * s);
  ctx.quadraticCurveTo(cx + 6 * s, bookY - 2 * s, cx, bookY - 4 * s);
  ctx.closePath();
  ctx.stroke();

  // Book spine & page lines
  ctx.beginPath();
  ctx.moveTo(cx, bookY - 4 * s);
  ctx.lineTo(cx, bookY + 6 * s);
  ctx.moveTo(cx - 9 * s, bookY);
  ctx.lineTo(cx - 3 * s, bookY + 1 * s);
  ctx.moveTo(cx + 3 * s, bookY + 1 * s);
  ctx.lineTo(cx + 9 * s, bookY);
  ctx.stroke();

  // ── Torch of Knowledge above Shield
  ctx.beginPath();
  ctx.moveTo(cx - 2 * s, cy - 22 * s);
  ctx.lineTo(cx - 4 * s, cy - 29 * s);
  ctx.lineTo(cx + 4 * s, cy - 29 * s);
  ctx.lineTo(cx + 2 * s, cy - 22 * s);
  ctx.closePath();
  ctx.fill();

  // Flame
  ctx.beginPath();
  ctx.moveTo(cx, cy - 36 * s);
  ctx.bezierCurveTo(cx + 5 * s, cy - 32 * s, cx + 4 * s, cy - 29 * s, cx, cy - 29 * s);
  ctx.bezierCurveTo(cx - 4 * s, cy - 29 * s, cx - 5 * s, cy - 32 * s, cx, cy - 36 * s);
  ctx.fill();

  // ── Laurel branches on left and right
  const drawLaurel = (dir: 1 | -1) => {
    for (let i = 0; i < 5; i++) {
      const ly = cy + (i * 7 - 12) * s;
      const lx = cx + dir * (23 + i * 1.5) * s;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 4.5 * s, 2.2 * s, (dir * Math.PI) / 4 + i * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawLaurel(-1);
  drawLaurel(1);

  ctx.restore();
}

/** Authentic rubber ink distress, porous texture & microscopic bleed. */
function applyRubberInkPhysics(ctx: CanvasRenderingContext2D, W: number, H: number, inkColor: string) {
  ctx.save();

  // 1. Random microscopic ink voids / paper texture gaps
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  for (let i = 0; i < 140; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    const rSize = Math.random() * 2.2 + 0.4;
    ctx.fillRect(rx, ry, rSize, rSize);
  }

  // 2. Fine rubber stamp pressure variation
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
  for (let i = 0; i < 40; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.random() * 8 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Subtle edge ink bleed overlay
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = inkColor;
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 60; i++) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    ctx.fillRect(rx, ry, Math.random() * 1.5, Math.random() * 1.5);
  }

  ctx.restore();
}

// ── STYLE 1: ROYAL ACADEMIC CIRCLE SEAL ─────────────────────────────────────────

async function renderCircleStamp(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const R_OUTER = 142;
  const R_BEADED = 132;
  const R_INNER_1 = 124;
  const R_INNER_2 = 82;
  const R_CORE = 77;
  const ink = opts.inkColor;
  const subText = (opts.subText || "OFFICIAL SEAL").toUpperCase();
  const currentYear = new Date().getFullYear();

  ctx.globalAlpha = 0.94;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // 1. Heavy Outer Solid Ring
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Beaded Security Ring
  drawBeadedCircle(ctx, cx, cy, R_BEADED, 60, 1.4);

  // 3. Middle Dividing Ring
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, R_INNER_1, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Inner Ring Core
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, R_INNER_2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CORE, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Star Dividers (Left & Right)
  const starRadius = (R_INNER_1 + R_INNER_2) / 2;
  drawStar5(ctx, cx - starRadius, cy, 6, 2.6);
  drawStar5(ctx, cx + starRadius, cy, 6, 2.6);

  // Small auxiliary flanker stars
  drawStar5(ctx, cx - starRadius, cy - 14, 3.5, 1.5);
  drawStar5(ctx, cx - starRadius, cy + 14, 3.5, 1.5);
  drawStar5(ctx, cx + starRadius, cy - 14, 3.5, 1.5);
  drawStar5(ctx, cx + starRadius, cy + 14, 3.5, 1.5);

  // 6. Top Arc: School Name
  const schoolName = opts.schoolName.toUpperCase();
  const nameLen = Math.max(schoolName.length, 1);
  const fsTop = Math.max(6.5, Math.min(14, (R_INNER_1 * Math.PI * 0.72) / nameLen));
  ctx.font = `900 ${fsTop}px "Times New Roman", "Cinzel", "Outfit", serif`;
  drawArcText(ctx, schoolName, cx, cy, R_INNER_1 - 12, -90, false, 2.8);

  // 7. Bottom Arc: Location & Verification
  const locationText = (opts.city ? `${opts.city} · ` : "") + `EST. ${currentYear}`;
  const fsBot = Math.max(9, Math.min(12, Math.floor((R_INNER_1 * Math.PI * 0.65) / locationText.length)));
  ctx.font = `800 ${fsBot}px "Times New Roman", "Cinzel", "Outfit", serif`;
  drawArcText(ctx, locationText, cx, cy, R_INNER_1 - 12, 90, true, 2.4);

  // 8. Center Emblem: Coat of Arms or Uploaded Logo
  const emblemY = cy - 14;
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
      ctx.arc(cx, emblemY, 26, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - 26, emblemY - 26, 52, 52);
      ctx.restore();
    } catch {
      drawAcademicCoatOfArms(ctx, cx, emblemY, 52, ink);
    }
  } else {
    drawAcademicCoatOfArms(ctx, cx, emblemY, 52, ink);
  }

  // 9. Center Designation Banner / Ribbon
  const ribbonY = cy + 24;
  ctx.lineWidth = 1.2;

  // Ribbon box
  const ribW = 86;
  const ribH = 18;
  ctx.strokeRect(cx - ribW / 2, ribbonY - ribH / 2, ribW, ribH);
  ctx.lineWidth = 0.6;
  ctx.strokeRect(cx - ribW / 2 + 2, ribbonY - ribH / 2 + 2, ribW - 4, ribH - 4);

  ctx.font = `900 9px "Times New Roman", "Cinzel", "Arial", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(subText, cx, ribbonY);

  // 10. Date line under ribbon
  ctx.font = `700 7.5px "Courier New", monospace`;
  ctx.fillText(`DATE: ${new Date().toLocaleDateString("en-GB").toUpperCase()}`, cx, cy + 44);

  applyRubberInkPhysics(ctx, W, H, ink);
}

// ── STYLE 2: EXECUTIVE INSTITUTIONAL OVAL SEAL ─────────────────────────────────

async function renderOvalStamp(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const rx = 148;
  const ry = 112;
  const rx_beaded = 138;
  const ry_beaded = 102;
  const rx_inner1 = 129;
  const ry_inner1 = 93;
  const rx_core = 82;
  const ry_core = 56;
  const ink = opts.inkColor;
  const subText = (opts.subText || "OFFICIAL SEAL").toUpperCase();

  ctx.globalAlpha = 0.94;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // 1. Heavy Outer Ellipse
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Beaded Security Ring along Ellipse
  drawBeadedEllipse(ctx, cx, cy, rx_beaded, ry_beaded, 64, 1.4);

  // 3. Middle Oval Ring
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx_inner1, ry_inner1, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Core Inner Oval Ring
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx_core, ry_core, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Star Dividers (Left & Right rims)
  drawStar5(ctx, cx - rx_inner1 + 10, cy, 6, 2.6);
  drawStar5(ctx, cx + rx_inner1 - 10, cy, 6, 2.6);

  // 6. Top Arc: School Name
  const schoolName = opts.schoolName.toUpperCase();
  const nameLen = Math.max(schoolName.length, 1);
  const fsTop = Math.max(6.5, Math.min(13, (2 * rx * Math.PI * 0.58) / nameLen));
  ctx.font = `900 ${fsTop}px "Times New Roman", "Cinzel", "Outfit", serif`;
  drawEllipseArcText(ctx, schoolName, cx, cy, rx - 12, ry - 12, -Math.PI + 0.18, -0.18, false, 2.6);

  // 7. Bottom Arc: City & Verification
  const locationText = (opts.city ? `${opts.city} · ` : "") + "EXAMINATIONS & RECORDS";
  const fsBot = Math.max(8, Math.min(11, Math.floor((2 * rx * Math.PI * 0.52) / locationText.length)));
  ctx.font = `800 ${fsBot}px "Times New Roman", "Cinzel", "Outfit", serif`;
  drawEllipseArcText(ctx, locationText, cx, cy, rx - 12, ry - 12, 0.18, Math.PI - 0.18, true, 2.2);

  // 8. Center Crest / Logo
  const emblemY = cy - 10;
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
      ctx.ellipse(cx, emblemY, 24, 24, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - 24, emblemY - 24, 48, 48);
      ctx.restore();
    } catch {
      drawAcademicCoatOfArms(ctx, cx, emblemY, 46, ink);
    }
  } else {
    drawAcademicCoatOfArms(ctx, cx, emblemY, 46, ink);
  }

  // 9. Banner
  const ribbonY = cy + 22;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(cx - 44, ribbonY - 8, 88, 16);
  ctx.font = `900 8.5px "Times New Roman", "Cinzel", Arial, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(subText, cx, ribbonY);

  applyRubberInkPhysics(ctx, W, H, ink);
}

// ── STYLE 3: OFFICIAL EXAMINATIONS BOX STAMP ───────────────────────────────────

async function renderRectangleStamp(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const boxW = 276;
  const boxH = 164;
  const left = cx - boxW / 2;
  const top = cy - boxH / 2;
  const ink = opts.inkColor;
  const subText = (opts.subText || "OFFICIAL STAMP").toUpperCase();
  const schoolName = opts.schoolName.toUpperCase();

  ctx.globalAlpha = 0.94;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // 1. Heavy Outer Box with Chamfered Corners
  ctx.lineWidth = 4.5;
  ctx.strokeRect(left, top, boxW, boxH);

  // 2. Inner Security Double Border
  ctx.lineWidth = 1.4;
  ctx.strokeRect(left + 6, top + 6, boxW - 12, boxH - 12);

  // 3. Corner Rosettes
  [
    [left + 12, top + 12],
    [left + boxW - 12, top + 12],
    [left + 12, top + boxH - 12],
    [left + boxW - 12, top + boxH - 12],
  ].forEach(([x, y]) => drawStar5(ctx, x, y, 4, 1.8));

  // 4. Header Bar (School Name)
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left + 6, top + 44);
  ctx.lineTo(left + boxW - 6, top + 44);
  ctx.stroke();

  const nameLen = Math.max(schoolName.length, 1);
  const fsName = Math.max(11, Math.min(15, Math.floor(230 / (nameLen * 0.58))));
  ctx.font = `900 ${fsName}px "Times New Roman", "Cinzel", "Outfit", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(schoolName, cx, top + 26, boxW - 36);

  // 5. Middle Section (Crest + Designation)
  const midY = top + 84;
  const crestX = left + 44;

  if (opts.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = opts.logoUrl!;
      });
      ctx.drawImage(img, crestX - 20, midY - 20, 40, 40);
    } catch {
      drawAcademicCoatOfArms(ctx, crestX, midY, 40, ink);
    }
  } else {
    drawAcademicCoatOfArms(ctx, crestX, midY, 40, ink);
  }

  // Middle Text Block
  const textLeft = left + 82;
  ctx.textAlign = "left";
  ctx.font = `900 13px "Times New Roman", "Cinzel", Arial, serif`;
  ctx.fillText(subText, textLeft, midY - 12);

  ctx.font = `800 9.5px "Courier New", monospace`;
  ctx.fillText("VERIFIED ACADEMIC RECORD", textLeft, midY + 4);

  ctx.font = `700 8.5px "Courier New", monospace`;
  ctx.fillText(`LOCATION: ${opts.city.toUpperCase() || "NIGERIA"}`, textLeft, midY + 18);

  // 6. Bottom Rule (Date & Signature Block)
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(left + 6, top + 124);
  ctx.lineTo(left + boxW - 6, top + 124);
  ctx.stroke();

  ctx.font = `800 9.5px "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`DATE: ${new Date().toLocaleDateString("en-GB").toUpperCase()}`, left + 18, top + 144);

  ctx.textAlign = "right";
  ctx.fillText("SIGN: ________________", left + boxW - 18, top + 144);

  applyRubberInkPhysics(ctx, W, H, ink);
}

// ── STYLE 4: NOTARY ROSETTE / STARBURST SEAL ───────────────────────────────────

async function renderRosetteStamp(
  ctx: CanvasRenderingContext2D,
  opts: StampOpts,
  W: number,
  H: number,
) {
  const cx = W / 2;
  const cy = H / 2;
  const ink = opts.inkColor;
  const subText = (opts.subText || "OFFICIAL SEAL").toUpperCase();

  ctx.globalAlpha = 0.94;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;

  // 1. Scalloped Rosette Outer Rim
  ctx.lineWidth = 2.5;
  drawRosetteBorder(ctx, cx, cy, 144, 134, 36);

  // 2. Beaded Ring
  drawBeadedCircle(ctx, cx, cy, 126, 56, 1.4);

  // 3. Concentric Inner Circles
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Stars
  drawStar5(ctx, cx - 99, cy, 5.5, 2.4);
  drawStar5(ctx, cx + 99, cy, 5.5, 2.4);

  // 5. Top Arc: School Name
  const schoolName = opts.schoolName.toUpperCase();
  const fsTop = Math.max(6.5, Math.min(13, (118 * Math.PI * 0.7) / schoolName.length));
  ctx.font = `900 ${fsTop}px "Times New Roman", "Cinzel", serif`;
  drawArcText(ctx, schoolName, cx, cy, 105, -90, false, 2.6);

  // 6. Bottom Arc: Location
  const locText = (opts.city ? `${opts.city} · ` : "") + "OFFICIALLY CERTIFIED";
  const fsBot = Math.max(8, Math.min(11, Math.floor((118 * Math.PI * 0.65) / locText.length)));
  ctx.font = `800 ${fsBot}px "Times New Roman", "Cinzel", serif`;
  drawArcText(ctx, locText, cx, cy, 105, 90, true, 2.2);

  // 7. Center Emblem
  const emblemY = cy - 12;
  drawAcademicCoatOfArms(ctx, cx, emblemY, 48, ink);

  // 8. Ribbon
  const ribbonY = cy + 22;
  ctx.lineWidth = 1.0;
  ctx.strokeRect(cx - 40, ribbonY - 8, 80, 16);
  ctx.font = `900 8.5px "Times New Roman", "Cinzel", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(subText, cx, ribbonY);

  applyRubberInkPhysics(ctx, W, H, ink);
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

export async function renderStamp(
  canvas: HTMLCanvasElement,
  opts: StampOpts,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const shape = opts.shape || "circle";
  // Stamp artwork is authored on a 320px logical canvas. Render there first
  // (the ink-distress pass reads pixels), then scale the finished artwork to
  // the export canvas so the seal fills its frame consistently.
  const logicalSize = 320;
  const artwork = document.createElement("canvas");
  artwork.width = logicalSize;
  artwork.height = logicalSize;
  const artworkCtx = artwork.getContext("2d");
  if (!artworkCtx) return;

  switch (shape) {
    case "oval":
      await renderOvalStamp(artworkCtx, opts, logicalSize, logicalSize);
      break;
    case "rectangle":
      await renderRectangleStamp(artworkCtx, opts, logicalSize, logicalSize);
      break;
    case "rosette":
      await renderRosetteStamp(artworkCtx, opts, logicalSize, logicalSize);
      break;
    case "circle":
    default:
      await renderCircleStamp(artworkCtx, opts, logicalSize, logicalSize);
      break;
  }
  const size = Math.min(W, H);
  ctx.drawImage(artwork, (W - size) / 2, (H - size) / 2, size, size);
}
