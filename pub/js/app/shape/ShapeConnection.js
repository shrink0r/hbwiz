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
        this.point_handles = [];

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
        }).on('click', function(event_data) {
            var event = event_data.evt;
            var mpos = { x: event.offsetX, y: event.offsetY };
            var handle = new Kinetic.Circle({
                x: mpos.x,
                y: mpos.y,
                opacity: 0.5,
                stroke: '#008cba',
                fill: '#efefef',
                strokeWidth: 1,
                radius: 5,
                name: name,
                draggable: true,
                dragOnTop: false
            });
            handle.on('mouseover', function(event) {
                event.cancelBubble = true;
                var layer = this.getLayer();
                document.body.style.cursor = 'pointer';
                this.setOpacity(1);
                layer.draw();
            }).on('mousedown touchstart', function(event) {
                event.cancelBubble = true;
                this.moveToTop();
                return false;
            }).on('dragmove', function() {
                var layer = this.getLayer();
                document.body.style.cursor = 'pointer';
                that.connect();
                layer.draw();
            }).on('dragend', function() {
                var layer = this.getLayer();
                layer.draw();
            }).on('mouseout', function() {
                var layer = this.getLayer();
                document.body.style.cursor = 'default';
                this.setOpacity(0.5);
                layer.draw();
            });

            that.source.layer.add(handle);
            that.point_handles.push(handle);

            if (that.selected) {
                that.options.onDeselected(that);
            } else {
                that.options.onSelected(that);
            }
        });
    };

    ShapeConnection.prototype.connect = function()
    {
        var points = this.getPoints();

        this.line.setPoints(points);
        this.capture_line.setPoints(points);
    };

    ShapeConnection.prototype.getPoints = function()
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
        var points = [{ x: spos_x, y: spos_y }];
        var i = 0;
        var flat_points = [];
        for (i = 0; i < this.point_handles.length; i++) {
            points.push({ x: this.point_handles[i].getX(), y: this.point_handles[i].getY() });
        }
        points.splice(points.length, 0, { x: tpos_x, y: tpos_y });
        points.sort(function(left, right) {
            return left.x > right.x;
        });
        for (i = 0; i < points.length; i++) {
            flat_points.splice(flat_points.length, 0, points[i].x, points[i].y);
        }

        return flat_points;
    };

    ShapeConnection.prototype.select = function()
    {
        this.selected = true;
        this.line.setStrokeWidth(2);
        this.connect();
    };

    ShapeConnection.prototype.deselect = function()
    {
        this.selected = false;
        this.line.setStrokeWidth(1);
    };

    return ShapeConnection;

});
