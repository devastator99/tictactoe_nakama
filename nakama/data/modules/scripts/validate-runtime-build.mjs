import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const buildPath = path.join(moduleRoot, 'build', 'index.js');
const configPath = path.resolve(moduleRoot, '..', '..', 'config', 'local.yml');

const runtimeBuild = await readFile(buildPath, 'utf8');
const localConfig = await readFile(configPath, 'utf8');

const requiredRuntimeSnippets = [
  'function InitModule',
  'matchInit: matchInit',
  'matchJoinAttempt: matchJoinAttempt',
  'matchJoin: matchJoin',
  'matchLeave: matchLeave',
  'matchLoop: matchLoop',
  'matchTerminate: matchTerminate',
  'matchSignal: matchSignal',
  'initializer.registerMatchmakerMatched(matchmakerMatched);',
  'initializer.registerRpc("find_or_create_match", findOrCreateMatch);',
  'initializer.registerRpc("create_private_match", createPrivateMatch);',
  'initializer.registerRpc("join_private_match", joinPrivateMatch);',
  'initializer.registerRpc("get_leaderboard", getLeaderboard);',
  'initializer.registerRpc("get_player_stats", getPlayerStats);',
  'initializer.registerRpc("get_match_replay", getMatchReplay);',
  'initializer.registerRpc("get_analytics", getAnalyticsRpc);',
  'initializer.registerRpc("get_live_activity", getLiveActivity);',
];

for (const snippet of requiredRuntimeSnippets) {
  assert.match(runtimeBuild, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Missing runtime snippet: ${snippet}`);
}

assert.doesNotMatch(runtimeBuild, /module\.exports|exports\./, 'Runtime build must not contain CommonJS exports.');
assert.doesNotMatch(runtimeBuild, /var __assign\b/, 'Runtime build must not include the TypeScript __assign helper.');
assert.doesNotMatch(runtimeBuild, /\bTextDecoder\b/, 'Runtime build must not rely on TextDecoder in the embedded Nakama runtime.');
assert.doesNotMatch(runtimeBuild, /\.sendMessage\(/, 'Runtime build should use dispatcher.broadcastMessage-compatible helpers for match messages.');
assert.doesNotMatch(runtimeBuild, /^\s+[A-Za-z_$][A-Za-z0-9_$]*,\s*$/m, 'Runtime build must not contain shorthand object properties on standalone lines.');
assert.doesNotMatch(runtimeBuild, /\{\s*[A-Za-z_$][A-Za-z0-9_$]*\s*(,|})/, 'Runtime build must not contain inline shorthand object properties.');

assert.doesNotMatch(localConfig, /^\s*server_key:/m, 'Sensitive socket server key must not be stored in local.yml.');
assert.doesNotMatch(localConfig, /^\s*http_key:/m, 'Sensitive runtime HTTP key must not be stored in local.yml.');
assert.doesNotMatch(localConfig, /^\s*encryption_key:/m, 'Sensitive session encryption key must not be stored in local.yml.');
assert.doesNotMatch(localConfig, /^\s*refresh_encryption_key:/m, 'Sensitive refresh session encryption key must not be stored in local.yml.');
assert.doesNotMatch(localConfig, /^\s*address:\s*$/m, 'Database credentials should be supplied at runtime, not committed in local.yml.');

console.log('Runtime build validation passed.');
