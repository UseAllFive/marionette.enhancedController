/*global Marionette, Spinner */
//jshint unused: false
(function() {
    return Marionette.ItemView.extend({
        template: false,

        className: 'loading-container',

        onShow: function() {
            var Spinner;
            var opts;

            Spinner = // @include ../tmp/spin.js

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
})();
