define([
    "jquery"
], function($) {

    "use strict";

    var Toolbar = function(element, options)
    {
        this.$element = $(element);
        this.options = $.extend({}, options || {});
        this.options.items = options.items || {};

        if (!this.options.name) {
            throw "Missing 'name' option upon Toolbar initialization.";
        }

        this.initItems();
        this.initEvents();
    };

    Toolbar.prototype.constructor = Toolbar;

    Toolbar.prototype.initItems = function()
    {
        var item_key, item, $list_item;
        for (item_key in this.options.items) {
            item = this.options.items[item_key];
            $list_item = $(
                '<li class="toolbar-item item-type-'+item_key+'">'+item.label+'</li>'
            );
            item.$element = $list_item;
            this.$element.append($list_item);
        }
    };

    Toolbar.prototype.initEvents = function()
    {
        var that = this;
        var $body = $($(window)[0].document.body);
        var $dragging = null;
        var toolbar_type = false, toolbar_class = false;
        var toolbar_item_selector = null;
        var css_classes = this.$element.attr('class').split(" ");
        var i = 0, matches = false;

        for (i; i < css_classes.length && !toolbar_type; i++) {
            matches = css_classes[i].match(/^toolbar\-type\-(.+)/);
            if (matches.length > 0) {
                toolbar_type = matches[1];
                toolbar_class = css_classes[i];
            }
        }

        toolbar_item_selector = "." + toolbar_class + " .toolbar-item";

        // handle dragging from the toolbar to the canvas
        $body.on("mousemove", function(e) {
            if ($dragging) {
                $dragging.offset({
                    top: e.pageY,
                    left: e.pageX
                });

                return false;
            }
        }).on("mousedown", toolbar_item_selector, function (e) {
            $dragging = $(e.target).clone();
            $body.append($dragging);

            return false;
        }).on("mouseup", function (e) {
            if ($dragging) {
                if (that.options.onItemDropped) {
                    var css_classes = $dragging.attr('class').split(" ");
                    var item_type = false, matches = false;
                    var i = 0;

                    for (i; i < css_classes.length && !item_type; i++) {
                        matches = css_classes[i].match(/^item\-type\-(.+)/);
                        if (matches.length > 0) {
                            item_type = matches[1];
                        }
                    }

                    that.options.onItemDropped({
                        element: $dragging,
                        name: that.options.name,
                        item: that.options.items[item_type],
                        coords: {x: e.pageX, y: e.pageY}
                    });
                }

                $dragging.remove();
                $dragging = null;
            }

            return false;
        });
    };

    return Toolbar;

});
