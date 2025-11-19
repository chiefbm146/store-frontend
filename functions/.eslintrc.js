module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['off'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
};
