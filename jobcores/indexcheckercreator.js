function createIndexCheckerJobCore (lib, sqllib, mylib) {
  'use strict'

  var qlib = lib.qlib;
  var OnStorageJobCore = mylib.OnStorage;

  function IndexCheckerJobCore (storage, storagedescriptor) {
    OnStorageJobCore.call(this, storage);
    this.storagedescriptor = storagedescriptor;
    this.jobs = new qlib.JobCollection();
    this.existingindices = null;
  }
  lib.inherit(IndexCheckerJobCore, OnStorageJobCore);
  IndexCheckerJobCore.prototype.destroy = function () {
    this.existingindices = null;
    if (this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
    this.storagedescriptor = null;
    OnStorageJobCore.prototype.destroy.call(this);
  };
  IndexCheckerJobCore.prototype.readIndices = function () {
    return (new sqllib.jobs.IndexLister(this.storage.executor, this.storage.tablename)).go();
  };
  IndexCheckerJobCore.prototype.onIndices = function (inds) {
    this.existingindices = inds;
  };
  IndexCheckerJobCore.prototype.checkPrimary = function () {
    if (this.storage.__record.primaryKey) {
      if (this.existingindices.primary) {
        return this.existingindices.primary.matchesColumns(this.storage.__record.primaryKey)
        ?
        0
        :
        {code: 3, name: this.existingindices.primary.name, columns: this.storage.__record.primaryKey};
      }
      return {code: 2, columns: this.storage.__record.primaryKey};
    }
    if (this.existingindices.primary) {
      return {code: 1, name: this.existingindices.primary.name};
    }
    return 0;
  };
  var _id = 0;
  IndexCheckerJobCore.prototype.onCheckPrimary = function (check) {
    var jobs = [];
    this.create('PrimaryKey', jobs, check);
    _id++;
    return this.jobs.runMany('.', jobs);
  };
  IndexCheckerJobCore.prototype.onPKHandled = function (pkhres) {
    var a = pkhres;
  };
  IndexCheckerJobCore.prototype.checkIndices = function () {
    var recixs = this.storagedescriptor.record.indices,
      jobs,
      recixsresobj,
      existingANDdeclared,
      existingNOTdeclared;
    if (!lib.isArray(recixs)) {
      return;
    }
    jobs = [];
    recixsresobj = recixs.reduce(
      this.recordResolutionReducer.bind(this),
      {resolved: [], resolvedordinals: []}
    );
    existingANDdeclared = recixsresobj.resolved.reduce(okReducer, []);
    existingNOTdeclared = this.existingindices.allIndexesExceptPrimaryNotIn(existingANDdeclared);
    jobs.push.apply(jobs, existingNOTdeclared.map(function (ix) {
      return {
        code: 1,
        name: ix.name
      }
    }));
    jobs.push.apply(jobs, recixs.reduce(declaredNotExistingReducer.bind(null, recixsresobj) , []));
    recixsresobj = null;
    return jobs;
  };
  IndexCheckerJobCore.prototype.onCheckIndices = function (jobdescs) {
    var jobs, _jobs;
    if (!lib.isArray(jobdescs)) {
      return;
    }
    jobs = [];
    _jobs = jobs;
    jobdescs.forEach(this.create.bind(this, 'Index', _jobs)); 
    return this.jobs.runMany('.', jobs);
  };
  IndexCheckerJobCore.prototype.onIndicesHandled = function (indhres) {
    var a = indhres;
  };

  IndexCheckerJobCore.prototype.steps = [
    'readIndices',
    'onIndices',
    'checkPrimary',
    'onCheckPrimary',
    'onPKHandled',
    'checkIndices',
    'onCheckIndices',
    'onIndicesHandled'
  ];

  IndexCheckerJobCore.prototype.create = function (ctorprefix, jobs, check) {
    //check.code:
    //0 => all OK
    //1 => drop existing PK/index
    //2 => create PK/index
    //3 => drop existing PK and create PK/index
    //check.drop => name of PK/index to drop
    //check.columns => columns of PK/index to create
    if (!(check && check.code)) {
      return;
    }
    if (check.code & 1) {
      jobs.push(new sqllib.jobs[ctorprefix+'Dropper'](
        this.storage.executor,
        this.storage.tablename,
        check.name
      ));
    }
    if (check.code & 2) {
      jobs.push(new sqllib.jobs[ctorprefix+'Creator'](
        this.storage.executor,
        this.storage.tablename,
        null,
        check.columns
      ));
    }
  };

  IndexCheckerJobCore.prototype.recordResolutionReducer = function (res, columns, columnsordinal) {
    var m = this.existingindices.matchesColumnsOnNonPrimary(columns);
    if (m) {
      res.resolved.push({
        code: 0,
        name: m
      });
      res.resolvedordinals.push(columnsordinal);
    }
    res.resolved.push({
      code: 2,
      columns: columns
    });
    return res;
  };

  function okReducer (res, item) {
    if (item&&item.code==0&&item.name) {
      res.push(item.name);
    }
    return res;
  }
  function declaredNotExistingReducer (obj, res, columns, columnsordinal) {
    if (obj && obj.resolvedordinals && obj.resolvedordinals.indexOf(columnsordinal)>=0) {
      return res;
    }
    res.push({
      code: 2,
      columns: columns
    });
    return res;
  }

  mylib.IndexChecker = IndexCheckerJobCore;
}
module.exports = createIndexCheckerJobCore;