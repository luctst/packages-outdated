#!/usr/bin/env node
const chalk = require("chalk");
const meow = require("meow");
const fs = require("fs");
const path = require("path");

const {input} = meow(`
	${chalk.green("Usage")}
		$ npx packages-outdated <folder-path>

	${chalk.yellow("Options")}
		--version, Display the actual package version
		--help, Display all commands and options available

	${chalk.blue("Exemples")}
		$ npx packages-outdated
`);

if (input.length === 0) {
	return console.log(`
	${chalk.red("Error, You must enter a folder path")}
	`)
}

if (input.length > 1) {
	return console.log(`
	${chalk.red("Error, you must enter only one argument")}
	`);
}

if (input.length > 0) {
	console.log(path.resolve(input[0]));
	fs.access("./../lib", (err) => {
		if (err) {
			console.log(`
			${chalk.red(err.message+" Please check the path enter.")}
			`);
			return process.exit(9);
		};


	});
}
