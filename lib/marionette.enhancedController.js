/* # marionette.enhancdController

Brought to you by [Use All Five, Inc.](http://www.useallfive.com)

```
Author: Justin Anastos <janastos@useallfive.com>
Author URI: [http://www.useallfive.com](http://www.useallfive.com)
Repository: https://github.com/UseAllFive/marionette.babyBird
```

Add `.show` method to a `Marionette.Controller`. Requires that `region` is
passed in as an option at instantiation.

*/
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['marionette', 'underscore'], factory);
    } else {
        // Use browser globals. Will fail if they are not yet loaded.
        /*globals Marionette, _ */
        factory(Marionette, _);
    }
}(function(Marionette, _) {
    var appControllerLoaded = false;
    var controllerRegistry = {};
    var originalFunctions;

    // Save a copy of the original prototype functions.
    originalFunctions = {
        constructor: Marionette.Controller.prototype.constructor,
        destroy: Marionette.Controller.prototype.destroy
    };

    Marionette.Controller = Marionette.Controller.extend({
        // ## Constructor
        // Override `Marionette.Controller.constructor`. Here, we'll save
        // the `region` passed in via `options` and save a reference to this
        // controller.
        constructor: function(options) {
            options = options || {};

            if (appControllerLoaded) {

                // Define `this.region` so this controller knows where to show
                // itself.
                this.region = options.region;

                // Save the instance id. This will help with memory leak
                // tracking.
                this._instanceId = _.uniqueId('controller');

                // Save instance in the registry.
                controllerRegistry[this._instanceId] = this;
            } else {
                appControllerLoaded = true;
            }
            // Call the `register:instance` command.
            // App.execute('register:instance', this, this._instanceId);

            originalFunctions.constructor.apply(this, options);
        },

        destroy: function() {
            delete this.region;
            delete this.options;

            // Remove instance from the registry.
            delete controllerRegistry[this._instanceId];

            originalFunctions.destroy.apply(this, arguments);

            // App.execute('unregister:instance', this, this._instanceId);
        },

        show: function show(view) {
            if (!this.region) {
                throw new Error('A controller must be given a region in it\'s options');
            }

            // Listen for when the view is destroyd to destroy this controller.
            this.listenTo(view, 'destroy', this.destroy);

            // Show the `view` in the `this.region`.
            this.region.show(view);
        }
    });

    Marionette.Controller._registry = controllerRegistry;
    Marionette.Controller._resetRegistry = function() {
        // Allow develoompent debuggging since this is a development
        // function.
        //jshint devel: true
        var controller;
        var index;
        var message;
        var newCount;
        var oldCount = _.size(controllerRegistry);

        for (index in controllerRegistry) {
            if (controllerRegistry.hasOwnProperty(index)) {
                controller = controllerRegistry[index];

                if (controller.region) {
                    if (controller.region.empty) {
                        controller.region.empty();
                    } else if (controller.region.close) {
                        controller.region.close();
                    }
                }
            }
        }

        newCount = _.size(controllerRegistry);

        message = 'There were ' + oldCount + ' controllers in the registry, there are now ' + newCount;
        if (newCount > 0) {
            console.warn(message, controllerRegistry);
        } else {
            console.info(message);
        }
    };
}));
