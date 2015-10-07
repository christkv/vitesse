+++
date = "2015-03-17T15:36:56Z"
title = "index"
type = "index"
+++

# Vitesse

## Description

Vitesse is a high speed object validation framework. It's meant as a target for developers to build validation frameworks or DSL (Domain specific languages) while being able to leverage close to hand-coded performance.

* Joi test x 139,410 ops/sec ±1.86% (85 runs sampled)
* Compiler test optimized x 2,555,137 ops/sec ±1.50% (93 runs sampled)
* Closure compiler test x 2,745,918 ops/sec ±0.86% (83 runs sampled)
* Manual vitesse test x 2,588,368 ops/sec ±0.83% (92 runs sampled)

The goal of this module is to allow you to avoid the cost of interpreting a set of validation rules by ahead of time compile it (AOT) using eval, allowing you to get close to the performance of manually writing validation code.

With Vitesse as your target you can define whatever DSL you want and have Vitesse optimize it for maximum performance
