// build.js
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "template.html");
const DEFAULT_SPEC_PATH = path.join(__dirname, "site_spec.json");

// Lue JSON-tiedosto
function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

// Luo palvelukortit HTML:ksi
function buildServicesCards(services) {
  if (!services || !services.cards || !Array.isArray(services.cards)) {
    return "";
  }

  return services.cards
    .map(card => {
      const title = card.title || "";
      const text = card.text || "";
      return `
        <div class="card">
          <h3>${title}</h3>
          <p>${text}</p>
        </div>
      `;
    })
    .join("\n");
}

// Sijoitetaan placeholderit templateen
function buildHtml(template, spec) {
  let html = template;

  const year = new Date().getFullYear().toString();

  const hero = spec.hero || {};
  const services = spec.services || {};
  const about = spec.about || {};
  const contact = spec.contact || {};
  const companyName = spec.companyName || "";
  const pageTitle = spec.pageTitle || companyName || "Yrityssivu";

  const heroImage =
    (hero.imagePath && hero.imagePath.trim()) || "https://source.unsplash.com/featured/?office,clean";

  const heroImageAlt =
    hero.imageAlt ||
    `Kuva yrityksestä ${companyName || ""}`.trim();

  const servicesCardsHtml = buildServicesCards(services);

  const replacements = {
    "{{PAGE_TITLE}}": pageTitle,
    "{{COMPANY_NAME}}": companyName,
    "{{HERO_TITLE}}": hero.title || "",
    "{{HERO_TEXT}}": hero.text || "",
    "{{HERO_CTA}}": hero.cta || "Ota yhteyttä",
    "{{HERO_IMAGE}}": heroImage,
    "{{HERO_IMAGE_ALT}}": heroImageAlt,
    "{{SERVICES_TITLE}}": services.title || "Palvelut",
    "{{SERVICES_CARDS}}": servicesCardsHtml,
    "{{ABOUT_TITLE}}": about.title || "Meistä",
    "{{ABOUT_TEXT}}": about.text || "",
    "{{CONTACT_TEXT}}": contact.text || "",
    "{{YEAR}}": year,
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(key).join(value);
  }

  return html;
}

function main() {
  // Voit antaa site_spec-polun parametrina: node build.js polku.json
  const specPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_SPEC_PATH;

  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const spec = loadJson(specPath);

  const slugRaw = spec.slug || spec.companyName || "site";
  const slug = slugRaw
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const html = buildHtml(template, spec);

  const outputDir = path.join(__dirname, slug);
  const outputPath = path.join(outputDir, "index.html");

  // Luo kansio jos ei ole
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, "utf8");

  console.log("✅ index.html luotu:", outputPath);
}

main();
