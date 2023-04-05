#!/usr/bin/env node

const fs = require('fs');
const execSync = require('child_process').execSync;
const semver = require('semver');
const chalk = require('chalk');

class EasyTAG {

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
      _pgkJson.scripts.preversion = 'npx easytag';
      fs.writeFileSync('package.json', JSON.stringify(_pgkJson, null, 2));
      console.log(`${chalk.green('SUCCESS:')} EasyTAG initialized successfully.`);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to initialize EasyTAG.`);
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(1);
    }
  }

  // prepare 
  static prepare() {
    try {
      EasyTAG._pgkJson = JSON.parse(fs.readFileSync('package.json'));
      EasyTAG._gitClean = execSync('git status --porcelain').toString().trim().length === 0;
      EasyTAG._branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      EasyTAG._oldVersion = process.env.npm_old_version;
      EasyTAG._newVersion = process.env.npm_new_version;
      EasyTAG._action = semver.diff(EasyTAG._newVersion, EasyTAG._oldVersion);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to prepare EasyTAG.`);
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(1);
    }
  }

  // get tag name based on format
  static getTag(_version) {
    const _isMaster = ['master', 'main'].includes(EasyTAG._branchName);
    const _tagFormat = _isMaster ? EasyTAG._formats._master : EasyTAG._formats._branch;

    return _tagFormat
      .replace('{{branchName}}', EasyTAG._branchName)
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
    if (!EasyTAG._gitClean) {
      console.log(`${chalk.red('ERROR:')} Current GIT working directory is not clean.`);
      process.exit(1);
    }

    EasyTAG._branchName = EasyTAG.sanitizeBranchName(EasyTAG._branchName);

    if (!EasyTAG._branchName || EasyTAG._branchName.indexOf('/') > -1) {
      console.log(`${chalk.red('ERROR:')} Branch Name not found or invalid.`);
      process.exit(1);
    }

    if (!['patch', 'minor', 'major'].includes(EasyTAG._action)) {
      console.log(`${chalk.red('ERROR:')} Invalid Action '${EasyTAG._action}'.`);
      process.exit(1);
    }
  }

  // execute
  static execute() {
    if (process.argv[2] === '--init') {
      EasyTAG.init();
      process.exit(0);
    }

    EasyTAG.prepare() && EasyTAG.verify();

    console.log(`${chalk.cyan('INFO:')} Current version is '${chalk.yellow(EasyTAG.getTag(EasyTAG._oldVersion))}'...`);
    console.log(`${chalk.cyan('INFO:')} Releasing '${EasyTAG._action}' version '${chalk.yellow(EasyTAG.getTag(EasyTAG._newVersion))}'...`);
    
    try {
      // update package.json
      EasyTAG._pgkJson.version = EasyTAG._newVersion;
      fs.writeFileSync('package.json', JSON.stringify(EasyTAG._pgkJson, null, 2));

      // commit and tag
      execSync(`git add package*.json`);
      execSync(`git commit -m "${EasyTAG.getTag(EasyTAG._newVersion)}"`);
      execSync(`git tag ${EasyTAG.getTag(EasyTAG._newVersion)}`);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to create '${EasyTAG._action}' version '${chalk.yellow(EasyTAG.getTag(EasyTAG._newVersion))}'!`)
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(201);
    }

    console.log(`${chalk.green('SUCCESS:')} Created Tag for '${EasyTAG._action}' version '${chalk.yellow(EasyTAG.getTag(EasyTAG._newVersion))}'.`);

    try {
      // push
      execSync(`git push && git push --tags`, {stdio: []});
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to Push '${EasyTAG._action}' version '${chalk.yellow(EasyTAG.getTag(EasyTAG._newVersion))}'!`)
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(202);
    }

    console.log(`${chalk.green('SUCCESS:')} Released '${EasyTAG._action}' version '${chalk.yellow(EasyTAG.getTag(EasyTAG._newVersion))}'!`);
    console.log(`${chalk.green('SUCCESS: Ignore the following error messages! ;)')}\n`);

    process.exit(200);
  }
}

try {
  EasyTAG.execute();
} catch (error) {
  process.exit(203);  
}
