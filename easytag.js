#!/usr/bin/env node

const fs = require('fs');
const execSync = require('child_process').execSync;
const semver = require('semver');
const chalk = require('chalk');

class EasyVER {

  static _formats = {
    '_master': `{{version}}`,
    '_branch': `{{branchName}}-{{version}}`,
  }
  static _pgkJson;
  static _gitClean;
  static _branchName;
  static _oldVersion;
  static _newVersion;
  static _action;

  // init 
  static init() {
    try {
      const _pgkJson = JSON.parse(fs.readFileSync('package.json'));
      if (!_pgkJson.scripts) {
        _pgkJson.scripts = {};
      }
      _pgkJson.scripts.preversion = 'npx easyver';
      fs.writeFileSync('package.json', JSON.stringify(_pgkJson, null, 2));
      console.log(`${chalk.green('SUCCESS:')} EasyVER initialized successfully.`);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to initialize EasyVER.`);
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(1);
    }
  }

  // prepare 
  static prepare() {
    try {
      EasyVER._pgkJson = JSON.parse(fs.readFileSync('package.json'));
      EasyVER._gitClean = execSync('git status --porcelain').toString().trim().length === 0;
      EasyVER._branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      EasyVER._oldVersion = process.env.npm_old_version;
      EasyVER._newVersion = process.env.npm_new_version;
      EasyVER._action = semver.diff(EasyVER._newVersion, EasyVER._oldVersion);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to prepare EasyVER.`);
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(1);
    }
  }

  // get tag name based on format
  static getTag(_version) {
    const _isMaster = ['master', 'main'].includes(EasyVER._branchName);
    const _tagFormat = _isMaster ? EasyVER._formats._master : EasyVER._formats._branch;

    return _tagFormat
      .replace('{{branchName}}', EasyVER._branchName)
      .replace('{{version}}', `v${_version}`);
  }

  // sanitize branch name
  static sanitizeBranchName(_branchName) {
    return _branchName
      .replace('/', '-')
      .replace(' ', '-')
      .replace('_', '-')
      .replace('\\', '-');
  }

  // verify if all conditions are met
  static verify() {
    if (!EasyVER._gitClean) {
      console.log(`${chalk.red('ERROR:')} Current GIT working directory is not clean.`);
      process.exit(1);
    }

    EasyVER._branchName = EasyVER.sanitizeBranchName(EasyVER._branchName);

    if (!EasyVER._branchName || EasyVER._branchName.indexOf('/') > -1) {
      console.log(`${chalk.red('ERROR:')} Branch Name not found or invalid.`);
      process.exit(1);
    }

    if (!['patch', 'minor', 'major'].includes(EasyVER._action)) {
      console.log(`${chalk.red('ERROR:')} Invalid Action '${EasyVER._action}'.`);
      process.exit(1);
    }
  }

  // execute
  static execute() {
    if (process.argv[2] === '--init') {
      EasyVER.init();
      process.exit(0);
    }

    EasyVER.prepare() && EasyVER.verify();

    console.log(`${chalk.cyan('INFO:')} Current version is '${chalk.yellow(EasyVER.getTag(EasyVER._oldVersion))}'...`);
    console.log(`${chalk.cyan('INFO:')} Releasing '${EasyVER._action}' version '${chalk.yellow(EasyVER.getTag(EasyVER._newVersion))}'...`);
    
    try {
      // update package.json
      EasyVER._pgkJson.version = EasyVER._newVersion;
      fs.writeFileSync('package.json', JSON.stringify(EasyVER._pgkJson, null, 2));

      // commit and tag
      execSync(`git add package*.json`);
      execSync(`git commit -m "${EasyVER.getTag(EasyVER._newVersion)}"`);
      execSync(`git tag ${EasyVER.getTag(EasyVER._newVersion)}`);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to create '${EasyVER._action}' version '${chalk.yellow(EasyVER.getTag(EasyVER._newVersion))}'!`)
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(201);
    }

    console.log(`${chalk.green('SUCCESS:')} Created Tag for '${EasyVER._action}' version '${chalk.yellow(EasyVER.getTag(EasyVER._newVersion))}'.`);

    try {
      // push
      execSync(`git push && git push --tags`, {stdio: []});
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to Push '${EasyVER._action}' version '${chalk.yellow(EasyVER.getTag(EasyVER._newVersion))}'!`)
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(202);
    }

    console.log(`${chalk.green('SUCCESS:')} Released '${EasyVER._action}' version '${chalk.yellow(EasyVER.getTag(EasyVER._newVersion))}'!`);
    console.log(`${chalk.green('SUCCESS: Ignore the following error messages! ;)')}\n`);

    process.exit(200);
  }
}

try {
  EasyVER.execute();
} catch (error) {
  process.exit(203);  
}
