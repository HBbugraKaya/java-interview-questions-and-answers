import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Liquid } from 'liquidjs';
import * as yaml from 'js-yaml';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const PORT = process.env.PORT || 8080;

// Load site config
let siteConfig = {
  title: 'Java Interview Questions and Answers',
  description: '500+ Java interview questions and answers for Junior, Middle, and Senior developers.',
  lang: 'en',
  baseurl: '',
  url: 'https://viacheslavchernyshov.github.io/java-interview-questions-and-answers',
  github: {
    repository_url: 'https://github.com/ViacheslavChernyshov/java-interview-questions-and-answers',
  },
};

const configPath = path.join(DOCS_DIR, '_config.yml');
if (fs.existsSync(configPath)) {
  try {
    const parsedConfig = yaml.load(fs.readFileSync(configPath, 'utf-8'));
    if (parsedConfig && typeof parsedConfig === 'object') {
      siteConfig = { ...siteConfig, ...parsedConfig };
    }
  } catch (err) {
    console.warn('Could not parse _config.yml:', err);
  }
}

// Setup Liquid engine
const liquid = new Liquid({
  root: path.join(DOCS_DIR, '_layouts'),
  extname: '.html',
  cache: false,
});

liquid.registerFilter('relative_url', (input) => {
  if (!input) return '';
  return input;
});

liquid.registerFilter('absolute_url', (input) => {
  if (!input) return '';
  const base = `http://localhost:${PORT}`;
  return base + (input.startsWith('/') ? input : '/' + input);
});

liquid.registerFilter('jsonify', (input) => {
  return JSON.stringify(input);
});

liquid.registerTag('seo', {
  render: function (ctx) {
    const page = ctx.environments.page || {};
    const title = page.title ? `${page.title} · Java Interview` : siteConfig.title;
    const desc = page.description || siteConfig.description;
    const lang = page.lang || 'en';
    const canonical = `http://localhost:${PORT}${page.url || '/'}`;

    return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(desc)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:site_name" content="Java Interview Questions & Answers">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(desc)}">
    <meta property="og:locale" content="${lang}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(desc)}">
    `;
  },
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

function renderMarkdown(md) {
  if (!md) return '';
  // Resolve Liquid tags like {{ '/questions/...' | relative_url }}
  let processed = md.replace(/\{\{\s*['"]([^'"]+)['"]\s*\|\s*relative_url\s*\}\}/g, '$1');
  processed = processed.replace(/\{\{\s*site\.github\.repository_url[^}]*\}\}/g, siteConfig.github.repository_url);

  let html = marked.parse(processed);
  // Wrap tables for responsive scrolling
  html = html.replace(/(<table>[\s\S]*?<\/table>)/g, '<div class="table-wrapper">$1</div>');
  return html;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const yamlText = match[1];
  const body = match[2];
  let data = {};
  try {
    data = yaml.load(yamlText) || {};
  } catch (err) {
    console.error('YAML parse error:', err);
  }
  return { data, body };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  let reqUrl = decodeURIComponent(req.url.split('?')[0]);
  if (siteConfig.baseurl && reqUrl.startsWith(siteConfig.baseurl)) {
    reqUrl = reqUrl.slice(siteConfig.baseurl.length) || '/';
  }
  if (!reqUrl.startsWith('/')) reqUrl = '/' + reqUrl;
  if (reqUrl.endsWith('/')) reqUrl += 'index.md';

  // Check static asset in docs/
  const staticPath = path.join(DOCS_DIR, reqUrl);
  const ext = path.extname(staticPath).toLowerCase();

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    if (['.css', '.js', '.json', '.png', '.jpg', '.svg', '.ico', '.xml', '.txt'].includes(ext)) {
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      return fs.createReadStream(staticPath).pipe(res);
    }
  }

  // Find corresponding markdown or html file in docs/
  let candidateFile = null;
  const candidates = [
    path.join(DOCS_DIR, reqUrl),
    path.join(DOCS_DIR, reqUrl + '.md'),
    path.join(DOCS_DIR, reqUrl + '.html'),
    path.join(DOCS_DIR, reqUrl, 'index.md'),
    path.join(DOCS_DIR, reqUrl, 'index.html'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      candidateFile = c;
      break;
    }
  }

  if (candidateFile) {
    try {
      const raw = fs.readFileSync(candidateFile, 'utf-8');
      const { data, body } = parseFrontMatter(raw);
      const contentHtml = candidateFile.endsWith('.html') ? body : renderMarkdown(body);

      const layoutName = data.layout || 'default';
      const layoutFile = path.join(DOCS_DIR, '_layouts', `${layoutName}.html`);

      if (fs.existsSync(layoutFile)) {
        const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
        const rendered = await liquid.parseAndRender(layoutContent, {
          page: data,
          site: siteConfig,
          content: contentHtml,
        });
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        return res.end(rendered);
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        return res.end(contentHtml);
      }
    } catch (err) {
      console.error('Render error:', err);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<h1>500 Internal Server Error</h1><pre>${escapeHtml(err.stack)}</pre>`);
    }
  }

  // 404
  const notFoundPath = path.join(DOCS_DIR, '404.html');
  let notFoundHtml = '<h1>404 Not Found</h1>';
  if (fs.existsSync(notFoundPath)) {
    try {
      const raw = fs.readFileSync(notFoundPath, 'utf-8');
      const { data, body } = parseFrontMatter(raw);
      const layoutFile = path.join(DOCS_DIR, '_layouts', 'default.html');
      const contentHtml = renderMarkdown(body);
      const layoutContent = fs.readFileSync(layoutFile, 'utf-8');
      notFoundHtml = await liquid.parseAndRender(layoutContent, {
        page: { ...data, title: 'Page Not Found' },
        site: siteConfig,
        content: contentHtml,
      });
    } catch (err) {
      console.error('404 render error:', err);
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(notFoundHtml);
});

function onListening() {
  console.log(`\n======================================================`);
  console.log(`☕ Java Interview Web Portal running on port ${PORT}`);
  console.log(`👉 Main English Portal:    http://localhost:${PORT}/`);
  console.log(`👉 Ukrainian Portal:       http://localhost:${PORT}/uk/`);
  console.log(`👉 Russian Portal:         http://localhost:${PORT}/ru/`);
  console.log(`👉 Answer Library:         http://localhost:${PORT}/questions/`);
  console.log(`======================================================\n`);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`\n⚠️  Port ${PORT} is busy, automatically trying port ${Number(PORT) + 1}...`);
    PORT = Number(PORT) + 1;
    server.listen(PORT, onListening);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, onListening);
