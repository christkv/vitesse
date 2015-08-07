var rules = [],
f = require('util').format;

var ValidationError = function(message, field, parent, rule, object) {
  this.message = message;
  this.field = field;
  this.parent = parent;
  this.rule = rule;
  this.object = object;
}

var func0 = function(field, object, parent, rule, context, errors) {
  if (object == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func1 = function(field, object, parent, rule, context, errors) {
  if (object == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func2 = function(field, object, parent, rule, context, errors) {
  if (object == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func4 = function(field, object, parent, rule, context, errors) {
  if (object.user == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object.user == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func5 = function(field, object, parent, rule, context, errors) {
  if (object.users == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object.users == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func7 = function(field, object, parent, rule, context, errors) {
  if (object.field == null && context.failOnFirst) {
    throw new ValidationError('field does not exist', field, parent, rule, object);
  } else if (object.field == null) {
    errors.push(new ValidationError('field does not exist', field, parent, rule, object));
  }
}



var func6 = function(field, object, parent, rule, context, errors) {
  if (object == null) {
    return;
  }

  for (var i = 0; i < object.length; i++) {
    func7("field", object[i], f("%s.%s[%s]", parent, field, i), rules[7], context, errors);
  }
}



var func3 = function(field, object, parent, rule, context, errors) {
  if (object == null) {
    return;
  }

  for (var i = 0; i < object.length; i++) {
    func4("user", object[i], f("%s.%s[%s]", parent, field, i), rules[4], context, errors);
    func5("users", object[i], f("%s.%s[%s]", parent, field, i), rules[5], context, errors);
    func6("users", object[i].users, f("%s.%s[%s]", parent, field, i), rules[6], context, errors);
  }
}



var validate = function(object, context) {
  context = context || {};
  var errors = [];
  func0("number", object.number, "object", rules[0], context, errors);
  func1("string", object.string, "object", rules[1], context, errors);
  func2("array", object.array, "object", rules[2], context, errors);
  func3("array", object.array, "object", rules[3], context, errors);

  return errors;
};

try {
  validate({}, {failOnFirst:true})  
} catch(err) {
  console.dir(err)
}
