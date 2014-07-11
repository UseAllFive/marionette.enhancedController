# marionette.enhancedController

Brought to you by [Use All Five, Inc.](http://www.useallfive.com)

```
Author: Justin Anastos <janastos@useallfive.com>
Author URI: [http://www.useallfive.com](http://www.useallfive.com)
Repository: https://github.com/UseAllFive/marionette.enhancedController
```

Extend Marionette.Controller to allow for region management and debugging.

## Installation
Include this file before any Marionette.Controllers are used.

## Usage
Whenever you create a Marionette.Controller, pass it a `region` option that
specifies the Marionette.Region you wish to draw your controller's view on.
In the controller, use `this.show(yourView)` to display `yourView` in the
specified `region`. When the view is removed, the controller will
automatically be closed.

## Debugging
From the console, you can view the Marionette.Controllers that have been
created by looking at `Marionette.Controller._registry`. To verify that
controllers that have been instiated in the lifetime of the application,
call `Marionette.Controller._resetRegistry()`. This will attempt to close
down all controllers in the registry. If they are not removed from the
registry (their close was not captured), then you have a memory leak.
