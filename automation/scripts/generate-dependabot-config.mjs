import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import yaml from "yaml";

// Dependabot config uses posix path, so normalize.
const normalizePath = (pkgs, root) =>
    pkgs.map(p => {
        const pkgPath = path.relative(root, p.path);
        p.path = path.posix.resolve("/", pkgPath.split(path.sep).join(path.posix.sep));
        return p;
    });

function main() {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    const listing = execSync("pnpm -r ls --json", {
        encoding: "utf-8"
    }).trim();

    const packages = normalizePath(JSON.parse(listing !== "" ? listing : "[]"), root);

    const dependabotConfig = {
        version: 2,
        updates: [
            {
                "package-ecosystem": "github-actions",
                directory: "/",
                schedule: {
                    interval: "weekly"
                }
            },
            ...packages.map(pkg => ({
                "package-ecosystem": "npm",
                directory: pkg.path,
                schedule: { interval: "weekly" },
                ignore: [
                    // Disable updates for typescript as we will update it manually.
                    { "dependency-name": "typescript" },
                    // Disable major updates for all dependencies
                    { "dependency-name": "*", "update-types": ["version-update:semver-major"] }
                ]
            }))
        ]
    };

    writeFileSync(path.resolve(root, ".github/dependabot.yml"), yaml.stringify(dependabotConfig), {
        encoding: "utf-8"
    });
}

main();