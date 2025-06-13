module.exports = {
  extends: ['standard'],
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'camelcase': 'off'
  }
};
