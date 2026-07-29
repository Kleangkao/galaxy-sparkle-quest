import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const projectRoot = new URL("..", import.meta.url);
const sourceRoots = ["src", "index.html"];
const sourceExtensions = new Set([".ts", ".tsx", ".css", ".html"]);
const bannedPatterns = [
  { pattern: /[—–]/u, reason: "Use a comma, period, or short sentence instead of an em/en dash." },
  { pattern: /อัพเกรด/u, reason: "Use the standard spelling อัปเกรด." },
  { pattern: /เซกเตอร์/u, reason: "Use พื้นที่ in player-facing Thai." },
  { pattern: /เลเวล/u, reason: "Use ระดับ in player-facing Thai." },
  { pattern: /เอเลี่ยน/u, reason: "Use ต่างดาว in player-facing Thai." },
  { pattern: /อะซิงก์/u, reason: "Explain the behavior in plain Thai." },
  { pattern: /ข่าวกรองเซกเตอร์/u, reason: "Use ข้อมูลพื้นที่." },
  { pattern: /คณะสำรวจเดี่ยว/u, reason: "Use เล่นคนเดียว." },
  { pattern: /ทำดาเมจ/u, reason: "Use สร้างความเสียหาย." },
  { pattern: /แม็กกาซีน/u, reason: "Use ซองกระสุน." },
  { pattern: /ข้อมูลเพื่อนร่วมทาง/u, reason: "Use เพื่อนที่อาจพบ when describing a possible discovery." },
  { pattern: /คริสตัลที่คาดว่าจะได้/u, reason: "Use คริสตัลที่จะได้รับ." },
  { pattern: /ใช้งานให้อัตโนมัติ/u, reason: "Use ทำงานอัตโนมัติ." },
  { pattern: /ความสนิท PURI/u, reason: "Use ความสนิทกับ PURI." },
];

function collectFiles(path) {
  const absolute = new URL(path, projectRoot);
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "test" || entry.name === "ui") return [];
      return collectFiles(child);
    }
    return sourceExtensions.has(extname(entry.name)) ? [new URL(child, projectRoot)] : [];
  });
}

const failures = [];
for (const file of sourceRoots.flatMap(collectFiles)) {
  const content = readFileSync(file, "utf8");
  for (const { pattern, reason } of bannedPatterns) {
    const match = pattern.exec(content);
    if (!match) continue;
    const line = content.slice(0, match.index).split(/\r?\n/u).length;
    failures.push(`${relative(new URL(".", projectRoot).pathname, file.pathname)}:${line} ${reason}`);
  }
}

if (failures.length > 0) {
  console.error("Copy check failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Copy check passed: no banned dash or known machine-translated Thai wording found.");
