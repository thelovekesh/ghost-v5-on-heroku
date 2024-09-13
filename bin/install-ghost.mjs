import fs from "node:fs";
import * as tar from "tar";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "url";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { exec } from "node:child_process";

const registryUrl = "https://registry.npmjs.com/ghost/latest";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ghostInstallDir = path.join(__dirname, "..", "ghost");
const res = await fetch(registryUrl);
const packageJson = await res.json();
const dist = packageJson.dist;

if (!dist) {
    throw new Error("No dist found in package.json");
}

const { tarball, shasum } = dist;
const tarballRes = await fetch(tarball);
const tarballBuffer = await tarballRes.arrayBuffer();
const hash = crypto.hash("sha1", Buffer.from(tarballBuffer));

if (hash.toString("hex") !== shasum) {
    throw new Error("Integrity check failed");
}

if (!fs.existsSync(ghostInstallDir)) {
    fs.rmdirSync(ghostInstallDir, { recursive: true });
    fs.mkdirSync(ghostInstallDir);
}

Readable.from(Buffer.from(tarballBuffer)).pipe(
    tar.x({
        strip: 1,
        C: ghostInstallDir,
    })
);

process.chdir(ghostInstallDir);
console.log("Installing Ghost...");
exec("yarn install");
