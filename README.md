# packages-outdated
[![Build Status](https://travis-ci.com/luctst/packages-outdated.svg?branch=master)](https://travis-ci.com/luctst/packages-outdated)
[![NPM version](https://img.shields.io/npm/v/packages-outdated)](https://img.shields.io/npm/v/packages-outdated)
[![Package size](https://img.shields.io/bundlephobia/min/packages-outdated)](https://img.shields.io/bundlephobia/min/packages-outdated)
[![Dependencies](https://img.shields.io/david/luctst/packages-outdated.svg?style=popout-square)](https://david-dm.org/luctst/packages-outdated)
[![devDependencies Status](https://david-dm.org/luctst/packages-outdated/dev-status.svg?style=flat-square)](https://david-dm.org/luctst/packages-outdated?type=dev)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Twitter](https://img.shields.io/twitter/follow/luctstt.svg?label=Follow&style=social)](https://twitter.com/luctstt)

*Check if all your dependencies in all your NodeJs projects are up to date. Enough checking one by one all your projects to find dependencies out of date, now with one command you know exactly where you need some update.*

## Usage
Enter this command:

```
npx packages-outdated <path>
```

To get more informations about all commands and flags availables enter:

```
npx packages-outdated --help
```

> **Note** - You need node >= 10.0.0 to run this module.

## Examples
I'm using the path present on my computer do not use the same path. I will be using this folder structure:

```
├── Users/lucas/dev/
	├── chrome-extension/
	├── computer-science/
	├── get-readme/
	├── lucastostee.com/
	├── luctst-cli/
	...
```

> **Note** - Your terminal must have the right to read the folder(s) enter.

### Check for one project.
![gif one project](img/oneproject.gif)

### Check for many projects
![gif many projects](img/manyprojects.gif)

This package only work for now with folder with one subfolder level. It will not work with this kind of structure:

```js
├── main-folder/
	// only work for this level.
	├── sub-folder/
		├── nodejs-project.
```

## Contributing
You've found an issue ? A new idea for the project and you want contribute ? It's nice, but before coding make sure you have read the [CONTRIBUTING.md](https://github.com/luctst/packages-outdated/blob/master/.github/CONTRIBUTING.md) file it is important.

## Licence
MIT

<p style="font-size:8px;text-align:center;margin-top:50px;">File generated with <a href="https://github.com/luctst/get-good-readme">get-good-readme</a> module.</p>
