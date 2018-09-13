<img style="float: right; width: 48px;" src="icon.png"></img>

# Closest File Data [![Build Status](https://travis-ci.org/huafu/closest-file-data.svg?branch=master)](https://travis-ci.org/huafu/closest-file-data) [![Beerpay](https://beerpay.io/huafu/closest-file-data/badge.svg?style=beer-square)](https://beerpay.io/huafu/closest-file-data)  [![Beerpay](https://beerpay.io/huafu/closest-file-data/make-wish.svg?style=flat-square)](https://beerpay.io/huafu/closest-file-data?focus=wish)

A NodeJS module to find and retrieve data (such as config) related to a given path. No dependencies. Implements caching.

## What is this?

### TL;DR:

```js
// some/project/path
// ├── package.json
// └── src
//     ├── index.js
//     └── utils
//         └── dummy.js
const pkg = closestFileData(
  '/some/project/path/src/utils/dummy.js',
  {basename: 'package.json', read: require}
);
console.log(pkg.version);
```

---

### A more complex example

Let's say you want to find some config data related to a given file. We'll take BabelJS for example. Their config can be
a `JSON` file in `.babelrc`, or a `JS` file in `.babelrc.js`, or even in the `babel` key of `package.json`.
Now you are given the path of a file and you want to get the Babel config closest to that file... what a mess!

Well, with this module now you can safely do:

```js
import closestFileData from 'closest-file-data';

const babelReaders = [
  // each line represents what is called a reader (see below):
  { basename: '.babelrc', read: f => JSON.parse(readFileSync(f, 'utf-8')) },
  { basename: '.babelrc.js', read: f => require(f) },
  { basename: 'package.json', read: f => require(f).babel },
];

const config = closestFileData('/path/to/some/deep/file.js', babelReaders);
// `config` will be either the object representing the first config data found,
// or `undefined` if no configuration found.
```

## What is a `reader`?

A reader is an object with 2 properties:

- **`basename`**: the basename of the file for which the `read` will be called with.
- **`read`**: a method that should return either the data read for given file, or `undefined` if the `read` should
  be considered without result (useful in the Babel case for example when there is no `babel` key in the `package.json`).

The second parameter to `closestFileData()` can be a single reader or an array of readers.
It will try a find a file with name `basename` in the given `path` (first argument of `closestFileData`) for each
given reader, until one returns something else then `undefined`. If none, it'll go up one directory and start again,
until it reaches the root of the filesystem.

## Is it cached?

Yup, the cache is different per list of base names files in the set of readers given to `closestFileData()`.
You can also clear the cache if needed for testing purpose:

```js
import closestFileData from 'closest-file-data';

// ...

closestFileData.cache.clear();
```

### Installing

Add to your project with `npm`:

```bash
npm install --save closest-file-data
```

or with `yarn`:

```bash
yarn add closest-file-data
```

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

You need to get a copy of the repository to run unit and integration tests:

```bash
git clone https://github.com/huafu/closest-file-data.git
cd closest-file-data
npm run test
```

### There is 3 test scripts:

- `test:unit`: run tests using the typescript source in `src`, useful while developing.
- `test:dist`: run tests using the built js version in `dist`, needs to have ran `build` before.
- `test:e2e`: run real World tests without mocking the file-system, using the built js version in `dist`. Needs to have ran `build` before.

The `test` script run them all and takes care of building the sources before.

## Built With

* [TypeScript](https://www.typescriptlang.org/)

## Contributing

Pull requests welcome!

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/huafu/closest-file-data/tags). 

## Authors

* **Huafu Gandon** - *Initial work* - [huafu](https://github.com/huafu)

See also the list of [contributors](https://github.com/huafu/closest-file-data/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Support on Beerpay
Hey dude! Help me out for a couple of :beers:!

[![Beerpay](https://beerpay.io/huafu/closest-file-data/badge.svg?style=beer-square)](https://beerpay.io/huafu/closest-file-data)  [![Beerpay](https://beerpay.io/huafu/closest-file-data/make-wish.svg?style=flat-square)](https://beerpay.io/huafu/closest-file-data?focus=wish)