import assert from 'node:assert/strict';
import { Client } from '@heroiclabs/nakama-js';

const HOST = process.env.NAKAMA_HOST ?? '127.0.0.1';
const PORT = process.env.NAKAMA_PORT ?? '7350';
const USE_SSL = process.env.NAKAMA_SSL === 'true';
const SERVER_KEY = process.env.NAKAMA_KEY ?? 'lila-tictactoe-server-key';

const OpCode = {
  GAME_STATE: 1,
  MAKE_MOVE: 101,
};

function buildMatchmakerQuery(mode) {
  return `+properties.mode:${mode}`;
}

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate, label, timeoutMs = 10000, intervalMs = 100) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await predicate();
    if (value) {
      return value;
    }

    await delay(intervalMs);
  }

  throw new Error(`Timed out while waiting for ${label}.`);
}

function parsePayload(data) {
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    return {};
  }
}

function parseRpcPayload(payload, fallback = {}) {
  if (payload && typeof payload === 'object') {
    return payload;
  }

  if (typeof payload !== 'string' || payload.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return fallback;
  }
}

async function createPlayer(label) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const username = `Smoke${label}${suffix.slice(-4)}`;
  const deviceId = `smoke-${label.toLowerCase()}-${suffix}`;
  const client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);
  const session = await client.authenticateDevice(deviceId, true, username);
  assert.ok(session.user_id, 'Authenticated session should include a user id.');
  const socket = client.createSocket(USE_SSL, false);

  const state = {
    client,
    session,
    socket,
    userId: session.user_id,
    username: session.username || username,
    activeMatchId: null,
    latestGameState: null,
    matchmakerMatched: null,
  };

  socket.onmatchdata = (message) => {
    if (message.op_code === OpCode.GAME_STATE && state.activeMatchId && message.match_id === state.activeMatchId) {
      state.latestGameState = parsePayload(message.data);
    }
  };

  socket.onmatchmakermatched = (matched) => {
    state.matchmakerMatched = matched;
  };

  await socket.connect(session, true);
  return state;
}

async function disconnectPlayer(player) {
  try {
    if (player.socket) {
      player.socket.disconnect(false);
    }
  } catch {
    // Best-effort cleanup.
  }
}

async function waitForMatchState(player, label) {
  return waitFor(() => {
    const state = player.latestGameState;
    if (state && state.players?.length >= 2 && state.phase === 'playing') {
      return state;
    }

    return null;
  }, label, 15000);
}

async function verifyQuickMatch(playerA, playerB) {
  logStep('testing quick match flow');

  let matchIdA = null;
  let matchIdB = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    playerA.matchmakerMatched = null;
    playerB.matchmakerMatched = null;

    const [ticketA, ticketB] = await Promise.all([
      playerA.socket.addMatchmaker(buildMatchmakerQuery('classic'), 2, 2, { mode: 'classic' }, {}),
      playerB.socket.addMatchmaker(buildMatchmakerQuery('classic'), 2, 2, { mode: 'classic' }, {}),
    ]);

    try {
      matchIdA = await waitFor(() => playerA.matchmakerMatched?.match_id, 'player A matchmaker result', 30000);
      matchIdB = await waitFor(() => playerB.matchmakerMatched?.match_id, 'player B matchmaker result', 30000);
      break;
    } catch (error) {
      await Promise.allSettled([
        playerA.socket.removeMatchmaker(ticketA.ticket),
        playerB.socket.removeMatchmaker(ticketB.ticket),
      ]);

      if (attempt === 1) {
        throw error;
      }

      logStep('quick match matchmaking timed out once, retrying');
    }
  }

  assert.equal(matchIdA, matchIdB, 'Quick match players should receive the same match id.');

  const [matchA, matchB] = await Promise.all([
    playerA.socket.joinMatch(matchIdA),
    playerB.socket.joinMatch(matchIdB),
  ]);

  playerA.activeMatchId = matchA.match_id;
  playerB.activeMatchId = matchB.match_id;
  assert.equal(matchA.match_id, matchB.match_id, 'Joined quick match ids should match.');
  await waitForMatchState(playerA, 'quick match state');

  await Promise.all([
    playerA.socket.leaveMatch(matchA.match_id),
    playerB.socket.leaveMatch(matchB.match_id),
  ]);

  playerA.activeMatchId = null;
  playerB.activeMatchId = null;
  playerA.latestGameState = null;
  playerB.latestGameState = null;
  playerA.matchmakerMatched = null;
  playerB.matchmakerMatched = null;
}

async function verifyPrivateRoomAndStats(playerA, playerB) {
  logStep('testing private room, gameplay, leaderboard, and stats flow');

  const createResult = await playerA.client.rpc(playerA.session, 'create_private_match', { mode: 'classic' });
  const privateRoom = parseRpcPayload(createResult.payload);
  assert.ok(privateRoom.matchId, 'Private room creation should return a match id.');
  assert.ok(privateRoom.code, 'Private room creation should return a room code.');

  const joinResult = await playerB.client.rpc(playerB.session, 'join_private_match', { code: privateRoom.code });
  const joinedRoom = parseRpcPayload(joinResult.payload);
  assert.equal(joinedRoom.matchId, privateRoom.matchId, 'Joining a private room should return the same match id.');

  const [matchA, matchB] = await Promise.all([
    playerA.socket.joinMatch(privateRoom.matchId),
    playerB.socket.joinMatch(privateRoom.matchId),
  ]);

  playerA.activeMatchId = matchA.match_id;
  playerB.activeMatchId = matchB.match_id;
  assert.equal(matchA.match_id, matchB.match_id, 'Private room join ids should match.');
  const playerAId = matchA.self.user_id;
  const playerBId = matchB.self.user_id;
  assert.ok(playerAId, 'Player A join response should include a self user id.');
  assert.ok(playerBId, 'Player B join response should include a self user id.');

  const gameState = await waitForMatchState(playerA, 'private room game state');
  const starterUserId = gameState.currentTurn;
  const starterPlayer = gameState.players.find((player) => player.userId === starterUserId);
  const otherPlayer = gameState.players.find((player) => player.userId !== starterUserId);
  assert.ok(starterPlayer, 'A starter player should exist in the match state.');
  assert.ok(otherPlayer, 'A second player should exist in the match state.');
  const movePlan = new Map([
    [starterUserId, [0, 1, 2]],
    [otherPlayer.userId, [3, 4]],
  ]);

  let previousMoveCount = gameState.moveCount;
  while ((playerA.latestGameState?.phase ?? 'lobby') !== 'game_over') {
    const currentState = await waitFor(() => {
      const state = playerA.latestGameState;
      if (state && state.phase === 'playing' && state.currentTurn) {
        return state;
      }

      return null;
    }, 'next playable turn', 15000);

    const turnPlayer = currentState.players.find((player) => player.userId === currentState.currentTurn);
    assert.ok(turnPlayer, 'The current turn should belong to a player in the match state.');
    const currentPlayer = turnPlayer.username === playerA.username ? playerA : playerB;
    const moves = movePlan.get(currentState.currentTurn);
    assert.ok(moves && moves.length > 0, 'Each turn should have a planned move.');

    const nextMove = moves.shift();
    await currentPlayer.socket.sendMatchState(privateRoom.matchId, OpCode.MAKE_MOVE, JSON.stringify({ position: nextMove }));

    const updatedState = await waitFor(() => {
      const state = playerA.latestGameState;
      if (state && state.moveCount > previousMoveCount) {
        return state;
      }

      return null;
    }, 'move acknowledgement', 15000);
    previousMoveCount = updatedState.moveCount;
  }

  const finalState = playerA.latestGameState;
  assert.equal(finalState.phase, 'game_over', 'Private room match should reach game_over.');
  assert.equal(finalState.winner, starterUserId, 'The planned starter should win the scripted match.');

  const leaderboardResponse = await playerA.client.rpc(playerA.session, 'get_leaderboard', { limit: 200 });
  const leaderboard = parseRpcPayload(leaderboardResponse.payload, []);
  assert.ok(Array.isArray(leaderboard) && leaderboard.length > 0, 'Leaderboard should return entries after the completed match.');

  const winnerPlayer = starterPlayer.username === playerA.username ? playerA : playerB;
  const loserPlayer = starterPlayer.username === playerA.username ? playerB : playerA;
  const winnerUserId = starterUserId;
  const loserUserId = otherPlayer.userId;

  const winnerStatsResponse = await winnerPlayer.client.rpc(winnerPlayer.session, 'get_player_stats', { userId: winnerUserId });
  const loserStatsResponse = await loserPlayer.client.rpc(loserPlayer.session, 'get_player_stats', { userId: loserUserId });
  const winnerStats = parseRpcPayload(winnerStatsResponse.payload);
  const loserStats = parseRpcPayload(loserStatsResponse.payload);

  assert.ok(winnerStats.wins >= 1, 'Winner should have at least one recorded win.');
  assert.ok(winnerStats.totalGames >= 1, 'Winner should have at least one recorded game.');
  assert.ok(loserStats.losses >= 1, 'Loser should have at least one recorded loss.');

  await Promise.all([
    playerA.socket.leaveMatch(privateRoom.matchId),
    playerB.socket.leaveMatch(privateRoom.matchId),
  ]);

  playerA.activeMatchId = null;
  playerB.activeMatchId = null;
}

async function main() {
  const playerA = await createPlayer('A');
  const playerB = await createPlayer('B');

  try {
    logStep(`connected players ${playerA.username} and ${playerB.username}`);
    await verifyQuickMatch(playerA, playerB);
    await verifyPrivateRoomAndStats(playerA, playerB);
    logStep('smoke test passed');
  } finally {
    await Promise.allSettled([
      disconnectPlayer(playerA),
      disconnectPlayer(playerB),
    ]);
  }
}

main().catch((error) => {
  console.error('[smoke] failed:', error);
  process.exitCode = 1;
});
