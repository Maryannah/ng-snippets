# NG Snippets

**NG Snippets** is a collection of single-file, Angular 18+ snippets that you can copy & paste into your own project.

## Why snippets, and not a library ?

- You copy-paste only what you need/like
- You can add/remove features you don't like easily
- You can customize the style of the features easily
- You don't need to be up-to-date on the latest features of the library
- In a single glance at the feature, you can understand all of its behavior
- Since all features are single-filed, you don't have complex dependencies between them

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

## List of features

- [Routing helpers](./src/app/snippets/routing)
- [Overlays service](./src/app/snippets/overlays)
  - Notifications
