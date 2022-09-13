function createOnStorageJobCore (lib, mylib) {
  'use strict';

  function OnStorageJobCore (storage) {
    this.storage = storage;
  }
  OnStorageJobCore.prototype.destroy = function () {
    this.storage = null;
  };
  OnStorageJobCore.prototype.shouldContinue = function () {
    if (!this.storage) {
      return new lib.Error('NO_STORAGE', 'There is no storage;');
    }
    if (!this.storage.executor) {
      return new lib.Error('STORAGE_HAS_NO_EXECUTOR', 'Storage has no executor');
    }
  };

  mylib.OnStorage = OnStorageJobCore;
}
module.exports = createOnStorageJobCore;