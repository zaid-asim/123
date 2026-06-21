const { execSync } = require("child_process");
const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function runCmd(cmd) {
  try {
    console.log(`\n> Executing: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch (err) {
    console.error(`Error executing command: ${cmd}`);
    return false;
  }
}

console.log("====================================================");
console.log("      🚀 Swadesh AI GitHub Publisher Script 🚀");
console.log("====================================================");

// Check if Git is installed
try {
  execSync("git --version", { stdio: "ignore" });
} catch (e) {
  console.error("❌ Git is not installed on this system. Please install Git first (https://git-scm.com/)");
  rl.close();
  process.exit(1);
}

// Check if already initialized
const isGitRepo = fs.existsSync(".git");

rl.question("Please enter your GitHub Repository URL (e.g., https://github.com/zaidasim/swadesh-ai.git):\n> ", (repoUrl) => {
  if (!repoUrl || !repoUrl.trim()) {
    console.error("❌ Invalid URL. Operation aborted.");
    rl.close();
    process.exit(1);
  }

  const cleanUrl = repoUrl.trim();

  try {
    if (!isGitRepo) {
      console.log("\nInitializing Git repository...");
      if (!runCmd("git init")) throw new Error();
    } else {
      console.log("\nGit is already initialized.");
    }

    console.log("\nStaging files...");
    if (!runCmd("git add .")) throw new Error();

    console.log("\nCommitting changes...");
    // Use try/catch because if there is nothing to commit, git commit returns non-zero code
    try {
      execSync('git commit -m "Configure multi-engine, base paths, and Cloudflare Pages deployment"', { stdio: "inherit" });
    } catch (e) {
      console.log("Nothing new to commit or commit succeeded.");
    }

    console.log("\nSetting main branch...");
    if (!runCmd("git branch -M main")) throw new Error();

    console.log("\nConfiguring remote origin...");
    // Check if origin already exists
    let remoteExists = false;
    try {
      execSync("git remote get-url origin", { stdio: "ignore" });
      remoteExists = true;
    } catch (e) {}

    if (remoteExists) {
      if (!runCmd(`git remote set-url origin ${cleanUrl}`)) throw new Error();
    } else {
      if (!runCmd(`git remote add origin ${cleanUrl}`)) throw new Error();
    }

    console.log("\nPushing to GitHub (main branch)...");
    console.log("⚠️ If prompted, please enter your GitHub credentials in the browser/dialogue box.");
    if (!runCmd("git push -u origin main")) {
      console.log("\n❌ Push failed. Try running: git push -u origin main --force");
    } else {
      console.log("\n====================================================");
      console.log("🎉 SUCCESS! Your code has been pushed to GitHub!");
      console.log("====================================================");
    }

  } catch (err) {
    console.error("\n❌ An error occurred during git operations.");
  } finally {
    rl.close();
  }
});
