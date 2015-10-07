+++
date = "2015-03-19T12:53:30-04:00"
title = "Domain Specific Language"
[menu.main]
  parent = "Reference"
  identifier = "DSL"
  weight = 70
  pre = "<i class='fa'></i>"
+++

# Domain Specific Language

A domain-specific language (DSL) is a computer language specialized to a particular application domain. This is in contrast to a general-purpose language (GPL), which is broadly applicable across domains, and lacks specialized features for a particular domain.

Vitesse is a target to for custom DSLs created by developers. Let's look at a very simple example leveraging ES6 to create a custom validation language.

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

This simple custom DSL let's you create validations of the following style.

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
