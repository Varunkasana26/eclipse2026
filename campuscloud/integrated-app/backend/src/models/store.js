const InMemoryQueue = require("../queue/inMemoryQueue");

function createStore() {
  return {
    nodes: new Map(),
    jobs: new Map(),
    queue: new InMemoryQueue(),
    onboarding: new Map(),
  };
}

module.exports = {
  createStore,
};
