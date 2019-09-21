#!/usr/bin/env node
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const updateNotifier = require("update-notifier");

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

if (input.length === 0) {
	return console.error(`${chalk.red("\n Error, You must enter a folder path \n")}`);
}

if (input.length > 1) {
	return console.error(`${chalk.red("\n Error, you must enter only one argument \n")}`);
}

if (input.length > 0) {
	const directoryEnter = path.resolve(input[0]);
	const fsPromises = fs.promises;

	spinner = ora({
		text: chalk`Start evaluating your {green packages..} 📦 \n`
	}).start();

	fsPromises
		.access(directoryEnter)
		.then(() => {
			fsPromises.readdir(directoryEnter).then(data => {
				// If path enter is already a node project no need to loop just check and return.
				if (data.includes("package.json")) {
					const pathPackageJson = require(path.join(directoryEnter, "package.json"));

					checkDependencies(pathPackageJson, pathPackageJson.name);
					process.exit(0);
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

/**
 *
 * @param {Object} pkg
 * @param {String} projectName
 */
function checkDependencies(pkg, projectName) {
	const notifier = updateNotifier({ pkg });

	console.log(notifier.update);
	if (notifier.update === undefined) {
		return spinner.succeed(chalk`All your dependencies in {green ${projectName}/} are up to date, congrats ✨ !!`);
	}

	return console.log(chalk`

	`);
}
