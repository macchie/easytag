#!/usr/bin/env node

const fs = require('fs');
const execSync = require('child_process').execSync;
const semver = require('semver');
const chalk = require('chalk');

class EasyTAG {

  static _noPush = false;
  static _actions = ['patch', 'minor', 'major'];
  static _formats = {
    '_master': `{{version}}`,
    '_branch': `{{branchName}}-{{version}}`,
  }

  static _gitClean;
  static _pgkJson;
  static _versions = { current: null, next: null }
  static _tags = { current: null, next: null }
  static _action;
  static _branchName;

  // sanitize branch name
  static sanitizeBranchName(_branchName) {
    return _branchName
      .replace('/', '-')
      .replace(' ', '-')
      .replace('_', '-')
      .replace('\\', '-');
  }

  // get tag name based on format
  static getTag(_version) {
    const _isMaster = ['master', 'main'].includes(EasyTAG._branchName);
    const _tagFormat = _isMaster ? EasyTAG._formats._master : EasyTAG._formats._branch;

    return _tagFormat
      .replace('{{branchName}}', EasyTAG._branchName)
      .replace('{{version}}', `v${_version}`);
  }

  // init 
  static init() {
    try {
      const _pgkJson = JSON.parse(fs.readFileSync('package.json'));
      if (!_pgkJson.scripts) {
        _pgkJson.scripts = {};
      }
      _pgkJson.scripts.preversion = 'npx easytag --disabled-alert';
      _pgkJson.scripts.version = 'npx easytag --disabled-alert';
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
    // check if git is clean
    try {
      EasyTAG._gitClean = execSync('git status --porcelain').toString().trim().length === 0;
      if (!EasyTAG._gitClean) throw new Error();
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Current GIT working directory is not clean.`);
      process.exit(1);
    }

    // load package.json
    try {
      EasyTAG._pgkJson = JSON.parse(fs.readFileSync('package.json'));
      EasyTAG._versions.current = semver.parse(EasyTAG._pgkJson.version).version;
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} ${error.message}`);
      console.log(`${chalk.red('ERROR:')} Failed to read package.json.`);
      process.exit(1);
    }

    // load custom config
    try {
      if (EasyTAG._pgkJson.config?.easytag) {
        if (EasyTAG._pgkJson.config.easytag.noPush) {
          EasyTAG._noPush = EasyTAG._pgkJson.config.easytag.noPush;
        }
        if (EasyTAG._pgkJson.config.easytag.masterFormat) {
          EasyTAG._formats._master = EasyTAG._pgkJson.config.easytag.masterFormat;
        }
        if (EasyTAG._pgkJson.config.easytag.branchFormat) {
          EasyTAG._formats._branch = EasyTAG._pgkJson.config.easytag.branchFormat;
        }
      } 
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} ${error.message}`);
      console.log(`${chalk.red('ERROR:')} Failed to load EasyTAG custom formats.`);
      process.exit(1);
    }
    
    // load action and new version
    try {
      EasyTAG._action = process.argv[2];
      
      if (!EasyTAG._actions.includes(EasyTAG._action)) {
        throw new Error(EasyTAG._action ? `Invalid action: ${EasyTAG._action}` : `No Action Provided!`);
      }
      
      EasyTAG._versions.next = semver.inc(EasyTAG._pgkJson.version, EasyTAG._action);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} ${error.message}`)
      console.log(`${chalk.red('ERROR:')} Failed to prepare EasyTAG Action.`);
      process.exit(1);
    }
    
    // load branch name and tags
    try {
      EasyTAG._branchName = execSync(`git rev-parse --abbrev-ref HEAD | sed 's/[^a-zA-Z0-9]/-/g'`).toString().trim();
      EasyTAG._tags.current = EasyTAG.getTag(EasyTAG._versions.current);
      EasyTAG._tags.next = EasyTAG.getTag(EasyTAG._versions.next);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} ${error.message}`);
      console.log(`${chalk.red('ERROR:')} Failed to get current GIT branch name.`);
      process.exit(1);
    }
  }

  // execute
  static execute() {
    switch (process.argv[2]) {
      case '--init':
        EasyTAG.init();
        process.exit(0);
      case '--disabled-alert':
        console.log(`${chalk.yellow('WARNING:')} NPM Version commands disabled by EasyTAG!`);
        console.log(`${chalk.yellow('WARNING:')} Use 'npx easytag [major|minor|patch]' instead.\n`);
        process.exit(2);
    }

    EasyTAG.prepare();

    // console.log(`${chalk.cyan('INFO:')}   noPush: ${EasyTAG._config.noPush ? chalk.yellow('true') : chalk.green('false')}`);
    // console.log(`${chalk.cyan('INFO:')}   masterFormat: ${chalk.yellow(EasyTAG._formats._master)}`);
    // console.log(`${chalk.cyan('INFO:')}   branchFormat: ${chalk.yellow(EasyTAG._formats._branch)}`);
    console.log(`${chalk.cyan('INFO:')} Releasing '${EasyTAG._action}' version '${chalk.yellow(EasyTAG._versions.next)}'...`);
    
    try {
      // update package.json
      EasyTAG._pgkJson.version = EasyTAG._versions.next;
      fs.writeFileSync('package.json', JSON.stringify(EasyTAG._pgkJson, null, 2));
      console.log(`${chalk.green('SUCCESS:')} Updated package.json to version '${chalk.yellow(EasyTAG._versions.next)}'.`);
      
      // commit and tag
      execSync(`git add package*.json`);
      execSync(`git commit -m "${EasyTAG._tags.next}"`);
      execSync(`git tag ${EasyTAG._tags.next}`);
      console.log(`${chalk.green('SUCCESS:')} Committed and tagged version '${chalk.yellow(EasyTAG._tags.next)}'.`);
    } catch (error) {
      console.log(`${chalk.red('ERROR:')} Failed to create '${EasyTAG._action}' version '${chalk.yellow(EasyTAG._tags.next)}'!`)
      console.log(`\n${chalk.yellow(error.message)}\n`)
      process.exit(2);
    }

    if (!EasyTAG._noPush) {
      try {
        // push
        execSync(`git push && git push --tags`, {stdio: []});
        console.log(`${chalk.green('SUCCESS:')} Pushed '${EasyTAG._action}' version '${chalk.yellow(EasyTAG._tags.next)}'.`);
      } catch (error) {
        console.log(`${chalk.red('ERROR:')} Failed to Push '${EasyTAG._action}' version '${chalk.yellow(EasyTAG._tags.next)}'!`)
        console.log(`\n${chalk.yellow(error.message)}\n`)
        process.exit(2);
      }
    }

    process.exit(0);
  }
}

try {
  EasyTAG.execute();
} catch (error) {
  process.exit(203);  
}
