#!/usr/bin/env node
const fs = require('fs'), path = require('path'), { compile } = require('../compiler/compile');
const spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../games/starlight-queen.json'), 'utf8'));
fs.writeFileSync(path.resolve(__dirname, '../out/sq.harness.html'), compile(spec, { harness: true }).html || compile(spec, { harness: true }));
fs.writeFileSync(path.resolve(__dirname, '../out/sq.html'), compile(spec, {}).html || compile(spec, {}));
