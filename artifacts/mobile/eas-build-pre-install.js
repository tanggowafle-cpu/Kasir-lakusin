const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

module.exports = async () => {
  console.log("=== Custom pre-install hook ===");

  const workdir = process.env.EAS_BUILD_WORKINGDIR || process.cwd();
  console.log("Working dir:", workdir);

  // Copy pnpm-lock.yaml from root if exists
  const rootLock = path.join(workdir, "../../pnpm-lock.yaml");
  const localLock = path.join(workdir, "pnpm-lock.yaml");

  if (fs.existsSync(rootLock) && !fs.existsSync(localLock)) {
    console.log("Copying pnpm-lock.yaml from root...");
    fs.copyFileSync(rootLock, localLock);
  }

  // Force install without frozen lockfile
  execSync("pnpm install --no-frozen-lockfile", {
    stdio: "inherit",
    cwd: workdir,
  });
};
