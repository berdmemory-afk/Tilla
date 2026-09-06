/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "prisma/dev.db"],
  },
];

export default eslintConfig;
