"use strict"

class Builder {
  constructor() {
    this.rules = [];
  }

  rule(path) {
    var rule = new Rule(path);
    this.rules.push(rule);
    return rule;
  }
}

class Rule {
  constructor(path) {
    this.path = path;
  }

  type(type) {
    this.type = type;
    return this;
  }

  exists(value) {
    this.exists = value;
    return this;
  }

  validate(validation) {
    this.validation = validation;
    return this;
  }
}

module.exports = Builder;
