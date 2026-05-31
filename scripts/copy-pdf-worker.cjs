const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../node_modules/pdfjs-dist/build/pdf.worker.mjs");
const dest = path.join(__dirname, "../public/pdf.worker.mjs");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  // copied successfully
} else {
  // worker not found, will be handled at runtime
}
