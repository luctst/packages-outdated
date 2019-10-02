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
 * Check if `package` has some dependencies, check if they are up to date.
 * @param {Object} package
 * @param {String} project
 */
function checkVersion (pkg, project) {
	if (!pkg.dependencies && !pkg.devDependencies) {
		//TODO: Add an emoji sad in the warn() method.
		spinner.warn(chalk`{green ${project}/} project doesn't have any Node dependencies you should add one.. `);
		return;
	}

	spinner.text = chalk`Start parsing {green ${project}} dependencies.`
	return;
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
			return checkVersion(
				require(path.join(directoryEnter, "package.json")),
				path.basename(directoryEnter)
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
					return;
				}

				console.log(chalk`\n {green ${item}/} is not a NodeJs project..`);
				return;
			}
		});
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
