import fs from "node:fs";
import path from "node:path";

const [sourcePath, outputPath] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  console.error("Usage: node scripts/convert-no-code-caio-bundle.mjs SOURCE OUTPUT");
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, "utf8");
const templatePattern = /(<script type="__bundler\/template">\s*)([\s\S]*?)(\s*<\/script>)/;
const match = source.match(templatePattern);

if (!match) {
  throw new Error("Claude Design bundle template was not found");
}

const title = "The Night We Gave AI Agents a Room";
const description = "Two AI agents finally shared a dependable room, survived a restart, challenged each other's work, and printed the failures beside the wins.";
const canonical = "https://schoolsout.agipodcast.ai/newsletter/editions/edition-007.html";
const image = "https://schoolsout.agipodcast.ai/newsletter/assets/no-code-caio-square.png";

const metadata = [
  `<title>${title} | No-Code CAIO</title>`,
  `<meta name="description" content="${description}">`,
  `<link rel="canonical" href="${canonical}">`,
  '<meta property="og:type" content="article">',
  `<meta property="og:title" content="${title} | No-Code CAIO">`,
  `<meta property="og:description" content="${description}">`,
  `<meta property="og:url" content="${canonical}">`,
  `<meta property="og:image" content="${image}">`,
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:title" content="${title} | No-Code CAIO">`,
  `<meta name="twitter:description" content="${description}">`,
  `<meta name="twitter:image" content="${image}">`
].join("\n");

let template = JSON.parse(match[2]);
template = template
  .replace("<html>", '<html lang="en">')
  .replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n${metadata}`
  )
  .replace(
    '<image-slot id="caio-portrait" style="width:132px;height:158px;flex:none" shape="rounded" radius="8" fit="cover" placeholder="Your portrait"></image-slot>',
    '<img src="../assets/no-code-caio-square.png" alt="No-Code CAIO" style="width:132px;height:158px;flex:none;border-radius:8px;object-fit:cover">'
  )
  .replaceAll(
    "https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7399599285849346048",
    "../index.html#subscribe"
  );

const serializedTemplate = JSON.stringify(template).replaceAll(
  "</script>",
  "<\\/script>"
);

const output = source
  .replace(templatePattern, (_whole, prefix, _oldTemplate, suffix) =>
    `${prefix}${serializedTemplate}${suffix}`
  )
  .replace("<title>Bundled Page</title>", `<title>${title} | No-Code CAIO</title>`)
  .replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n${metadata}`
  )
  .replace(/[ \t]+$/gm, "");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
