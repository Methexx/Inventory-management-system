export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-co-author': ({ raw }) => [
          !/co-authored-by/i.test(raw ?? ''),
          'Commit messages must not contain Co-authored-by trailers.',
        ],
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore']],
    'header-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'no-co-author': [2, 'always'],
  },
};
