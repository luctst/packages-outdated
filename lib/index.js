#!/usr/bin/env node

/* eslint-disable no-console */
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");
const updateNotifier = require("update-notifier");

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
	console.log(`
	${chalk.red("Error, You must enter a folder path")}
	`);
}

if (input.length > 1) {
	console.log(`
	${chalk.red("Error, you must enter only one argument")}
	`);
}

if (input.length > 0) {
	const directoryEnter = path.resolve(input[0]);
	const fsPromises = fs.promises;

	fsPromises
		.access(directoryEnter)
		.then(() => {
			fsPromises.readdir(directoryEnter).then(data => {
				// If path enter is already a node project no need to loop just check and return.
				if (data.includes("package.json")) {
					const pkg = require(path.join(directoryEnter, "package.json"));
					checkDependencies(pkg);
					process.exit();
				}

				data.map(item => {
					if (item === "node_modules" || item.startsWith(".")) return;

					fsPromises.lstat(path.join(directoryEnter, item)).then(stat => {
						if (stat.isDirectory()) {
							fsPromises.readdir(path.join(directoryEnter, item)).then(directories => {
								if (directories.includes("package.json")) {
									// Call checkDependcies function.
									return console.log(`${item} is a nodejs project.`);
								}

								return console.log(`${item} is not a nodejs project`);
							});
						}
					});
				});
			});
		})
		.catch(err => {
			return console.log(`
			${chalk.red(`${err.message} Please check the path enter.`)}
			`);
		});
}

/**
 *
 * @param {*} packageJson
 */
function checkDependencies(pkg) {
	const notifier = updateNotifier({pkg});
	notifier.notify();
	console.log(notifier.update);
}
