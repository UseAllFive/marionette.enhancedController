/* # marionette.enhancdController

Brought to you by [Use All Five, Inc.](http://www.useallfive.com)

```
Author: Justin Anastos <janastos@useallfive.com>
Author URI: [http://www.useallfive.com](http://www.useallfive.com)
Repository: https://github.com/UseAllFive/marionette.babyBird
```

Add `.show` method to a `Marionette.Controller`. Requires that `region` is
passed in as an option at instantiation.

Inspired by [Backbone Rails, Loading Views](http://www.backbonerails.com/screencasts/loading-views).

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
    var appInstance;
    var controllerRegistry = {};
    var originalFunctions;

    // Save a copy of the original functions.
    originalFunctions = {
        applicationConstructor: Marionette.Application.prototype.constructor,
        controllerConstructor: Marionette.Controller.prototype.constructor,
        destroy: Marionette.Controller.prototype.destroy
    };

    // Modify `Marionette.Application` so we can save an instance when it
    // is created. This is all excuted *before* we have an actual app, so
    // this will allow us to capture the app instance when one is created.
    Marionette.Application = Marionette.Application.extend({
        constructor: function() {
            var self = this;

            appInstance = self;

            originalFunctions.applicationConstructor.apply(this, arguments);
        }
    });

    // Static function to create a `close` or `destroy` function on a
    // `controllerInstance`.
    function overrideDestroyOrCloseFunction(controllerInstance) {
        var functionName;
        var originalFunction;

        // Determine if we have a `close` or a `destroy` function. The API
        // changed going to Backbone 2.
        if (_.isFunction(controllerInstance.close)) {
            // < Backbone 2
            functionName = 'close';
        } else if (_.isFunction(controllerInstance.destroy)) {
            // >= Backbone 2
            functionName = 'destroy';
        } else {
            throw new Error('Could not find a close or destroy method on the controller');
        }

        // Save the original function.
        originalFunction = controllerInstance[functionName];

        // Modify the original function.
        controllerInstance[functionName] = function() {
            delete this.region;
            delete this.options;

            // Remove instance from the registry.
            delete controllerRegistry[this._instanceId];

            // Call original function.
            originalFunction.apply(this, arguments);
        };
    }

    Marionette.Controller = Marionette.Controller.extend({
        // ## Constructor
        // Override `Marionette.Controller.constructor`. Here, we'll save
        // the `region` passed in via `options` and save a reference to this
        // controller.
        constructor: function(options) {
            options = options || {};

            if (appControllerLoaded) {
                // The app controller has already been loaded.

                // Define `this.region` so this controller knows where to show
                // itself.
                this.region = options.region;

                // Save the instance id. This will help with memory leak
                // tracking.
                this._instanceId = _.uniqueId('controller');

                // Save instance in the registry.
                controllerRegistry[this._instanceId] = this;
            } else {
                // The app controller is loading now.

                appControllerLoaded = true;
            }

            // Override the close or destroy function.
            overrideDestroyOrCloseFunction(this);

            // Call the original constructor.
            originalFunctions.controllerConstructor.apply(this, arguments);
        },

        show: function(view, options) {
            if (!this.region) {
                throw new Error('A controller must be given a region in it\'s options');
            }

            // Default `options` to `{}`
            if (_.isUndefined(options) || options === null) {
                options = {};
            }

            // Set default options
            _.defaults(options, {
                loading: false,
                region: this.region
            });

            this._setMainView(view);

            this._manageView(view, options);
        },

        _setMainView: function(view) {
            // Taken verbatim from [backbone rails loading views](https://github.com/brian-mann/sc02-loading-views):

            // the first view we show is always going to become the mainView
            // of our controller (whether its a layout or another view
            // type).  So if this *is* a layout, when we show other regions
            // inside of that layout, we check for the existance of a
            // mainView first, so our controller is only closed down when
            // the original mainView is closed.

            if (this._mainView) {
                return;
            }
            this._mainView = view;

            // Listen to `close` and `destroy` events on the `view`.
            // Depending on which version of backbone we're using, a
            // different functions are called.
            this.listenTo(view, 'close', this.close);
            this.listenTo(view, 'destroy', this.destroy);
        },

        _manageView: function(view, options) {
            if (options.loading) {
                // Show loading view
                appInstance.execute('show:loading', view, options);
            } else {
                options.region.show(view);
            }
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
