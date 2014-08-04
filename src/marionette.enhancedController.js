(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['marionette', 'backbone', 'jquery', 'underscore'], factory);
    } else {
        // Use browser globals. Will fail if they are not yet loaded.
        /*globals Marionette, Backbone, $, _ */
        factory(Marionette, Backbone, $, _);
    }
}(function(Marionette, Backbone, $, _) {
    var LoadingController;
    var LoadingView;
    var Spinner;
    var appControllerLoaded = false;
    var controllerRegistry = {};
    var originalFunctions;
    var showLoading;
    var whenFetched;

    Spinner = // @include ../tmp/spin.js

    whenFetched = function(entities, callback) {
        var xhrs;

        xhrs = _.chain([entities]).flatten().pluck('_fetch').value();

        $.when.apply(this, xhrs).done(callback);
    };

    // Save a copy of the original functions.
    originalFunctions = {
        applicationConstructor: Marionette.Application.prototype.constructor,
        controllerConstructor: Marionette.Controller.prototype.constructor,
        destroy: Marionette.Controller.prototype.destroy
    };

    function overrideSync() {
        var _sync = Backbone.sync;

        Backbone.sync = function(method, entity, options) {
            var sync;

            if (_.isUndefined(options) || options === null) {
                options = {};
            }

            sync = _sync(method, entity, options);
            if (!entity._fetch && method === 'read') {
                entity._fetch = sync;
            }

            return sync;
        };
    }

    // Override Backbone.sync
    overrideSync();

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
                throw new Error('A controller must be given a region in its options');
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
                showLoading(view, options);
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

    // ## Show loading function
    showLoading = function(view, options) {
        new LoadingController({
            view: view,
            region: options.region,
            config: options
        });
    };

    // ## Loading View
    LoadingView = Marionette.ItemView.extend({
        template: false,

        className: 'loading-container',

        onShow: function() {
            var opts;
            opts = this._getOptions();

            this.spinner = new Spinner(opts);
            this.spinner.spin(this.$el.get(0));
        },

        onClose: function() {
            this.spinner.stop();
        },

        _getOptions: function() {
            return {
                lines: 10,
                length: 6,
                width: 2.5,
                radius: 7,
                corners: 1,
                rotate: 9,
                direction: 1,
                color: '#000',
                speed: 1,
                trail: 60,
                shadow: false,
                hwaccel: true,
                className: 'spinner',
                zIndex: 2e9,
                top: 'auto',
                left: 'auto'
            };
        }
    });

    // ## Loading Controller
    LoadingController = Marionette.Controller.extend({
        initialize: function(options) {
            var config;
            var loadingView;
            var view;

            view = options.view;
            config = options.config;
            config = _.isBoolean(config) ? {} : config;

            _.defaults(config, {
                debug: false,
                entities: this.getEntities(view),
                loadingType: 'spinner',
                loadingMessage: null
            });

            switch (config.loadingType) {
                case 'opacity':
                    this.region.show(view);
                    this.region.currentView.$el.css('opacity', 0.5);
                    break;
                case 'spinner':
                    loadingView = this.getLoadingView();
                    this.show(loadingView);
                    break;
                default:
                    throw new Error('Invalid loadingType');
            }

            this.showRealView(view, loadingView, config);
        },

        showRealView: function(realView, loadingView, config) {
            whenFetched(config.entities, _.bind(function() {
                // ...after the entities are fetched, execute this callback
                // ================================================================ //
                // If the region we are trying to insert is not the loadingView then
                // we know the user has navigated to a different page while the loading
                // view was still open. In that case, we know to manually close the original
                // view so its controller is also closed.  We also prevent showing the real
                // view (which would snap the user back to the old view unexpectedly)
                // ================================================================ //
                switch (config.loadingType) {
                    case 'opacity':
                        this.region.currentView.$el.css('opacity', '');
                        break;
                    case 'spinner':
                        if (this.region.currentView !== loadingView) {
                            return realView.close();
                        }
                }
                if (!config.debug) {
                    this.show(realView);
                }
            }, this));
        },

        getEntities: function(view) {
            return _.chain(view).pick('model', 'collection').toArray().compact().value();
        },

        getLoadingView: function() {
            return new LoadingView();
        }
    });
}));
