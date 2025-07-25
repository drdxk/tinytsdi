#!/bin/sh

echo "export * from './esm/index.js';" > dist/index.mjs
echo "module.exports = require('./cjs/index.js');" > dist/index.cjs.js
