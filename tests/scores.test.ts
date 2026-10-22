import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyHistory, readScoreHistory, matchCategory, recordResult, clearResults, scoreTotal } from "../src/scores.ts";

test("AI and each local player count keep independent wins and draws", () => {
  let history = emptyHistory();
  history = recordResult(history, matchCategory("ai", 2), "O");
  history = recordResult(history, matchCategory("local", 2), "X");
  history = recordResult(history, matchCategory("local", 3), "G");
  history = recordResult(history, matchCategory("local", 4), "Y");
  history = recordResult(history, "ai", "draw");
  assert.equal(history.tables.ai.O, 1);
  assert.equal(history.tables.ai.X, 0);
  assert.equal(history.tables.ai.draw, 1);
  assert.equal(history.tables["local-2"].X, 1);
  assert.equal(history.tables["local-3"].G, 1);
  assert.equal(history.tables["local-4"].Y, 1);
});
test("old results migrate without inventing whether they came from AI or local play", () => {
  const history = readScoreHistory(null, JSON.stringify({ X: 5, O: 2, G: 1, draw: 3 }));
  assert.equal(history.tables.legacy.X, 5);
  assert.equal(history.tables.legacy.O, 2);
  assert.equal(scoreTotal(history.tables.ai), 0);
  assert.equal(scoreTotal(history.tables["local-2"]), 0);
  assert.deepEqual(readScoreHistory(JSON.stringify(history), null), history);
});
test("clearing one category preserves all others and does not mutate the old save", () => {
  let history = recordResult(emptyHistory(), "ai", "X");
  history = recordResult(history, "local-4", "Y");
  const cleared = clearResults(history, "ai");
  assert.equal(scoreTotal(cleared.tables.ai), 0);
  assert.equal(cleared.tables["local-4"].Y, 1);
  assert.equal(history.tables.ai.X, 1);
  assert.deepEqual(clearResults(history, "all"), emptyHistory());
  assert.deepEqual(readScoreHistory(JSON.stringify(clearResults(history, "all")), JSON.stringify({ X: 17 })), emptyHistory());
});
test("corrupt and invalid counts are ignored while valid persisted values survive", () => {
  assert.deepEqual(readScoreHistory("{broken", null), emptyHistory());
  const history = readScoreHistory(JSON.stringify({ version: 3, tables: { ai: { X: -1, O: 2.5, G: "10", Y: Number.MAX_VALUE, draw: 4 } } }), null);
  assert.equal(history.tables.ai.draw, 4);
  assert.equal(scoreTotal(history.tables.ai), 4);
});


