class InMemoryQueue {
  constructor() {
    this.items = [];
  }

  enqueue(value) {
    if (!this.items.includes(value)) {
      this.items.push(value);
    }
  }

  remove(value) {
    const index = this.items.indexOf(value);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  snapshot() {
    return [...this.items];
  }
}

module.exports = InMemoryQueue;
