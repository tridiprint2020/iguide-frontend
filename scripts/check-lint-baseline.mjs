import {
  spawnSync,
} from "node:child_process";

import {
  fileURLToPath,
} from "node:url";

const MAXIMUM_ERRORS = 11;
const MAXIMUM_WARNINGS = 5;

const eslintEntry = fileURLToPath(
  new URL(
    "../node_modules/eslint/bin/eslint.js",
    import.meta.url
  )
);

const result = spawnSync(
  process.execPath,
  [eslintEntry, ".", "--format", "json"],
  {
    encoding: "utf8",
  }
);

if (result.error) {
  throw result.error;
}

if (!result.stdout) {
  process.stderr.write(
    result.stderr ||
      "ESLint no devolvió resultados.\n"
  );
  process.exit(1);
}

let report;

try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(1);
}

const totals = report.reduce(
  (accumulator, file) => ({
    errors:
      accumulator.errors +
      file.errorCount,
    warnings:
      accumulator.warnings +
      file.warningCount,
    fatalErrors:
      accumulator.fatalErrors +
      file.fatalErrorCount,
  }),
  {
    errors: 0,
    warnings: 0,
    fatalErrors: 0,
  }
);

console.log(
  `ESLint: ${totals.errors} errores / ${totals.warnings} avisos ` +
    `(máximo permitido: ${MAXIMUM_ERRORS}/${MAXIMUM_WARNINGS}).`
);

if (
  totals.fatalErrors > 0 ||
  totals.errors > MAXIMUM_ERRORS ||
  totals.warnings > MAXIMUM_WARNINGS
) {
  process.exit(1);
}
