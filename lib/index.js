#!/usr/bin/env node
/* eslint-disable no-console */
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const latestversion = require("latest-version");

let spinner;
const { input } = meow(`
	${chalk.green("Usage")}
		$ npx packages-outdated <folder-path>

	${chalk.yellow("Options")}
		--version, Display the actual package version
		--help, Display all commands and options available

	${chalk.blue("Exemples")}
		$ npx packages-outdated ./
		$ npx packages-outdated /
`);

/**
 *
 * @param {Object} package
 */
async function checkVersion (package) {
	console.log(package);
}

/**
 *
 * @param {Object} pkg
 * @param {String} projectName
 */
async function checkDependencies(pkg, projectName) {
	if (pkg.dependencies === undefined && pkg.devDependencies === undefined) {
		return spinner.warn(chalk`{green ${projectName}/} do not have any npm dependencies. \n`);
	}

	if (pkg.dependencies === undefined && pkg.devDependencies) {
		spinner.text = chalk`{green ${projectName}/} don't have {yellow dependencies} but find some {yellow devDependencies}`;
		return await checkVersion([pkg.devDependencies]);
	}
	// console.log(chalk`All your dependencies in {green ${projectName}/} are up to date, congrats ✨ !!`);
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
	const directoryEnter = path.resolve(input[0]);
	const fsPromises = fs.promises;

	spinner = ora({
		text: chalk`Start evaluating your {green dependencies..} 📦 \n`
	}).start();

	fsPromises
		.access(directoryEnter)
		.then(() => {
			fsPromises.readdir(directoryEnter).then(data => {
				// If path enter is already a node project no need to loop just check and return.
				if (data.includes("package.json")) {
					const pathPackageJson = require(path.join(directoryEnter, "package.json"));

					return checkDependencies(pathPackageJson, path.basename(directoryEnter));
				}

				// If path enter is an empty directory.
				if (data.length === 0) {
					spinner.fail();
					throw new Error(`This folder is empty..`);
				}

				// Else loop through all the folders presents.
				data.map(item => {
					if (item === "node_modules" || item.startsWith(".")) return;

					fsPromises.lstat(path.join(directoryEnter, item)).then(stat => {
						if (stat.isDirectory()) {
							fsPromises.readdir(path.join(directoryEnter, item)).then(directories => {
								// Check if folder is a nodejs project.
								if (directories.includes("package.json")) {
									const pathPackageJson = require(path.join(directoryEnter, item, "package.json"));

									return checkDependencies(pathPackageJson, pathPackageJson.name);
								}

								return console.log(chalk`\n{green ${item}/} folder is not a nodejs project`);
							});
						}
					});
				});
			});
		})
		.catch(err => {
			spinner.fail(chalk`{red ${err.message} Please check the path enter.} \n`);
		});
}
