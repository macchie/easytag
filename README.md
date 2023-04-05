# easytag

![GitHub package.json version](https://img.shields.io/github/package-json/v/macchie/easytag?style=for-the-badge) ![npm (scoped)](https://img.shields.io/npm/v/@macchie7/easytag?style=for-the-badge) ![npm](https://img.shields.io/npm/dw/@macchie7/easytag?style=for-the-badge)

Easy NPM Versioning & Tag Tool

### Setup

Inside your NPM project execute:

```bash
$ npx @macchie7/easytag --init
```

`easytag` replaces your `preversion` script inside `package.json` to be able to intercept all `npm version *` commands.

### Usage

`easytag` runs automatically intercepting the classic `npm version *` commands, here are some examples of the default rules for tag naming:

##### Master/Main Branch

- `master` => `vX.Y.Z`
- `main` => `vX.Y.Z`

##### Other Branches

- `feauture/example` => `feauture-example-vX.Y.Z`
- `test` => `test-vX.Y.Z`

### Known Issues

Currently the only way to prevent `npm version` default behaviour is to throw an Error at the end of the procedure, if you see an error with code `200` in your log everything is ok.