// One-time script: convert coloring page JPEGs to SVGs using imagetracerjs
// Usage: node scripts/jpg-to-svg.js

const fs   = require("fs");
const path = require("path");
const jpeg = require("jpeg-js");
const ImageTracer = require("imagetracerjs");

const DIR   = path.join(__dirname, "..", "public", "coloringpages");
const COUNT = 6;

// Palette options tuned for black-outline coloring pages:
// - Low color count keeps only the ink and paper
// - Lower ltres/qtres = more faithful curve tracing
// - pathomit removes JPEG noise specks
const OPTS = {
  numberofcolors : 2,
  colorsampling  : 2,
  mincolorratio  : 0,
  colorquantcycles: 3,
  ltres          : 0.5,
  qtres          : 0.5,
  pathomit       : 8,
  rightangleenhance: true,
  scale          : 1,
  strokewidth    : 0,
  linefilter     : false,
  desc           : false,
  viewbox        : true,
  blurradius     : 0,
  blurdelta      : 20,
};

(async () => {
  for (let i = 1; i <= COUNT; i++) {
    const jpgPath = path.join(DIR, `${i}.jpg`);
    const svgPath = path.join(DIR, `${i}.svg`);

    const raw     = fs.readFileSync(jpgPath);
    const decoded = jpeg.decode(raw, { useTArray: true });

    const imgData = {
      width  : decoded.width,
      height : decoded.height,
      data   : new Uint8ClampedArray(decoded.data),
    };

    const svg = ImageTracer.imagedataToSVG(imgData, OPTS);
    fs.writeFileSync(svgPath, svg, "utf8");

    const kb = Math.round(fs.statSync(svgPath).size / 1024);
    console.log(`✓ ${i}.jpg → ${i}.svg  (${kb} KB)`);
  }
  console.log("Done.");
})();
