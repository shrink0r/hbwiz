# hbwiz - Honeybee Module Wizard

Provides a canvas based UI for creating honeybee module schemes, in an uml class diagram style.

## Requirements

In order to setup hbwiz you need [nodejs](http://nodejs.org/) and [npm](https://www.npmjs.org/) to be installed.

## Project setup

Clone the repository:

```
git clone git@github.com:shrink0r/hbwiz.git
```

Install node dependencies:

```
npm install
```

Install web dependencies:

```
node_modules/.bin/bower install
```


## Grunt tasks

At the moment there is only one grunt target available. More tasks for distribution, testing and etc. are up the road.

Run jshint on the project's js src:

```
node_modules/.bin/grunt jshint
```
