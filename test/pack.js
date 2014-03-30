/*global before,describe,it */
var fs = require('fs');

var assert = require('chai').assert;
var mkdir = require('mkdirp');

var helpers = require('./helpers');
var binaryBuffer = helpers.binaryBuffer;
var fileBuffer = helpers.fileBuffer;
var WriteHashStream = helpers.WriteHashStream;

var Packer = require('../lib/zip-stream.js');

var testBuffer = binaryBuffer(1024 * 16);

var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

var testDateOverflow = new Date('Jan 1 2044 00:00:00 GMT');
var testDateUnderflow = new Date('Dec 30 1979 23:59:58 GMT');

describe('pack', function() {
  before(function() {
    mkdir.sync('tmp');
  });

  describe('#entry', function() {

    it('should append Buffer sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/buffer.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '6576fe7e1ef7aa22b51c1c18a837176602c1b3b6');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should append Stream sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/stream.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '696d847c779cb4ad77c52de4dcb5995fabe82053');
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate });
      archive.finalize();
    });

    it('should append multiple sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/multiple.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '696fec6b6267159b6d0cff2f59cdc0b9259f14a1');
        done();
      });

      archive.pipe(testStream);

      archive.entry('string', { name: 'string.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'buffer.txt', date: testDate2 }, function(err) {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate2 }, function(err) {
            if (err) throw err;
            archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream-store.txt', date: testDate, store: true }, function(err) {
              if (err) throw err;
              archive.finalize();
            });
          });
        });
      });
    });

    it('should support STORE for Buffer sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/buffer-store.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '7919cdab61f79a3384657f1121deb1892f2f062e');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support STORE for Stream sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/stream-store.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '0afeba5761199501ae58c3670713761b4d42bc3a');
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate, store: true });
      archive.finalize();
    });

    it('should support archive and file comments', function(done) {
      var archive = new Packer({
        comment: 'this is a zip comment',
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/comments.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '0ca2a710775e8645d8bb170f12ef5372abba4b77');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, comment: 'this is a file comment' });
      archive.finalize();
    });

    it('should STORE files when compression level is zero', function(done) {
      var archive = new Packer({
        forceUTC: true,
        level: 0
      });

      var testStream = new WriteHashStream('tmp/store-level0.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '7919cdab61f79a3384657f1121deb1892f2f062e');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate });
      archive.finalize();
    });

    it('should properly handle utf8 encoded characters in file names and comments', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/accentedchars-filenames.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '554638f3269bd13d21657da6f1d30e8502405274');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ.txt', date: testDate, comment: 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ' }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ.txt', date: testDate2, comment: 'ÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ' }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should append zero length sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/zerolength.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '61ac99936f7dc99f38fbaa3789050b6b14900e47');
        done();
      });

      archive.pipe(testStream);

      archive.entry('', { name: 'string.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(new Buffer(0), { name: 'buffer.txt', date: testDate }, function(err) {
          if (err) throw err;
          archive.entry(fs.createReadStream('test/fixtures/empty.txt'), { name: 'stream.txt', date: testDate }, function(err) {
            if (err) throw err;
            archive.finalize();
          });
        });
      });
    });

    it('should support setting file mode (permissions)', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/filemode.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '133dee4946ae133a723a728b56775672729d6246');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'buffer.txt', date: testDate, mode: 0644 });
      archive.finalize();
    });

    it('should support creating an empty zip', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/empty.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, 'b04f3ee8f5e43fa3b162981b50bb72fe1acabb33');
        done();
      });

      archive.pipe(testStream);

      archive.finalize();
    });

    it('should support compressing images for Buffer sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/buffer-image.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '318b485627b9abf7cbd411e43985fc8d7358d151');
        done();
      });

      archive.pipe(testStream);

      archive.entry(fileBuffer('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should support compressing images for Stream sources', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/stream-image.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '318b485627b9abf7cbd411e43985fc8d7358d151');
        done();
      });

      archive.pipe(testStream);

      archive.entry(fs.createReadStream('test/fixtures/image.png'), { name: 'image.png', date: testDate });
      archive.finalize();
    });

    it('should prevent UInt32 under/overflow of dates', function(done) {
      var archive = new Packer({
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/date-boundaries.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '99e71f01a7ec48e8a67344c18065fb06fa08c051');
        done();
      });

      archive.pipe(testStream);

      archive.entry(testBuffer, { name: 'date-underflow.txt', date: testDateUnderflow }, function(err) {
        if (err) throw err;
        archive.entry(testBuffer, { name: 'date-overflow.txt', date: testDateOverflow }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

    it('should handle data that exceeds its internal buffer size', function(done) {
      var archive = new Packer({
        highWaterMark: 1024 * 4,
        forceUTC: true
      });

      var testStream = new WriteHashStream('tmp/buffer-overflow.zip');

      testStream.on('close', function() {
        assert.equal(testStream.digest, '8d5cccddfdd0fe0f31ac435005d1bdc774264f51');
        done();
      });

      archive.pipe(testStream);

      archive.entry(binaryBuffer(1024 * 512), { name: 'buffer-overflow.txt', date: testDate }, function(err) {
        if (err) throw err;
        archive.entry(binaryBuffer(1024 * 1024), { name: 'buffer-overflow-store.txt', date: testDate, store: true }, function(err) {
          if (err) throw err;
          archive.finalize();
        });
      });
    });

  });

});