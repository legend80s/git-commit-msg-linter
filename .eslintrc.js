module.exports = {
  extends: 'airbnb-base',
  rules: {
    'max-len': ['off', { ignoreComments: true }],
    'no-unused-expressions': ['error', { allowShortCircuit: true }],
    'no-use-before-define': ['error', { functions: false }],
  },
};
