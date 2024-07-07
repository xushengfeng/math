const fs = require("fs");
const path = require("path");

const mathLibPath = path.join(process.argv[2] || path.join(__dirname, "mathlib4"), "./Mathlib/");

let json = {};
/** @type string */
const p = fs.readdirSync(mathLibPath, { recursive: true }).filter((i) => i.endsWith(".lean"));

const ignore = ["Lean", "Tactic", "Util", "Mathport", "Testing", "Deprecated"];

for (let i of p) {
    if (ignore.includes(i.split(/[/.]/)[0])) continue;
    const filePath = path.join(mathLibPath, i);
    const text = fs.readFileSync(filePath).toString();
    const imports = text
        .split("\n")
        .filter((i) => i.startsWith("import Mathlib."))
        .map((i) => i.replace("import Mathlib.", ""))
        .filter((i) => !ignore.includes(i.split(".")[0]));
    json[i.replace(".lean", "").replaceAll("/", ".")] = imports;
}

fs.writeFileSync("./data.json", JSON.stringify(json, null, 2));
