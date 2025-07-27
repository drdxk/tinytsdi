#!/bin/sh

echo "export * from './dist/esm/index.js';" > index.mjs
echo "module.exports = require('./dist/cjs/index.js');" > index.cjs.js
