import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ['firestore.rules'],
    plugins: {
      'firebase-security': firebaseRulesPlugin,
    },
    languageOptions: {
      parser: firebaseRulesPlugin.preprocessors.rules.parser,
    },
    rules: {
      ...firebaseRulesPlugin.configs.recommended.rules,
    },
  }
];
