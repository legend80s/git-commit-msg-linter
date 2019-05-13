/**
 * exit current process with success code 0
 * instead destroying the whole npm install process.
 */
module.exports.bailOut = function bailOut() {
  process.exit(0);
};
