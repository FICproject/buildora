import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const entryShim = `'use strict';
const path = require('path');
const Module = require('module');

const distRoot = __dirname;
const workspacePackages = {
  '@buildora/types': path.join(distRoot, 'packages/types/src/index.js'),
  '@buildora/constants': path.join(distRoot, 'packages/constants/src/index.js'),
  '@buildora/utils': path.join(distRoot, 'packages/utils/src/index.js'),
  '@buildora/config': path.join(distRoot, 'packages/config/src/index.js'),
  '@buildora/validation': path.join(distRoot, 'packages/validation/src/index.js')
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (workspacePackages[request]) {
    return workspacePackages[request];
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require('./services/backend/api/src/main.js');
`;

fs.writeFileSync(path.join(distDir, 'main.js'), entryShim, 'utf8');
console.log('[backend-api] Generated production entrypoint at dist/main.js');
