function createTableCheckerJobCore (lib, sqllib, mylib) {
  'use strict';

  var OnStorageJobCore = mylib.OnStorage;

  function TableCheckerJobCore (storage, storagedescriptor) {
    OnStorageJobCore.call(this, storage);
    this.storagedescriptor = storagedescriptor;
  }
  lib.inherit(TableCheckerJobCore, OnStorageJobCore);
  TableCheckerJobCore.prototype.destroy = function () {
    this.storagedescriptor = null;
    OnStorageJobCore.prototype.destroy.call(this);
  };
  TableCheckerJobCore.prototype.tryCreateTable = function () {
    return (new sqllib.jobs.SyncQuery(
      this.storage.executor,
      sqllib.sqlsentencing.createTable({
        name: this.storage.tablename,
        temp: false,
        fields: this.storagedescriptor.record.fields
      })
    )).go();
  }
  TableCheckerJobCore.prototype.finalize = function (res) {
    return true;
  };

  OnStorageJobCore.prototype.steps = [
    'tryCreateTable',
    'finalize'
  ];

  mylib.TableChecker = TableCheckerJobCore;
}
module.exports = createTableCheckerJobCore;