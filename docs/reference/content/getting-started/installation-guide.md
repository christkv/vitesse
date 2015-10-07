+++
date = "2015-03-17T15:36:56Z"
title = "Installation Guide"
[menu.main]
  parent = "Getting Started"
  identifier = "Installation Guide"
  weight = 1
  pre = "<i class='fa'></i>"
+++

# Installation

The recommended way to get started using Vitesse is by using the `NPM` (Node Package Manager) to install the dependency in your project.

## Vitesse

Given that you have created your own project using `npm init` we install the vitesse module and it's dependencies by executing the following `NPM` command.

```
npm install vitesse --save
```

This will download the vitesse module and add a dependency entry in your `package.json` file.

## Initial requirement for ClosureCompiler

If you want to use the `ClosureCompiler` you will need a `Java` runtime installed on your machine as the compiler is dependent on it to execute the Google Closure Compiler.