/**
 * キング＆スパイ（仮）ルール草案のモンテカルロ検証
 * docs/design/king-and-spy-rules-draft.md に基づく
 */

const WIN_MARGIN = 3;
const KING_SIDE_POINTS = 1;
const SPY_SIDE_POINTS = 2;
const SWAP_EVERY_DECISIVE = 2;

/** @typedef {'king' | 'spy' | 'citizen'} CardKind */

function makeHand(role) {
  const hand = [];
  if (role === "king") hand.push("king");
  else hand.push("spy");
  for (let i = 0; i < 4; i++) hand.push("citizen");
  return hand;
}

/** @returns {'king-side' | 'spy-side' | 'tie'} */
function winningFaction(playA, playB) {
  if (playA === "citizen" && playB === "citizen") return "tie";
  const beats = { king: "citizen", citizen: "spy", spy: "king" };
  let winnerCard = null;
  if (beats[playA] === playB) winnerCard = playA;
  else if (beats[playB] === playA) winnerCard = playB;
  else throw new Error(`invalid pair ${playA} ${playB}`);
  if (winnerCard === "spy") return "spy-side";
  return "king-side";
}

/** @returns {number | 'tie'} 加点を受けるプレイヤー */
function decisiveWinnerPlayer(playA, playB, kingRolePlayer) {
  const faction = winningFaction(playA, playB);
  if (faction === "tie") return "tie";
  if (faction === "king-side") return kingRolePlayer;
  return 1 - kingRolePlayer;
}

function pickRandom(hand, rng) {
  const i = Math.floor(rng() * hand.length);
  const card = hand[i];
  hand.splice(i, 1);
  return card;
}

/** @param {() => number} rng */
function playOneDecisiveRound(kingRolePlayer, rng, stats) {
  const hands = [makeHand(kingRolePlayer === 0 ? "king" : "spy"), makeHand(kingRolePlayer === 1 ? "king" : "spy")];
  let plays = 0;
  while (true) {
    const c0 = pickRandom(hands[0], rng);
    const c1 = pickRandom(hands[1], rng);
    plays++;
    const winPlayer = decisiveWinnerPlayer(c0, c1, kingRolePlayer);
    if (winPlayer === "tie") continue;
    stats.playsPerDecisive.push(plays);
    const winningRole = winPlayer === kingRolePlayer ? "king" : "spy";
    return { winPlayer, winningRole, plays };
  }
}

function addPoints(scores, winPlayer, winningRole) {
  const pts = winningRole === "king" ? KING_SIDE_POINTS : SPY_SIDE_POINTS;
  scores[winPlayer] += pts;
}

function scoreDiff(scores) {
  return Math.abs(scores[0] - scores[1]);
}

function leader(scores) {
  if (scores[0] === scores[1]) return -1;
  return scores[0] > scores[1] ? 0 : 1;
}

/** @param {() => number} rng */
function playMatch(rng, startKingPlayer = 0) {
  const scores = [0, 0];
  let kingRolePlayer = startKingPlayer;
  let decisiveCount = 0;
  const stats = {
    decisives: 0,
    playsPerDecisive: [],
    kingDecisives: 0,
    spyDecisives: 0,
    swaps: 0,
  };

  const maxDecisives = 500;
  while (scoreDiff(scores) < WIN_MARGIN) {
    if (stats.decisives >= maxDecisives) {
      return { ...stats, scores, kingRolePlayer, aborted: true };
    }
    const r = playOneDecisiveRound(kingRolePlayer, rng, stats);
    addPoints(scores, r.winPlayer, r.winningRole);
    stats.decisives++;
    decisiveCount++;
    if (r.winningRole === "king") stats.kingDecisives++;
    else stats.spyDecisives++;

    if (scoreDiff(scores) >= WIN_MARGIN) break;

    if (decisiveCount % SWAP_EVERY_DECISIVE === 0) {
      kingRolePlayer = 1 - kingRolePlayer;
      stats.swaps++;
    }
  }

  return {
    ...stats,
    scores,
    kingRolePlayer,
    winner: leader(scores),
    margin: scoreDiff(scores),
    aborted: false,
  };
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function runBatch(n, startKingPlayer) {
  const rng = mulberry32(42 + startKingPlayer);
  const decisives = [];
  const margins = [];
  let wins = [0, 0];
  let aborted = 0;
  let totalKingDec = 0;
  let totalSpyDec = 0;
  const playsPer = [];

  for (let i = 0; i < n; i++) {
    const m = playMatch(rng, startKingPlayer);
    if (m.aborted) {
      aborted++;
      continue;
    }
    decisives.push(m.decisives);
    margins.push(m.margin);
    wins[m.winner]++;
    totalKingDec += m.kingDecisives;
    totalSpyDec += m.spyDecisives;
    playsPer.push(...m.playsPerDecisive);
  }

  decisives.sort((a, b) => a - b);
  playsPer.sort((a, b) => a - b);

  return {
    n,
    aborted,
    wins,
    winRateP0: wins[0] / (n - aborted),
    decisives: {
      min: decisives[0],
      p50: percentile(decisives, 50),
      p90: percentile(decisives, 90),
      p99: percentile(decisives, 99),
      max: decisives[decisives.length - 1],
      mean: decisives.reduce((a, b) => a + b, 0) / decisives.length,
    },
    playsPerDecisive: {
      min: playsPer[0],
      p50: percentile(playsPer, 50),
      max: playsPer[playsPer.length - 1],
      mean: playsPer.reduce((a, b) => a + b, 0) / playsPer.length,
    },
    kingDecisiveShare: totalKingDec / (totalKingDec + totalSpyDec),
  };
}

/** 最悪近い: 毎手市民だけ出す（引き分け連鎖） */
function maxTiesInOneRound() {
  let kingRolePlayer = 0;
  const hands = [makeHand("king"), makeHand("spy")];
  let ties = 0;
  while (hands[0].length && hands[1].length) {
    const i0 = hands[0].indexOf("citizen");
    const i1 = hands[1].indexOf("citizen");
    if (i0 < 0 || i1 < 0) break;
    hands[0].splice(i0, 1);
    hands[1].splice(i1, 1);
    ties++;
  }
  return { ties, left: [hands[0].length, hands[1].length], hands };
}

/** 片方だけ最適に刺客で首領を狙う等は別途 — ここでは構造チェック */
function analyticMinDecisivesToWin() {
  return {
    kingStreakNoAnswer: { decisives: 3, points: 3, note: "相手0点・首領側決着のみ+1×3" },
    spyStreakNoAnswer: { decisives: 2, points: 4, note: "相手0点・刺客側決着のみ+2×2で4点差≥3" },
    spyThenKingMix: { example: "0-0 → 刺客+2 → 1-2差? 0と2差2 → 首領+1 → 1と2差1 → 刺客+2 → 1と4差3勝" },
  };
}

console.log("=== 構造チェック ===");
console.log("max citizen ties then remaining:", maxTiesInOneRound());
console.log("analytic:", analyticMinDecisivesToWin());

console.log("\n=== ランダム手 50,000 マッチ (開始: P0=首領側) ===");
console.log(JSON.stringify(runBatch(50_000, 0), null, 2));

console.log("\n=== ランダム手 50,000 マッチ (開始: P1=首領側) ===");
console.log(JSON.stringify(runBatch(50_000, 1), null, 2));

/** 市民のみランダムでは偏るので、決着側の条件付き確率を完全ランダム理論値と比較 */
function exactOnePlayDistribution(kingRolePlayer) {
  const h0 = [...makeHand(kingRolePlayer === 0 ? "king" : "spy")];
  const h1 = [...makeHand(kingRolePlayer === 1 ? "king" : "spy")];
  let tie = 0;
  let kingW = 0;
  let spyW = 0;
  let total = 0;
  for (const a of h0) {
    for (const b of h1) {
      total++;
      const faction = winningFaction(a, b);
      if (faction === "tie") tie++;
      else if (faction === "king-side") kingW++;
      else spyW++;
    }
  }
  return {
    outcomes: total,
    kingSideDecisive: kingW / total,
    spySideDecisive: spyW / total,
    tieRate: tie / total,
  };
}

/** 市民優先で引き分けを最大化するプレイ */
function pickCitizenFirst(hand) {
  const i = hand.indexOf("citizen");
  if (i >= 0) return hand.splice(i, 1)[0];
  return hand.splice(0, 1)[0];
}

function playOneDecisiveRoundStrategy(kingRolePlayer, bothTieSpam) {
  const hands = [makeHand(kingRolePlayer === 0 ? "king" : "spy"), makeHand(kingRolePlayer === 1 ? "king" : "spy")];
  let plays = 0;
  while (true) {
    const c0 = bothTieSpam ? pickCitizenFirst(hands[0]) : pickRandom(hands[0], Math.random);
    const c1 = bothTieSpam ? pickCitizenFirst(hands[1]) : pickRandom(hands[1], Math.random);
    plays++;
    const winPlayer = decisiveWinnerPlayer(c0, c1, kingRolePlayer);
    if (winPlayer === "tie") continue;
    const winningRole = winPlayer === kingRolePlayer ? "king" : "spy";
    return { winPlayer, winningRole, plays };
  }
}

function playMatchTieSpam(startKingPlayer) {
  const scores = [0, 0];
  let kingRolePlayer = startKingPlayer;
  let decisiveCount = 0;
  let totalPlays = 0;
  let decisives = 0;
  while (scoreDiff(scores) < WIN_MARGIN) {
    const r = playOneDecisiveRoundStrategy(kingRolePlayer, true);
    totalPlays += r.plays;
    addPoints(scores, r.winPlayer, r.winningRole);
    decisives++;
    decisiveCount++;
    if (scoreDiff(scores) >= WIN_MARGIN) break;
    if (decisiveCount % SWAP_EVERY_DECISIVE === 0) kingRolePlayer = 1 - kingRolePlayer;
    if (decisives > 500) return { aborted: true };
  }
  return { decisives, totalPlays, scores, margin: scoreDiff(scores) };
}

function runStartRoleBias(n) {
  const res = {
    startAsKing: { wins: 0, decisives: [] },
    startAsSpy: { wins: 0, decisives: [] },
  };
  const rng = mulberry32(99);
  for (let i = 0; i < n; i++) {
    const start = i % 2;
    const m = playMatch(rng, start);
    const bucket = start === 0 ? res.startAsKing : res.startAsSpy;
    bucket.decisives.push(m.decisives);
    if (m.winner === start) bucket.wins++;
  }
  const out = {};
  for (const key of ["startAsKing", "startAsSpy"]) {
    const d = res[key].decisives.sort((a, b) => a - b);
    out[key] = {
      wins: res[key].wins,
      matches: n / 2,
      winRate: res[key].wins / (n / 2),
      decisivesP50: percentile(d, 50),
      decisivesMean: d.reduce((a, b) => a + b, 0) / d.length,
    };
  }
  return out;
}

console.log("\n=== 1手ランダム時の決着分布（合法な手の組み合わせ25通り） ===");
console.log("P0首領:", exactOnePlayDistribution(0));
console.log("P1首領:", exactOnePlayDistribution(1));

console.log("\n=== 開始役割の勝率 (各25,000マッチ) ===");
console.log(JSON.stringify(runStartRoleBias(50_000), null, 2));

console.log("\n=== 両者市民優先（1ラウンド内引き分け最大化）1000マッチ ===");
const tieSpamStats = { decisives: [], playsPerMatch: [] };
for (let i = 0; i < 1000; i++) {
  const m = playMatchTieSpam(0);
  tieSpamStats.decisives.push(m.decisives);
  tieSpamStats.playsPerMatch.push(m.totalPlays);
}
tieSpamStats.decisives.sort((a, b) => a - b);
tieSpamStats.playsPerMatch.sort((a, b) => a - b);
console.log({
  decisivesP50: percentile(tieSpamStats.decisives, 50),
  decisivesMax: tieSpamStats.decisives.at(-1),
  totalCardPlaysP50: percentile(tieSpamStats.playsPerMatch, 50),
  totalCardPlaysMax: tieSpamStats.playsPerMatch.at(-1),
});

/** スコア差3の最短・最長パス（手動シナリオ） */
function simulateScripted(plays) {
  let scores = [0, 0];
  let kingRole = 0;
  let dec = 0;
  for (const faction of plays) {
    const winPlayer = faction === "king-side" ? kingRole : 1 - kingRole;
    addPoints(scores, winPlayer, faction === "king-side" ? "king" : "spy");
    dec++;
    if (dec % 2 === 0) kingRole = 1 - kingRole;
    if (scoreDiff(scores) >= WIN_MARGIN) return { scores, dec, winner: leader(scores) };
  }
  return { scores, dec, winner: -1 };
}

console.log("\n=== シナリオ: 刺客決着×2のみ (0-0開始) ===");
console.log(simulateScripted(["spy-side", "spy-side"]));
console.log("=== シナリオ: 首領決着×3のみ ===");
console.log(simulateScripted(["king-side", "king-side", "king-side"]));
console.log("=== シナリオ: 首領→刺客→首領 (交代あり) ===");
console.log(simulateScripted(["king-side", "spy-side", "king-side"]));
