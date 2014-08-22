// marionette.enhancedController
// ----------------------------
// v2.1.0
//
// Annotated source code can be found here: http://useallfive.github.io/marionette.enhancedController/marionette.enhancedController.html
//
// Brought to you by [Use All Five, Inc.](http://www.useallfive.com)
// ```
// Author: Justin Anastos <janastos@useallfive.com>
// Author URI: [http://www.useallfive.com](http://www.useallfive.com)
// Repository: https://github.com/UseAllFive/marionette.enhancedController
// ```
// Add `.show` method to a `Marionette.Controller` and provide loading views.
//
// Inspired by [Backbone Rails, Loading Views](http://www.backbonerails.com/screencasts/loading-views).

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
    /*jshint camelcase: false */
    var LoadingController;
    var LoadingView;
    var Spinner;
    var controllerRegistry = {};
    var originalFunctions;
    var showLoading;
    var whenFetched;

    Spinner = /**
               * Copyright (c) 2011-2014 Felix Gnass
               * Licensed under the MIT license
               */ (function() {
                "use strict";
                var prefixes = [ "webkit", "Moz", "ms", "O" ], animations = {}, useCssAnimations;
                /* Whether to use CSS animations or setTimeout */
                /**
                 * Utility function to create elements. If no tag name is given,
                 * a DIV is created. Optionally properties can be passed.
                 */
                function createEl(tag, prop) {
                  var el = document.createElement(tag || "div"), n;
                  for (n in prop) el[n] = prop[n];
                  return el;
                }
                /**
                 * Appends children and returns the parent.
                 */
                function ins(parent) {
                  for (var i = 1, n = arguments.length; i < n; i++) parent.appendChild(arguments[i]);
                  return parent;
                }
                /**
                 * Insert a new stylesheet to hold the @keyframe or VML rules.
                 */
                var sheet = function() {
                  var el = createEl("style", {
                    type: "text/css"
                  });
                  ins(document.getElementsByTagName("head")[0], el);
                  return el.sheet || el.styleSheet;
                }();
                /**
                 * Creates an opacity keyframe animation rule and returns its name.
                 * Since most mobile Webkits have timing issues with animation-delay,
                 * we create separate rules for each line/segment.
                 */
                function addAnimation(alpha, trail, i, lines) {
                  var name = [ "opacity", trail, ~~(alpha * 100), i, lines ].join("-"), start = .01 + i / lines * 100, z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha), prefix = useCssAnimations.substring(0, useCssAnimations.indexOf("Animation")).toLowerCase(), pre = prefix && "-" + prefix + "-" || "";
                  if (!animations[name]) {
                    sheet.insertRule("@" + pre + "keyframes " + name + "{" + "0%{opacity:" + z + "}" + start + "%{opacity:" + alpha + "}" + (start + .01) + "%{opacity:1}" + (start + trail) % 100 + "%{opacity:" + alpha + "}" + "100%{opacity:" + z + "}" + "}", sheet.cssRules.length);
                    animations[name] = 1;
                  }
                  return name;
                }
                /**
                 * Tries various vendor prefixes and returns the first supported property.
                 */
                function vendor(el, prop) {
                  var s = el.style, pp, i;
                  prop = prop.charAt(0).toUpperCase() + prop.slice(1);
                  for (i = 0; i < prefixes.length; i++) {
                    pp = prefixes[i] + prop;
                    if (s[pp] !== undefined) return pp;
                  }
                  if (s[prop] !== undefined) return prop;
                }
                /**
                 * Sets multiple style properties at once.
                 */
                function css(el, prop) {
                  for (var n in prop) el.style[vendor(el, n) || n] = prop[n];
                  return el;
                }
                /**
                 * Fills in default values.
                 */
                function merge(obj) {
                  for (var i = 1; i < arguments.length; i++) {
                    var def = arguments[i];
                    for (var n in def) if (obj[n] === undefined) obj[n] = def[n];
                  }
                  return obj;
                }
                /**
                 * Returns the absolute page-offset of the given element.
                 */
                function pos(el) {
                  var o = {
                    x: el.offsetLeft,
                    y: el.offsetTop
                  };
                  while (el = el.offsetParent) o.x += el.offsetLeft, o.y += el.offsetTop;
                  return o;
                }
                /**
                 * Returns the line color from the given string or array.
                 */
                function getColor(color, idx) {
                  return typeof color == "string" ? color : color[idx % color.length];
                }
                // Built-in defaults
                var defaults = {
                  lines: 12,
                  // The number of lines to draw
                  length: 7,
                  // The length of each line
                  width: 5,
                  // The line thickness
                  radius: 10,
                  // The radius of the inner circle
                  rotate: 0,
                  // Rotation offset
                  corners: 1,
                  // Roundness (0..1)
                  color: "#000",
                  // #rgb or #rrggbb
                  direction: 1,
                  // 1: clockwise, -1: counterclockwise
                  speed: 1,
                  // Rounds per second
                  trail: 100,
                  // Afterglow percentage
                  opacity: 1 / 4,
                  // Opacity of the lines
                  fps: 20,
                  // Frames per second when using setTimeout()
                  zIndex: 2e9,
                  // Use a high z-index by default
                  className: "spinner",
                  // CSS class to assign to the element
                  top: "50%",
                  // center vertically
                  left: "50%",
                  // center horizontally
                  position: "absolute"
                };
                /** The constructor */
                function Spinner(o) {
                  this.opts = merge(o || {}, Spinner.defaults, defaults);
                }
                // Global defaults that override the built-ins:
                Spinner.defaults = {};
                merge(Spinner.prototype, {
                  /**
                   * Adds the spinner to the given target element. If this instance is already
                   * spinning, it is automatically removed from its previous target b calling
                   * stop() internally.
                   */
                  spin: function(target) {
                    this.stop();
                    var self = this, o = self.opts, el = self.el = css(createEl(0, {
                      className: o.className
                    }), {
                      position: o.position,
                      width: 0,
                      zIndex: o.zIndex
                    }), mid = o.radius + o.length + o.width;
                    css(el, {
                      left: o.left,
                      top: o.top
                    });
                    if (target) {
                      target.insertBefore(el, target.firstChild || null);
                    }
                    el.setAttribute("role", "progressbar");
                    self.lines(el, self.opts);
                    if (!useCssAnimations) {
                      // No CSS animation support, use setTimeout() instead
                      var i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, alpha, fps = o.fps, f = fps / o.speed, ostep = (1 - o.opacity) / (f * o.trail / 100), astep = f / o.lines;
                      (function anim() {
                        i++;
                        for (var j = 0; j < o.lines; j++) {
                          alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity);
                          self.opacity(el, j * o.direction + start, alpha, o);
                        }
                        self.timeout = self.el && setTimeout(anim, ~~(1e3 / fps));
                      })();
                    }
                    return self;
                  },
                  /**
                   * Stops and removes the Spinner.
                   */
                  stop: function() {
                    var el = this.el;
                    if (el) {
                      clearTimeout(this.timeout);
                      if (el.parentNode) el.parentNode.removeChild(el);
                      this.el = undefined;
                    }
                    return this;
                  },
                  /**
                   * Internal method that draws the individual lines. Will be overwritten
                   * in VML fallback mode below.
                   */
                  lines: function(el, o) {
                    var i = 0, start = (o.lines - 1) * (1 - o.direction) / 2, seg;
                    function fill(color, shadow) {
                      return css(createEl(), {
                        position: "absolute",
                        width: o.length + o.width + "px",
                        height: o.width + "px",
                        background: color,
                        boxShadow: shadow,
                        transformOrigin: "left",
                        transform: "rotate(" + ~~(360 / o.lines * i + o.rotate) + "deg) translate(" + o.radius + "px" + ",0)",
                        borderRadius: (o.corners * o.width >> 1) + "px"
                      });
                    }
                    for (;i < o.lines; i++) {
                      seg = css(createEl(), {
                        position: "absolute",
                        top: 1 + ~(o.width / 2) + "px",
                        transform: o.hwaccel ? "translate3d(0,0,0)" : "",
                        opacity: o.opacity,
                        animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + " " + 1 / o.speed + "s linear infinite"
                      });
                      if (o.shadow) ins(seg, css(fill("#000", "0 0 4px " + "#000"), {
                        top: 2 + "px"
                      }));
                      ins(el, ins(seg, fill(getColor(o.color, i), "0 0 1px rgba(0,0,0,.1)")));
                    }
                    return el;
                  },
                  /**
                   * Internal method that adjusts the opacity of a single line.
                   * Will be overwritten in VML fallback mode below.
                   */
                  opacity: function(el, i, val) {
                    if (i < el.childNodes.length) el.childNodes[i].style.opacity = val;
                  }
                });
                function initVML() {
                  /* Utility function to create a VML tag */
                  function vml(tag, attr) {
                    return createEl("<" + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr);
                  }
                  // No CSS transforms but VML support, add a CSS rule for VML elements:
                  sheet.addRule(".spin-vml", "behavior:url(#default#VML)");
                  Spinner.prototype.lines = function(el, o) {
                    var r = o.length + o.width, s = 2 * r;
                    function grp() {
                      return css(vml("group", {
                        coordsize: s + " " + s,
                        coordorigin: -r + " " + -r
                      }), {
                        width: s,
                        height: s
                      });
                    }
                    var margin = -(o.width + o.length) * 2 + "px", g = css(grp(), {
                      position: "absolute",
                      top: margin,
                      left: margin
                    }), i;
                    function seg(i, dx, filter) {
                      ins(g, ins(css(grp(), {
                        rotation: 360 / o.lines * i + "deg",
                        left: ~~dx
                      }), ins(css(vml("roundrect", {
                        arcsize: o.corners
                      }), {
                        width: r,
                        height: o.width,
                        left: o.radius,
                        top: -o.width >> 1,
                        filter: filter
                      }), vml("fill", {
                        color: getColor(o.color, i),
                        opacity: o.opacity
                      }), vml("stroke", {
                        opacity: 0
                      }))));
                    }
                    if (o.shadow) for (i = 1; i <= o.lines; i++) seg(i, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");
                    for (i = 1; i <= o.lines; i++) seg(i);
                    return ins(el, g);
                  };
                  Spinner.prototype.opacity = function(el, i, val, o) {
                    var c = el.firstChild;
                    o = o.shadow && o.lines || 0;
                    if (c && i + o < c.childNodes.length) {
                      c = c.childNodes[i + o];
                      c = c && c.firstChild;
                      c = c && c.firstChild;
                      if (c) c.opacity = val;
                    }
                  };
                }
                var probe = css(createEl("group"), {
                  behavior: "url(#default#VML)"
                });
                if (!vendor(probe, "transform") && probe.adj) initVML(); else useCssAnimations = vendor(probe, "animation");
                return Spinner;
              })();

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

    (function overrideSync() {
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
    })();

    Marionette.Controller = Marionette.Controller.extend({
        // ## Constructor
        // Override `Marionette.Controller.constructor`. Here, we'll save
        // the `region` passed in via `options` and save a reference to this
        // controller.
        constructor: function(options) {
            options = options || {};

            if (options.region) {
                // The app controller has already been loaded.

                // Define `this.region` so this controller knows where to show
                // itself.
                this.region = options.region;

                // Save the instance id. This will help with memory leak
                // tracking.
                this._instanceId = _.uniqueId('controller');

                // Save instance in the registry.
                controllerRegistry[this._instanceId] = this;
            }

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

            // When this controller is closed or destroyed, clean up the
            // registry.
            this.on('destroy close', function() {
                delete this.region;
                delete this.options;

                // Remove instance from the registry.
                delete controllerRegistry[this._instanceId];
            });
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
        constructor: function EnhancedController_LoadingView() {
            // Name constructor.
            return Object.getPrototypeOf(Object.getPrototypeOf(this)).constructor.apply(this, arguments);
        },

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
                        if (this.region && this.region.currentView !== loadingView) {
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
