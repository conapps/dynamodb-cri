[![NPM version](https://badge.fury.io/js/tslint-blueprint.svg)](https://www.npmjs.com/package/tslint-blueprint)
[![Downloads](http://img.shields.io/npm/dm/tslint-blueprint.svg)](https://npmjs.org/package/tslint-blueprint)
[![Circle CI](https://circleci.com/gh/palantir/tslint-blueprint.svg?style=svg)](https://circleci.com/gh/palantir/tslint-blueprint)

tslint-blueprint
------------

[TSLint](https://github.com/palantir/tslint/) rules to enforce best practices with blueprintjs libraries

### Usage

Sample configuration where `tslint.json` lives adjacent to your `node_modules` folder:

```js
{
  "extends": ["tslint:latest", "tslint-blueprint"]
}
```

### Rules

Coming soon!

### Development

We track rule suggestions on Github issues -- [here's a useful link](https://github.com/palantir/tslint-blueprint/issues?q=is%3Aissue+is%3Aopen+label%3A%22Type%3A+Rule+Suggestion%22) to view all the current suggestions. Tickets are roughly triaged by priority (P1, P2, P3).

We're happy to accept PRs for new rules, especially those marked as [Status: Accepting PRs](https://github.com/palantir/tslint-blueprint/issues?q=is%3Aissue+is%3Aopen+label%3A%22Status%3A+Accepting+PRs%22). If submitting a PR, try to follow the same style conventions as the [core TSLint project](https://github.com/palantir/tslint).

Quick Start (requires Node v6+, yarn v0.18):

1. `yarn`
1. `yarn compile`
1. `yarn lint`
1. `./scripts/verify.sh`

### Changelog

See the Github [release history](https://github.com/palantir/tslint-blueprint/releases).
