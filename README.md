# easytag
####

![GitHub package.json version](https://img.shields.io/github/package-json/v/macchie/easytag?style=for-the-badge) ![npm (scoped)](https://img.shields.io/npm/v/@macchie7/easytag?style=for-the-badge) ![npm](https://img.shields.io/npm/dw/@macchie7/easytag?style=for-the-badge)


`easytag` simplifies Versioning & Tagging when you need to deliver multiple versioning depending on your GIT branch.

While using `easytag` tagging through `npx easytag [patch|minor|major]` commands will trigger a custom procedures that will sequentially perform:

- update of your `package.json` version depending on the release type (`patch`, `minor`, `major`)
- add `package.json` to GIT changes, tag & create commit with tag name in the message (see below for default naming convention)
- `push` both your changes and your tags (`git push && git push --tags`)

### Default Naming Convention
##### Master/Main Branch

- `master` => `vX.Y.Z`
- `main` => `vX.Y.Z`

##### Other Branches

- `feauture/example` => `feauture-example-vX.Y.Z`
- `test` => `test-vX.Y.Z`
- `mybranch` => `mybranch-vX.Y.Z`

### Setup

Inside your NPM project execute:

```bash
$ npx @macchie7/easytag --init
```

`easytag` replaces your `preversion` and `preversion` script inside `package.json` to be able to intercept and disable them.

### Usage

`easytag` relicates `npm version *` commands:

- `npx easytag [ patch | minor | major ]`

### Parameters

Edit your `config` inside `package.json` to add extra parameters:

##### Example

```json
{
  "config": {
    "easytag": {
      // disable push after tagging
      "noPush": true, 
      // master/main branch format (default: v1.2.3)
      "masterFormat": "{{version}}", 
      // others branch format (default: branchname-v1.2.3)
      "branchFormat": "{{branchName}}-{{version}}"
    }
    ...
  }
  ...
}
```
