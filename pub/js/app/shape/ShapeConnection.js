define([
    "jquery",
    "kineticjs"
], function($, Kinetic) {

    "use strict";

    var ShapeConnection = function(source, target, field, options)
    {
        var noop = function() {};

        this.source = source;
        this.target = target;
        this.field = field;
        this.line = null;
        this.capture_line = null;
        this.selected = false;

        this.options = $.extend({}, options || {});
        this.options.onSelected = this.options.onSelected || noop;
        this.options.onDeselected = this.options.onDeselected || noop;

        this.init();
    };

    ShapeConnection.prototype.constructor = ShapeConnection;

    ShapeConnection.prototype.init = function()
    {
        var source = this.field.shape.find('.main_shape')[0];
        var source_pos = source.getAbsolutePosition();
        var that = this;
        this.line = new Kinetic.Line({
            x: 0,
            y: 0,
            lineCap: 'round',
            tension: 0.3,
            strokeWidth: 1,
            stroke: '#ababab'
        });

        this.capture_line = new Kinetic.Line({
            x: 0,
            y: 0,
            lineCap: 'round',
            tension: 0.3,
            strokeWidth: 15,
            stroke: 'rgba(255, 255, 255, 0)'
        });

        this.capture_line.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            that.line.setStrokeWidth(2);
            that.line.getParent().draw();
        }).on('mouseout', function() {
            document.body.style.cursor = 'default';
            if (that.line && !that.selected) {
                that.line.setStrokeWidth(1);
                that.line.getParent().draw();
            }
        }).on('click', function() {
            if (that.selected) {
                that.options.onDeselected(that);
            } else {
                that.options.onSelected(that);
            }
        });
    };

    ShapeConnection.prototype.connect = function()
    {
        var source, source_pos, spos_x, spos_y;
        var target, target_pos, tpos_x, tpos_y;

        source = this.field.shape.find('.main_shape')[0];
        source_pos = source.getPosition();

        var abs_src_pos = source.getAbsolutePosition();
        spos_x = abs_src_pos.x + source_pos.x + source.width();
        spos_y = abs_src_pos.y + source_pos.y + (source.height() / 2);

        target = this.target.shape.find('.main_shape')[0];
        target_pos = target.getAbsolutePosition();

        var abs_trgt_pos = target.getAbsolutePosition();
        tpos_x = abs_trgt_pos.x;
        tpos_y = abs_trgt_pos.y + (target.height() / 2);

        var delta_x = tpos_x - spos_x;
        var points = [
            spos_x,
            spos_y,
            tpos_x - (delta_x / 2) - 20,
            tpos_y - ((tpos_y - spos_y) / 2),
            tpos_x,
            tpos_y
        ];

        this.line.setPoints(points);
        this.capture_line.setPoints(points);
    };

    ShapeConnection.prototype.select = function()
    {
        this.selected = true;
        this.line.setStrokeWidth(2);
    };

    ShapeConnection.prototype.deselect = function()
    {
        this.selected = false;
        this.line.setStrokeWidth(1);
    };

    return ShapeConnection;

});
