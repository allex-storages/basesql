function main (execlib){
  'use strict';
  return execlib.loadDependencies('client', ['allex:data:lib'], createMSSQLStorage.bind(null, execlib));
}

function createMSSQLStorage (execlib, datalib) {
  'use strict';

  var lib = execlib.lib,
    qlib = lib.qlib,
    StorageBase = datalib.StorageBase;

  function BaseSQLStorage(storagedescriptor){
    if (!storagedescriptor){
      throw new lib.Error('NO_STORAGEDESCRIPTOR', 'MongoStorage needs a storagedescriptor in constructor');
    }
    if (!storagedescriptor.database) {
      throw new lib.Error('NO_DATABASE_IN_STORAGEDESCRIPTOR', 'MongoStorage needs a storagedescriptor.database name in constructor');
    }
    if (!storagedescriptor.table) {
      throw new lib.Error('NO_TABLE_IN_STORAGEDESCRIPTOR', 'MongoStorage needs a storagedescriptor.table name in constructor');
    }
    StorageBase.call(this, storagedescriptor);
    this.executor = new this.sqllib.Executor({connection:storagedescriptor});
    this.dbname = storagedescriptor.database;
    this.tablename = storagedescriptor.table;
    this.indexes = null;
    this.jobs = new qlib.JobCollection();
    this.sentencer = new this.sqllib.sqlsentencing.SqlSentencer();
    this.jobs.run('.', qlib.newSteppedJobOnSteppedInstance(
      new this.jobcores.TableChecker(this, storagedescriptor)
    )).then(null, qlib.errorandthrower(storagedescriptor));
    this.jobs.run('.', qlib.newSteppedJobOnSteppedInstance(
      new this.jobcores.IndexChecker(this, storagedescriptor)
    ));
  }
  lib.inherit(BaseSQLStorage, StorageBase);
  BaseSQLStorage.prototype.expectedPrimaryKeyViolation = 'Some snippet of PRIMARY KEY violation error';
  BaseSQLStorage.prototype.destroy = function () {
    if (this.sentencer){
      this.sentencer.destroy();
    }
    this.sentencer = null;
    if (this.jobs){
      this.jobs.destroy();
    }
    this.jobs = null;
    if (this.indexes) {
      this.indexes.destroy();
    }
    this.indexes = null;
    this.tablename = null;
    this.dbname = null;
    if (this.executor) {
      this.executor.destroy();
    }
    this.executor = null;
    StorageBase.prototype.destroy.call(this);
  };

  BaseSQLStorage.prototype.doRead = function (query, defer) {
    var f = query.filter(), d = f.descriptor();
    var sqlf = this.sqlfiltering.Factory(d);
    var sqlquery = 'SELECT '+
    (lib.isNumber(query.limit()) ? 'TOP ('+query.limit()+') ' : '')+
    '*'+
    ' FROM '+
      this.sqllib.sqlsentencing.entityNameOf(this.tablename)+
      ' '+
      sqlf.getQueryConditional('WHERE');
    qlib.promise2defer(this.jobs.run('.', new this.sqllib.jobs.AsyncQuery(
      this.executor,
      sqlquery,
      {
        record: defer.notify.bind(defer)
      })), defer);
  };
  BaseSQLStorage.prototype.doCreate = function (datahash, defer) {
    //this defer may not have .promise
    qlib.promise2defer(this.jobs.run('.', new this.sqllib.jobs.SyncSingleQuery(
      this.executor,
      this.sentencer.insertFromDataRecord(this.tablename, this.__record, datahash)
    )), defer);
  };
  BaseSQLStorage.prototype.doDelete = function (filter, defer) {
    var d, sqlf, query;
    d = filter.descriptor();
    sqlf = this.sqlfiltering.Factory(d);
    query = 'DELETE FROM '+
      this.sqllib.sqlsentencing.entityNameOf(this.tablename)+
      ' '+
      sqlf.getQueryConditional('WHERE');
    //this defer may not have .promise
    qlib.promise2defer(this.jobs.run('.', new this.sqllib.jobs.SyncSingleQuery(
      this.executor,
      query
    )), defer);
  };
  BaseSQLStorage.prototype.doUpdate = function (filter, updateobj, options, defer) {
    var d = filter.descriptor();
    var sqlf = this.sqlfiltering.Factory(d);
    var query = 'UPDATE '+
      this.sqllib.sqlsentencing.entityNameOf(this.tablename)+
      ' '+
      this.sentencer.setClauseFromObject(updateobj)+
      ' '+
      sqlf.getQueryConditional('WHERE');
    this.jobs.run('.', new this.sqllib.jobs.SyncQuery(
      this.executor,
      query
    )).then(updater.bind(this, sqlf, updateobj, options, defer));
    sqlf = null;
    updateobj = null;
    options = null;
    defer = null;
  };

  //static, this is SQLStorage
  function updater (sqlfilter, updateobj, options, defer, res) {
    var updatedrowcount = res && lib.isArray(res.rowsAffected) && res.rowsAffected.length>0 ? res.rowsAffected[0] : 0;
    var createobj;
    var d;
    if (updatedrowcount<1 && options && options.upsert) {
      createobj = lib.extend({}, updateobj);
      sqlfilter.addToCreateObject(createobj);
      d = q.defer();
      d.promise.then(
        updatehandler.bind(null, updateobj, 1, defer),
        defer.reject.bind(defer)
      );
      updateobj = null;
      defer = null;
      this.doCreate(createobj, d);
      return;
    }
    updatehandler(updateobj, updatedrowcount, defer);
  }
  function updatehandler (updateobj, updatedrowcount, defer) {
    defer.notify([updateobj, updatedrowcount]);
    defer.resolve(updatedrowcount);
  }


  //index testing purposes
  BaseSQLStorage.prototype.readIndices = function () {
    return this.jobs.run('.', new this.sqllib.jobs.IndexLister(this.executor, this.tablename));
  };

  BaseSQLStorage.prototype.sqllib = null;
  BaseSQLStorage.prototype.jobcores = null;
  BaseSQLStorage.prototype.sqlfiltering = null;

  BaseSQLStorage.inherit = function (klass, sqllib) {
    lib.inherit(klass, BaseSQLStorage);
    klass.prototype.sqllib = sqllib;
    klass.prototype.jobcores = require('./jobcores')(execlib, sqllib);
    klass.prototype.sqlfiltering = require('./sqlfiltering')(execlib, sqllib.sqlsentencing);
  };

  return BaseSQLStorage;
}

module.exports = main;