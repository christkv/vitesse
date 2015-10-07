+++
date = "2015-03-18T16:56:14Z"
title = "Issues & Help"
[menu.main]
  weight = 100
  pre = "<i class='fa fa-life-ring'></i>"
+++

# Issues & Bugs

Issues and bug fixes can be opened as Issues in the [github tracker](https://github.com/christkv/vitesse/issues) for the project.

## Pull Requests

We are happy to accept contributions to help improve vitesse.
We will guide user contributions to ensure they meet the standards of the codebase.
Please ensure that any pull requests include documentation and tests and also pass
a the travis.ci tests.

To get started check out the source and work on a branch:

```bash
$ git clone https://github.com/christkv/vitesse.git
$ cd vitesse
$ npm install
$ git checkout -b myNewFeature
```

Ensure you code passes the test suite. 

Run the functional test suite.
```bash
$ node test/runner.js -t functional
```
