#!/usr/bin/env node
/* eslint-disable no-console */
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const latestversion = require("latest-version");
const textTable = require("text-table");

let spinner;
const print = [];
const { input } = meow(`
	${chalk.green("Usage")}
		$ packages-outdated <flags> [folder-path]

	${chalk.yellow("Flags")}
		--version, Display the actual package version
		--help, Display all commands and options available

	${chalk.blue("Exemples")}
		$ packages-outdated --version
		$ packages-outdated ./
		$ packages-outdated /
`);

/**
 * Take an object of dependencies and return and object with the name and last version of this package.
 * @param {Object} dependencies
 * @returns {Object}
 */
function returnVersion(dependencies) {
	const allias = ["^", "*", ">=", "@"];

	return Object.keys(dependencies).map(async pkg => {
		let actualVersion = dependencies[pkg];

		allias.map(item => {
			if (actualVersion.includes(item))
				return (actualVersion = actualVersion.split(item)[1]);
		});

		return {
			name: pkg,
			actualVersion,
			lastVersion: await latestversion(pkg)
		};
	});
}

/**
 * Check if `pkg` has some dependencies, check if they are up to date.
 * @param {Object} pkg
 * @param {String} project
 * @param {Boolean} isNodeRoot If true, `project` is a node root project so at the end stop the spinner.
 */
async function checkVersion(pkg, project, isNodeRoot = false) {
	// Has 0 dependencies.
	if (!pkg.dependencies && !pkg.devDependencies) {
		spinner.warn(
			chalk`{green ${project}/} project doesn't have any Node dependencies you should add one..  😢 \n`
		);
		return;
	}

	let dependenciesPromise = null;
	let devDependenciesPromise = null;
	const promiseArray = [];

	// Has dependencies but 0 devDependencies
	if (pkg.dependencies && !pkg.devDependencies) {
		spinner.text = chalk`{green ${project}/} only has dependencies, start parsing it. \n`;

		dependenciesPromise = returnVersion(pkg.dependencies);
		promiseArray.push(...dependenciesPromise);
	}

	// Has devDependencies but 0 dependencies
	if (!pkg.dependencies && pkg.devDependencies) {
		spinner.text = chalk`{green ${project}/} only has devDependencies, start parsing it. \n`;

		devDependenciesPromise = returnVersion(pkg.devDependencies);
		promiseArray.push(...devDependenciesPromise);
	}

	// Has dev and dependencies
	if (pkg.dependencies && pkg.devDependencies) {
		spinner.text = chalk`Start parsing {green ${project}/} dependencies. \n`;

		dependenciesPromise = returnVersion(pkg.dependencies);
		devDependenciesPromise = returnVersion(pkg.devDependencies);
		promiseArray.push(...dependenciesPromise, ...devDependenciesPromise);
	}

	Promise.all([...promiseArray])
		.then(values => {
			print.push([
				chalk`{underline Dependencies}`,
				chalk`{underline Version}`,
				chalk`{underline Latest-Version}`
			]);

			values.map(packageInfo => {
				if (packageInfo.actualVersion === packageInfo.lastVersion) {
					return print.push([
						chalk`{green ${packageInfo.name}}`,
						chalk`{green ${packageInfo.actualVersion}}`,
						chalk`{green ${packageInfo.lastVersion}}`
					]);
				}

				print.push([
					chalk`{red ${packageInfo.name}}`,
					chalk`{red ${packageInfo.actualVersion}}`,
					chalk`{green ${packageInfo.lastVersion}}`
				]);
			});

			isNodeRoot ? spinner.succeed(chalk`It's done !!`) : null;

			console.log(textTable(print, { align: ["l", "l", "l"] }));
			console.log(chalk`\n {green ${project}/} has been parsed congrats !! ✨✨ \n`);

			print.length = 0;
		})
		.catch(err => spinner.fail(err.message));
}

/**
 * Run the process.
 * @param {String} pathEnter The path enter by user.
 */
async function run(pathEnter) {
	const directoryEnter = path.resolve(pathEnter);
	const fsPromises = fs.promises;

	spinner = ora(
		`Start evaluating your dependencies from ${chalk.green(directoryEnter)} 📦 📦\n`
	).start();

	try {
		await fsPromises.access(directoryEnter);
		const directory = await fsPromises.readdir(directoryEnter);

		// If path enter is already a node project no need to loop just check and return.
		if (directory.includes("package.json")) {
			return checkVersion(
				require(path.join(directoryEnter, "package.json")),
				path.basename(directoryEnter),
				true
			);
		}

		// If path enter is an empty directory.
		if (directory.length === 0) {
			spinner.fail("Your folder is empty... Add some stuff in it");
			return;
		}

		// Else loop through all the folders presents.
		directory.map(async item => {
			if (item === "node_modules" || item.startsWith(".")) return;

			const lStat = await fsPromises.lstat(path.join(directoryEnter, item));

			if (lStat.isDirectory()) {
				const subDirectory = await fsPromises.readdir(path.join(directoryEnter, item));

				if (subDirectory.includes("package.json")) {
					return checkVersion(
						require(`${path.join(directoryEnter, item, "package.json")}`),
						item
					);
				}

				console.log(chalk`\n {green ${item}/} is not a NodeJs project..`);
			}
		});

		spinner.succeed("It's done !!");
	} catch (error) {
		spinner.fail(error.message);
	}
}

if (input.length === 0) {
	console.error(`${chalk.red("\n Error, You must enter a folder path \n")}`);
	process.exit();
}

if (input.length > 1) {
	console.error(`${chalk.red("\n Error, you must enter only one argument \n")}`);
	process.exit();
}

if (input.length > 0) {
	run(input[0]);
}
