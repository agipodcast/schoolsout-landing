import fs from "node:fs";
import path from "node:path";

const [sourcePath, outputPath] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  console.error("Usage: node scripts/convert-field-notes-bundle.mjs SOURCE OUTPUT");
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, "utf8");
const templatePattern = /(<script type="__bundler\/template">\s*)([\s\S]*?)(\s*<\/script>)/;
const match = source.match(templatePattern);

if (!match) {
  throw new Error("Claude Design bundle template was not found");
}

let template = JSON.parse(match[2]);

const metadata = [
  "<title>The Age of Intelligence | School's Out Field Notes Issue 7</title>",
  '<meta name="description" content="Two years of AI implementation conversations in education keep sorting into four buckets. The curriculum is missing from all four.">',
  '<link rel="canonical" href="https://schoolsout.agipodcast.ai/field-notes-issue-7">',
  '<meta property="og:type" content="article">',
  '<meta property="og:title" content="The Age of Intelligence | Field Notes Issue 7">',
  '<meta property="og:description" content="Two years of AI implementation conversations in education keep sorting into four buckets. The curriculum is missing from all four.">',
  '<meta property="og:url" content="https://schoolsout.agipodcast.ai/field-notes-issue-7">',
  '<meta property="og:image" content="https://schoolsout.agipodcast.ai/field-notes-header.png">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="The Age of Intelligence | Field Notes Issue 7">',
  '<meta name="twitter:description" content="What every classroom has already inherited in the age of intelligence.">',
  '<meta name="twitter:image" content="https://schoolsout.agipodcast.ai/field-notes-header.png">'
].join("\n");

template = template
  .replace("<html>", '<html lang="en">')
  .replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n${metadata}`
  )
  .replaceAll("08.01.26", "07.30.26")
  .replaceAll("ISSUE 01", "ISSUE 07")
  .replaceAll("Issue%2001", "Issue%207")
  .replaceAll("jason@agipodcast.ai", "agipodcasters@gmail.com")
  .replaceAll("https://agipodcast.ai/field-notes", "https://schoolsout.agipodcast.ai/field-notes")
  .replace(
    '<a href="#unsubscribe" style="color:#6E7C99">UNSUBSCRIBE</a>',
    '<a href="https://schoolsout.agipodcast.ai/#subscribe" style="color:#6E7C99">SUBSCRIBE</a>'
  );

// Keep nested script tags inside the JSON string from terminating the
// outer bundler template element when the browser parses the page.
const serializedTemplate = JSON.stringify(template).replaceAll(
  "</script>",
  "<\\/script>"
);

let output = source
  .replace(templatePattern, (_whole, prefix, _oldTemplate, suffix) =>
    `${prefix}${serializedTemplate}${suffix}`
  )
  .replace("<title>Bundled Page</title>", "<title>The Age of Intelligence | School's Out Field Notes Issue 7</title>")
  .replace(">ISSUE 1</text>", ">ISSUE 7</text>")
  .replace(/[ \t]+$/gm, "");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
