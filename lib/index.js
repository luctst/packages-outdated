#!/usr/bin/env node
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");

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

	fs.access(directoryEnter, err => {
		if (err) {
			console.log(`
			${chalk.red(`${err.message} Please check the path enter.`)}
			`);
			return process.exit(9);
		}

		return fs.readdir(directoryEnter, (err, data) => {
			if (err) throw err.message;

			// If path enter is already a node project no need to loop just check and return.
			if (data.includes("package.json")) {
				const { dependencies, devDependencies } = require(path.join(
					directoryEnter,
					"package.json"
				));

				return process.exit();
			}

			// Else loop through the path enter to find node project.
			data.map(item => {
				if (item === "node_modules" || item.startsWith(".")) return;

				fs.lstat(path.join(directoryEnter, item), (err, stat) => {
					if (err) throw err.message;

					if (stat.isDirectory()) {
						fs.readdir(path.join(directoryEnter, item), (err, data) => {
							if (err) throw err.message;

							if (data.includes("package.json")) {
								return;
							}

							return console.log(`${item} is not a nodeJs project`);
						});
					}
				});
			});
		});
	});
}
