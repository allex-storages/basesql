function createStorageJobs (execlib, sqllib) {
  'use strict';

  var lib = execlib.lib;
  var mylib = {};

  require('./onstoragecreator')(lib, mylib);
  require('./tablecheckercreator')(lib, sqllib, mylib);
  require('./indexcheckercreator')(lib, sqllib, mylib);

  return mylib;
}
module.exports = createStorageJobs;