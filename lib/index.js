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
const print = [
	[chalk`{underline Dependencies}`, chalk`{underline Version}`, chalk`{underline Latest-Version}`]
];
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
 *
 * @param {Array} package
 */
function checkVersion (package) {
	package.forEach(obj => {
		Object.keys(obj).forEach(async package => {
			const lastVersion = await latestversion(package);

			print.push([
				chalk`${package}`,
				`${obj[package]}`,
				`${lastVersion}`
			]);
		});
	});
}

/**
 * Check if `projectName` has some dependencies.
 * @param {Object} pkg Object who represent a `package.json` file.
 * @param {String} projectName The name of the project.
 */
async function checkDependencies(pkg, projectName) {
	if (pkg.dependencies === undefined && pkg.devDependencies === undefined) {
		return spinner.warn(chalk`{green ${projectName}/} do not have any npm dependencies. \n`);
	}

	if (pkg.dependencies === undefined && pkg.devDependencies) {
		spinner.text = chalk`{green ${projectName}/} don't have {yellow dependencies} but find some {yellow devDependencies}`;

		return await checkVersion([pkg.devDependencies]);
	}

	if (pkg.dependencies && pkg.devDependencies) {
		spinner.text = chalk`Start parsing {green ${projectName}}`;

		return await checkVersion([pkg.dependencies, pkg.devDependencies]);
	}
}

/**
 * Take an array of arrays to print with a good format.
 * @param {Array} arrayToPrint Array to print into the console
 */
function printToConsole (arrayToPrint) {
	const toPrint = textTable(arrayToPrint, {
		align: ["l", "l", "l"]
	});

	console.log(toPrint);
}

/**
 * Run the process.
 * @param {String} pathEnter The path enter by user.
 */
async function run(pathEnter) {
	const directoryEnter = path.resolve(pathEnter);
	const fsPromises = fs.promises;

	spinner = ora(`Start evaluating your dependencies from ${chalk.green(directoryEnter)} 📦 📦\n`).start();

	try {
		await fsPromises.access(directoryEnter);
		const directory = await fsPromises.readdir(directoryEnter);

		// If path enter is already a node project no need to loop just check and return.
		if (directory.includes("package.json")) {
			checkDependencies(
				require(path.join(directoryEnter, "package.json")),
				path.basename(directoryEnter)
			);

			spinner.succeed(chalk`{green ${directoryEnter}/} has been parsed.`);
			return printToConsole(print);
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
					return checkDependencies(
						require(path.join(directoryEnter, item, "package.json")),
						item
					);
				}

				console.log(chalk`\n {green ${item}/} is not a NodeJs project..`);
				return;
			}
		});

		spinner.succeed(chalk`It's done !!, {green ${directoryEnter}} has been parsed.`);
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
	return;
}
