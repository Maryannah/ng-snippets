# NG Snippets

**NG Snippets** is a collection of single-file, Angular 18+ snippets that you can copy & paste into your own project.

## Why snippets, and not a library ?

- You copy-paste only what you need/like
- You can add/remove features you don't like easily
- You can customize the style of the features easily
- You don't need to be up-to-date on the latest features of the library
- In a single glance at the feature, you can understand all of its behavior
- The snippets must be kept simple to understand to avoid clutter
- Since all features are single-filed, you don't have complex dependencies between them

## How to use

- Find a snippet you like/want in the [list of snippets](#list-of-features)
- Click on the corresonding link
- Copy & paste the files you need for the feature to work
  - The corresponding `.ts` file
  - Sometimes, the `.scss` file (if needed, it will have the same name as the `.ts` one)
- Enjoy the snippet in your own project

## Disclaimer

The snippets available in this repository are **not made to be perfect !**

- They don't implement a11y, i18n, or other a24z concept
- They don't offer ultra advanced features
- They don't offer the latest trending designs

They are merely scaffholding bases for you to use and evolve.  
They are made to work without additional development, but for the best results, you should take a minimal amount of time to customize them to your needs.

## About the styles ...

For your convenience, but also for basic structure/behavior, some features have SCSS files alongside them.  
You can copy & paste them like you would do for the feature, and edit them to your needs.  
Simply keep in mind that if you see an `// IMPORTANT` comment, you should take the time to read it !

You can copy/paste their content into your `styles.scss` like a savage, but know that you can also import them with the `@use` rule :

```scss
// Top of styles.scss
@use 'path/to/style/file/of/feature/featname';
// example if you have a structure with `src/styles/_overlays.scss` :
@use './styles/overlays';
```

You don't need to worry about the extension, the `_` prefix, or the style duplication when doing so.  
_([More information here](https://sass-lang.com/guide/#partials))_

Finally, all classes are grossly scoped with prefixes (`.__snippet-class`) to avoid conflicts with libraries such as Tailwind. I would suggest to keep some sort of scoping, but again, it's up to you !  
_<sup>(Hint : Search & replace `.__` with what you want)</sup>_

## About the features ...

Each feature gets JS-documented and gets advanced typings to help you use them.  
That means you can use & abuse intellisense/autocomplete features to discover how they work.  
_<sup>(Hint : Ctrl + Spacebar)</sup>_

_(You can remove the comments if you think they're too much, the autocomplete will still work)_

You also get a `README.md` file for every feature, which gives basic instructions, tips & tricks about the corresponding feature.  
You are not forced to read it, but I will try to keep them very concise so that you can go through them in a couple of seconds !

## Available features

- [Routing helpers](./src/app/snippets/routing)
- [Overlays](./src/app/snippets/overlays) (notifications, dialogs, ...)
- [Forms](./src/app/snippets/forms)
  - [Datepicker](./src/app/snippets/forms/datepicker)
