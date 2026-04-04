const InMemoryQueue = require("../queue/inMemoryQueue");

function createStore() {
  return {
    nodes: new Map(),
    jobs: new Map(),
    queue: new InMemoryQueue(),
  };
}

module.exports = {
  createStore,
};
