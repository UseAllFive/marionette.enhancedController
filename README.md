# marionette.enhancedController

Brought to you by [Use All Five, Inc.](http://www.useallfive.com)

```
Author: Justin Anastos <janastos@useallfive.com>
Author URI: [http://www.useallfive.com](http://www.useallfive.com)
Repository: https://github.com/UseAllFive/marionette.enhancedController
```

Extend `Marionette.Controller` in place to allow for region management and
debugging.

Many thanks to [Brian Mann](https://github.com/brian-mann)'s [Backbone Rails: Loading
Views](http://www.backbonerails.com/screencasts/loading-views) for the logic
and the base code used to create this module.

## Installation

- Install [spin.js](https://github.com/fgnass/spin.js)
- Include `lib/marionette.enhancedController.js` before any
  `Marionette.Controllers` are used

  The original `Marionette.Controller` will be modified and
  `Marionette.Controller` will be set to the modified version. This will
  work in place as long as you include this file before any
  `Marionette.Controller`s are defined.

- Optional: Include css to render the
loading views. Example:

  ```css
  .loading-container {
      min-height: 200px;
      position: relative;
      width: 100%;
  }

  .loading-container > .spinner {
      left: 50% !important;
      position: absolute !important;
      top: 50% !important;
  }
```

## Usage

### Region Management

Whenever you create a `Marionette.Controller` instance, pass it a `region`
option that specifies the `Marionette.Region` you wish to draw your
controller's view on. In the controller, call `this.show(yourView)` (usually
in the `initialize` function) to display `yourView` in the specified
`region`. When the view is removed, the controller will automatically be
closed.

Note: As of Marionette v2, you cannot show views that have been shown and
removed. Keep this in mind.

```js
var Controller
var controller;

// Define controller
Controller = Marionette.Controller.extend({
  initialize: function() {
    // Instantiate a view
    var view = new Marionette.ItemView({ ... });

    // Show the view
    this.show(view);
  }
});

// Instantiate controller
controller = new Controlller({
  region: yourRegion
});
```

### Loading Views
If you would like to show a loading view while entities load, add the
following option to the `.show` command inside the controller:

```js
this.show(view, {
    loading: true
});
```

*Note*: You **must** have attached the entities `model`s and `collection`s
to the view you want to show and have executed `fetch` on them before
calling `this.show()` or the loading view will not know what to wait for.

#### Custom Entities

The loading view will automatically wait for any models or controllers that
have had `fetch` run on them to load and then will display the original
view. You can manually specify the entities that must load, but they must
all have had `fetch` run on them already:

```js
// Single entity
var model = new Backbone.Model({ ... });
model.fetch();

this.show(view, {
    entities: model,
    loading: true,
    loadingType: 'opacity'
});

// Multiple entities
var model1 = new Backbone.Model({ ... });
var model2 = new Backbone.Model({ ... });
model1.fetch();
model2.fetch();

this.show(view, {
    entities: [model1, model2],
    loading: true,
    loadingType: 'opacity'
});
```

#### Opacity Loading View
The default loading view is a spinner (spinjs), but can be customized to show
the original view with an opacity of 0.5 instead:

```js
this.show(view, {
    loading: true,
    loadingType: 'opacity'
});
```

### Debugging
From the console, you can view the `Marionette.Controller`s that have been
created by looking at `Marionette.Controller._registry`. To verify that
controllers that have been instiated in the lifetime of the application,
call `Marionette.Controller._resetRegistry()`. This will attempt to close
down all controllers in the registry. If they are not removed from the
registry (their close was not captured), then you have a memory leak.
