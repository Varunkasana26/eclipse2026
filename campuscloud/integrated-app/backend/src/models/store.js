const InMemoryQueue = require("../queue/inMemoryQueue");

function createStore() {
  return {
    nodes: new Map(),
    workspaces: new Map(),
    jobs: new Map(),
    queue: new InMemoryQueue(),
    onboarding: new Map(),
    workspaceSequence: 0,
  };
}

module.exports = {
  createStore,
};
