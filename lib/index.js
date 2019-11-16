#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const latestversion = require("latest-version");
const textTable = require("text-table");

let spinner;
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
 * Take an object of dependencies and return an object with name, current version and last version of this package.
 * @param {Object} dependencies
 */
function returnVersion(dependencies) {
	const allias = ["^", "*", ">=", "@", "~"];

	return Object.keys(dependencies).map(async pkg => {
		let actualVersion = dependencies[pkg];

		allias.map(item => {
			if (actualVersion.includes(item)) {
				actualVersion = actualVersion.split(item)[1]; // eslint-disable-line prefer-destructuring
				return true;
			}
			return false;
		});

		return {
			name: pkg,
			actualVersion,
			lastVersion: await latestversion(pkg)
		};
	});
}

/**
 * Take an array of promises, and return an array to be printed.
 * @param {Array} promisesArray
 * @param {String} projectName The name of folder being parsed.
 */
function prepareToPrint(promisesArray, projectName) {
	const dataToPrint = [];

	return Promise.all(promisesArray).then(values => {
		spinner.text = chalk`Start parsing {green ${projectName}/} dependencies from {green ${path.resolve(
			input[0]
		)}/}`;

		dataToPrint.push([chalk`\nDependencies of {green ${projectName}/}`]);

		dataToPrint.push([
			chalk`{underline Dependencies}`,
			chalk`{underline Version}`,
			chalk`{underline Latest-Version}`
		]);

		values.forEach(packageInfo => {
			if (packageInfo.actualVersion === packageInfo.lastVersion) {
				dataToPrint.push([
					chalk`{green ${packageInfo.name}}`,
					chalk`{green ${packageInfo.actualVersion}}`,
					chalk`{green ${packageInfo.lastVersion}}`
				]);
				return true;
			}

			dataToPrint.push([
				chalk`{red ${packageInfo.name}}`,
				chalk`{red ${packageInfo.actualVersion}}`,
				chalk`{green ${packageInfo.lastVersion}}`
			]);
			return true;
		});

		return dataToPrint;
	});
}

/**
 * Check if `pkg` has some dependencies, return and array of data to be printed.
 * @param {Object} pkg package.json file.
 * @param {String} project The project name
 */
async function checkDependencies(pkg, project) {
	// Has 0 dependencies.
	if (!pkg.dependencies && !pkg.devDependencies) {
		spinner.text = chalk`{green ${project}/} project doesn't have any Node dependencies you should add one..  😢 \n`;
		return false;
	}

	// Has dependencies but 0 devDependencies
	if (pkg.dependencies && !pkg.devDependencies) {
		return prepareToPrint([...returnVersion(pkg.dependencies)], project);
	}

	// Has devDependencies but 0 dependencies
	if (!pkg.dependencies && pkg.devDependencies) {
		return prepareToPrint([...returnVersion(pkg.devDependencies)], project);
	}

	// Has dev and dependencies
	if (pkg.dependencies && pkg.devDependencies) {
		return prepareToPrint(
			[...returnVersion(pkg.dependencies), ...returnVersion(pkg.devDependencies)],
			project
		);
	}

	return true;
}

/**
 * Run the process.
 * @param {String} pathEnter The path enter by user.
 */
async function run(pathEnter) {
	const directoryEnter = path.resolve(pathEnter);
	const fsPromises = fs.promises;
	let print = null;
	let singleFolder = null;

	spinner = ora(
		`Start evaluating your dependencies from ${chalk.green(directoryEnter)} 📦 📦\n`
	).start();

	try {
		await fsPromises.access(directoryEnter);
		const directory = await fsPromises.readdir(directoryEnter);

		// If path enter is already a node project no need to loop just check and return.
		if (directory.includes("package.json")) {
			singleFolder = true;
			print = await checkDependencies(
				require(path.join(directoryEnter, "package.json")),
				path.basename(directoryEnter)
			);
		} else {
			print = directory.map(async function fnReturnToPrint(item) {
				if (item === "node_modules" || item.startsWith("."))
					return Promise.resolve(false);

				const lStat = await fsPromises.lstat(path.join(directoryEnter, item));

				if (lStat.isDirectory()) {
					const subDirectory = await fsPromises.readdir(path.join(directoryEnter, item));

					if (subDirectory.includes("package.json")) {
						return checkDependencies(
							require(path.join(directoryEnter, item, "package.json")),
							item
						);
					}

					spinner.text = chalk`\n {green ${item}/} is not a NodeJs project..`;
					return Promise.resolve(false);
				}
				return null;
			});
		}

		Promise.all(print).then(function fnPrint(values) {
			values.length === 0
				? spinner.fail(
						`There is nothing to compare here.. Try to add a package.json file`
				  )
				: spinner.succeed("It's done");

			if (singleFolder) {
				return console.log(textTable(values));
			}

			return values.filter(
				arrayDependencies =>
					arrayDependencies !== false && console.log(textTable(arrayDependencies))
			);
		});
	} catch (error) {
		spinner.fail(error.message);
	}
	return true;
}

if (input.length === 0) {
	console.error(`${chalk.red("\n Error, You must enter a folder path \n")}`);
	process.exit();
}

if (input.length > 1) {
	console.error(`${chalk.red("\n Error, you must enter only one argument \n")}`);
	process.exit();
}

run(input[0]);
