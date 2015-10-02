# Vitesse

## Description

Vitesse is a high speed object validation framework. It's meant as a target for developers to build validation frameworks or DSL (Domain specific languages) while being able to leverage close to hand-coded performance.

* Joi test x 139,410 ops/sec ±1.86% (85 runs sampled)
* Compiler test optimized x 2,555,137 ops/sec ±1.50% (93 runs sampled)
* Closure compiler test x 2,745,918 ops/sec ±0.86% (83 runs sampled)
* Manual vitesse test x 2,588,368 ops/sec ±0.83% (92 runs sampled)

The goal of this project is to allow you to avoid the cost of interpreting a set of validation rules by ahead of time compile it (AOT) using eval, allowing you to get close to the performance of manually writing validation code.

With Vitesse as your target you can define whatever DSL you want and have Vitesse optimize it for maximum performance

It's easy to write your own custom DSL. Below is a simple example of a possible custom validation DSL using ES6.

```js
"use strict"

var v = require('vitesse'),
  StringNode = v.StringNode,
  ObjectNode = v.ObjectNode,
  IntegerNode = v.IntegerNode,
  NumberNode = v.NumberNode,
  ArrayNode = v.ArrayNode,
  VitesseCompiler = v.Compiler;

class Validator {
  constructor() {    
  }

  static object() {
    return new ObjectBuilder();
  }

  static string() {
    return new StringBuilder();
  }

  static array() {
    return new ArrayBuilder();
  }
}

class Compiler {
  constructor() {    
  }

  compile(object, options) {
    options = options || {};
    options.optimizer = true;
    // Get the compiler
    return new VitesseCompiler().compile(object.object, options);
  }
}

class ObjectBuilder {
  constructor() {    
    this.object = new ObjectNode(null, null, {typeCheck:true});
  }

  fields(fields) {
    for(var name in fields) {
      this.object.addChild(name, fields[name].object);
    }

    return this;
  }

  require(required) {
    this.object.requiredFields(required);
    return this;
  }
}

class StringBuilder {
  constructor() {    
    this.object = new StringNode(null, null, {typeCheck:true})
  }

  in(values) {
    this.object.addValidation({$in: values});
    return this;
  }
}

class ArrayBuilder {
  constructor() {    
    this.object = new ArrayNode(null, null, {typeCheck:true})
  }

  of(object) {
    this.object.addItemValidation(object.object);
    return this;
  }
}

module.exports = {
  Validator: Validator,
  Compiler: Compiler
}
```

This simple DSL let's you create validations of the following style.

```js
var validator = Validator
  .object()
  .fields({
    id: Validator.string(),
    users: Validator.array().of(Validator.object().fields({
      id: Validator.string(),
      permissions: Validator.array().of(Validator.string().in(['read', 'write', 'delete', 'upate']))
    })
    .require(['id', 'permissions']))
  })
  .require(['id', 'users']);  

var compiler = new Compiler();
var validator = compiler.compile(validator);
assert.equal(1, validator.validate({id:'', users:[{id:'', permissions:['yupp']}]}).length);
```