# @signavio/i18n

[![CircleCI][build-badge]][build]
[![npm package][npm-badge]][npm]

Minimalist gettext style i18n for JavaScript

## Features

- [Supports React components as interpolations](#interpolations)
- [Pluralization support](#pluralization) (ngettext style)
- [markdown support](#markdown)
- Compatible with [webpack po-loader](https://github.com/perchlayer/po-loader)
- Comes with scripts for extracting translation strings from JavaScript (Babel) sources and updating .pot and .po files

## Installation

```shell
yarn add @signavio/i18n
```

## Setup

Add a section like the following to your `packages.json`:

```json
{
  "scripts": {
    "i18n-init": "cd src/locales && msginit --no-translator --input messages.pot --locale",
    "i18n": "i18n-extract \"src/**/*.js\" src/locales/messages.pot && i18n-merge src/locales/messages.pot src/locales/*.po"
  }
}
```

Create the file `.i18nrc` and add a configuration object for gettext message extraction:

```json
{
  "headers": "<POT_HEADERS>",
  "fileName": "<PATH_TO_POT>",
  "baseDirectory": "<PATH_TO_BASEDIR>"
}
```

More available options are documented here: https://github.com/getsentry/babel-gettext-extractor

Optionally, you can also define your babel configuration in the `.i18nrc` file.
This allows you to ignore your project's `.babelrc` file when extracting
messages, which is helpful if your project is using a legacy version of babel
(\<6).

```javascript
{
  "fileName": "<PATH_TO_POT>",
  "babel": {
    "babelrc": false,
    // other babel settings
  }
}
```

## Usage

Add the translations to the PO files, and initialize the i18n module in your application using the `init` function:

```javascript
import i18n, { init, setLocale } from '@signavio/i18n'

function getLangLoader(locale) {
  // Lazy load the translation bundles
  return require(`bundle?lazy!json!po!./locales/${locale}.po`)
}

const config = {
  // the default locale to use if the browser preference locale is not available
  default: 'en_US',
  // optional mapping of locales
  map: {
    en: 'en_US',
    de: 'de_DE',
  },
  // optional regular expression pattern for custom interpolation syntax
  interpolationPattern: '__(\\w+)__', // this is the default value
}

init(getLangLoader, config).then(() => {
  // promise will be resolved when the translation bundle for the active locale has been loaded
  alert(i18n('Hello world!'))
  // >> Hello world!

  // switch to another language
  setLocale('de').then(() => {
    alert(i18n('Hello world!'))
    // >> Hallo Welt!
  })
})
```

### Interpolations

Interpolations make it easier to include variable content into messages without confusing translators.
For instance, if you want to include a computed number in a message, you can do it like this:

```javascript
const available = 100
const count = available / 10

i18n('Showing __count__ of __available__ entires.', { count, available })
```

For your convenience interpolations also support React elements.
So you can do things like:

```jsx
i18n('Contact __supportLink__', {
  supportLink: <a href="mailto:support@signavio.com">Support</a>,
})
```

The default syntax for interpolations is a group of characters or numbers (`\w+`) wrapped in double underscores (`__`). If you require a different syntax this can be customized using the init option `interpolationPattern`. Internally, pattern value will be used to create a regular expression for matching interpolation placeholder like this:

```
new RegExp(interpolationPattern, 'g')
```

It must contain a capturing group (`(\w+)`) for capturing the interpolation key.

### Pluralization

Often times you get to the situation that the same message needs to look slightly different depending on whether you talk about one or more things.
Handling this can add quite a lot of unnecessary code.
You can circumvent this with the built in support for pluralizations.

```javascript
i18n('Showing __count__ item', 'Showing __count__ items', { count })
```

To use this feature simply pass two different translations to the `i18n` function.
The first string is used for the singular case and the second one for the plural case.
Note that you **have** to hand in a variable called count.
This variable is used to decide which version of the translation to choose.

### Message context

Sometimes the same translation key can have different meanings based on the context in which is it used.
Message context offers a solution to this problem.
If you specify the optional `context` parameter you can have different translations for the same translation key.

```javascript
i18n('Ok', { context: 'button' })
```

### Markdown

Another convenience of `@signavio/i18n` is the optional support for markdown in translations.
By default this is turned off, but you can activate it by setting the `markdown` option to `true`.

```javascript
i18n('I want _this_ to be **bold**', {
  markdown: true,
})
```

[build-badge]: https://circleci.com/gh/signavio/i18n/tree/master.svg?style=shield&circle-token=:circle-token
[build]: https://circleci.com/gh/signavio/i18n/tree/master
[npm-badge]: https://img.shields.io/npm/v/@signavio/i18n.png?style=flat-square
[npm]: https://www.npmjs.org/package/@signavio/i18n
