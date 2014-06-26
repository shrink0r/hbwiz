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
            strokeWidth: 10,
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
            if (that.selected) {
                that.addHandle(event_data.evt.offsetX, event_data.evt.offsetY);
                that.connect();
                that.source.layer.draw();
            } else {
                that.options.onSelected(that);
            }
        });
    };

    ShapeConnection.prototype.destroy = function()
    {
        var i = 0;
        this.source.removeConnection(this);
        this.target.removeConnection(this);
        this.field.removeConnection(this);
        this.line.remove();
        this.capture_line.remove();

        for (; i < this.point_handles.length; i++) {
            this.point_handles[i].remove();
        }
        this.point_handles = null;
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
        for (i = 0; i < points.length; i++) {
            flat_points.splice(flat_points.length, 0, points[i].x, points[i].y);
        }

        return flat_points;
    };

    ShapeConnection.prototype.addHandle = function(x, y)
    {
        var that = this;
        var insert_index = false;
        var i = 0;
        var handle = new Kinetic.Circle({
            x: x,
            y: y,
            opacity: 0.5,
            stroke: '#008cba',
            fill: '#efefef',
            strokeWidth: 1,
            radius: 5,
            name: name,
            draggable: true,
            dragOnTop: false,
            visibile: false
        });

        handle.on('mouseover', function(event) {
            var layer = this.getLayer();
            event.cancelBubble = true;
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
        }).on('click', function() {
            var layer = this.getLayer();
            layer.draw();
        }).on('mouseout', function() {
            var layer = this.getLayer();
            document.body.style.cursor = 'default';
            this.setOpacity(0.5);
            layer.draw();
        });

        for (; i < this.point_handles.length && insert_index === false; i++) {
            if (this.point_handles[i].getX() > x) {
                insert_index = i;
            }
        }
        if (insert_index === false) {
            insert_index = this.point_handles.length;
        }

        this.point_handles.splice(insert_index, 0, handle);
        this.source.layer.add(handle);
    };

    ShapeConnection.prototype.select = function()
    {
        var i = 0;

        this.selected = true;
        this.line.setStrokeWidth(2);
        this.connect();
        for (; i < this.point_handles.length; i++) {
            this.point_handles[i].visible(true);
        }
    };

    ShapeConnection.prototype.deselect = function()
    {
        var i = 0;

        this.selected = false;
        this.line.setStrokeWidth(1);

        for (; i < this.point_handles.length; i++) {
            this.point_handles[i].visible(false);
        }
    };

    return ShapeConnection;

});
