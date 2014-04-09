define([
    "jquery",
    "kineticjs"
], function($, Kinetic) {

    "use strict";

    var ModuleShape = function(layer, name, options)
    {
        var noop = function() {};
        this.name = name;
        this.layer = layer;
        this.fields = [];
        this.anchors = {};

        this.options = $.extend({}, options || {});
        this.options.onSelected = this.options.onSelected || noop;
        this.options.onDeselected = this.options.onDeselected || noop;
        this.options.width = this.options.width || 200;
        this.options.height = this.options.height || 100;
        this.options.min_width = this.options.min_width || 200;
        this.options.min_height = this.options.min_height || 100;
        this.options.handle_size = this.options.handle_size || 5;
        this.options.fill = this.options.fill || '#b6edff';
        this.options.stroke = this.options.stroke || '#83bacc';
        this.options.stroke_width = this.options.stroke_width || 1;
        this.options.field_height = this.options.field_height || 30;

        this.module_data = {
            name:  this.options.label,
            type: this.options.type,
            description: this.options.description,
            options: {}
        };

        this.stage = layer.getStage();
        this.shape = this.build();
        this.selected = false;
        this.connections = [];
    };

    ModuleShape.prototype.constructor = ModuleShape;

    ModuleShape.prototype.addConnection = function(connection)
    {
        this.connections.push(connection);
    };

    ModuleShape.prototype.removeConnection = function(connection)
    {
        var index = this.connections.indexOf(connection);
        if (index !== false) {
console.log("remove conn", index);
            this.connections.splice(index, 1);
        }
    };

    ModuleShape.prototype.hasConnection = function(target, field)
    {
        var i = 0;
        var cur_connection = null;
        for (; i < this.connections.length; i++) {
            cur_connection = this.connections[i];
            if (
                cur_connection.target === target &&
                cur_connection.field === field
            ) {
                return true;
            }
        }
        return false;
    };

    ModuleShape.prototype.removeField = function(field_shape)
    {
        var field_idx = this.fields.indexOf(field_shape);
        if (field_idx !== false) {
            this.fields.splice(field_idx, 1);
            for (var i = 0; i < this.fields.length; i++) {
                this.adoptField(this.fields[i], i);
            }
            this.refreshMinHeight();
        }
    };

    ModuleShape.prototype.addField = function(field_shape)
    {
        var options = this.options;

        field_shape.options.onSelected = this.onFieldSelected.bind(this);
        field_shape.options.onDeselected = options.onDeselected;

        this.fields.push(field_shape);
        this.shape.add(field_shape.shape);
        this.adoptField(field_shape, this.fields.length - 1);

        this.onFieldSelected(field_shape);

        this.refreshMinHeight();
    };

    ModuleShape.prototype.refreshMinHeight = function()
    {
        var options = this.options;
        var main_shape = this.shape.find('.main_shape')[0];
        var pos = main_shape.getPosition();

        options.min_height = options.field_height + (this.fields.length + 1) * options.field_height;

        if (main_shape.getHeight() < options.min_height) {
            main_shape.setHeight(options.min_height);

            this.anchors.nw.setPosition({
                x: pos.x,
                y: pos.y
            });
            this.anchors.ne.setPosition({
                x: pos.x + main_shape.getWidth(),
                y: pos.y
            });
            this.anchors.sw.setPosition({
                x: pos.x,
                y: pos.y + main_shape.getHeight()
            });
            this.anchors.se.setPosition({
                x: pos.x + main_shape.getWidth(),
                y: pos.y + main_shape.getHeight()
            });
        }
    };

    ModuleShape.prototype.adoptField = function(field_shape, index)
    {
        var main_shape = this.shape.find('.main_shape')[0];
        field_shape.inheritModuleBounds(main_shape, index);
    };

    ModuleShape.prototype.setProperty = function(property_name, value)
    {
        this.module_data[property_name] = value;

        if (property_name === 'name') {
            if (this.options.type === 'aggregate') {
                this.shape.find('.main_label')[0].setText('<<'+this.module_data.name+'>>');
            } else {
                this.shape.find('.main_label')[0].setText(this.module_data.name);
            }
        }
    };

    ModuleShape.prototype.setOption = function(name, value)
    {
        this.module_data.options[name] = value;
    };

    ModuleShape.prototype.destroy = function()
    {
        this.shape.remove();
        // @todo remove event listeners
    };

    ModuleShape.prototype.onFieldSelected = function(field_shape)
    {
        if (!this.selected) {
            this.options.onSelected(this);
        } else {
            this.options.onSelected(field_shape);
        }
    };

    ModuleShape.prototype.build = function()
    {
        var options = this.options;
        var that = this;
        var stage_h = this.stage.height();
        var stage_w = this.stage.width();

        var rectangle = new Kinetic.Rect({
            name: 'main_shape',
            x: 0,
            y: 0,
            width: options.width,
            height: options.height,
            fill: options.fill,
            stroke: options.stroke,
            strokeWidth: options.stroke_width
        });

        var group = new Kinetic.Group({
            x: options.x || 20,
            y: options.y || 20,
            draggable: true,
            dragBoundFunc: function(pos) {
                var rect_pos = rectangle.getPosition();
                var shape_w = rectangle.width();
                var shape_h = rectangle.height();
                var x = pos.x + rect_pos.x;
                var y = pos.y + rect_pos.y;

                if (x - options.handle_size <= 0) { pos.x = 0 - rect_pos.x + options.handle_size; }
                if (x + options.handle_size + shape_w >= stage_w) { pos.x = stage_w - shape_w - rect_pos.x - options.handle_size; }
                if (y - options.handle_size <= 0) { pos.y = 0 - rect_pos.y + options.handle_size; }
                if (y + options.handle_size + shape_h >= stage_h) { pos.y = stage_h - shape_h - rect_pos.y - options.handle_size; }

                return { x: pos.x, y: pos.y };
            }
        });

        group.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        }).on('mouseout', function() {
            document.body.style.cursor = 'default';
        }).on('mousedown', function() {
            document.body.style.cursor = 'move';
        }).on('mouseup', function() {
            document.body.style.cursor = 'pointer';
        }).on('click', function(event) {
            event.cancelBubble = true;
            if (!that.selected) {
                that.options.onSelected(that);
            } else {
                that.options.onDeselected(that);
            }
            return false;
        }).on('dragmove', function() {
            for(var i = 0; i < that.connections.length; i++) {
                that.connections[i].connect();
            }
        });

        group.add(rectangle);
        var text = this.module_data.name;
        if (this.options.type === 'aggregate') {
            text = '<<'+text+'>>';
        }
        var label = new Kinetic.Text({
            name: 'main_label',
            text: text,
            x: 0,
            y: 0,
            width: rectangle.getWidth(),
            fontFamily: 'Calibri',
            fontSize: 18,
            padding: 5,
            fill: 'black'
        });
        group.add(label);

        this.anchors.nw = this.addAnchor(group, 0, 0, 'nw');
        this.anchors.ne = this.addAnchor(group, this.options.min_width, 0, 'ne');
        this.anchors.sw = this.addAnchor(group, 0, this.options.min_height, 'sw');
        this.anchors.se = this.addAnchor(group, this.options.min_width, this.options.min_height, 'se');

        group.on('dragstart', function() {
            this.moveToTop();
        });

        return group;
    };

    ModuleShape.prototype.select = function()
    {
        this.selected = true;
        var rectangle = this.shape.find('.main_shape')[0];
        rectangle.setStrokeWidth(3);
    };

    ModuleShape.prototype.deselect = function()
    {
        var rectangle = this.shape.find('.main_shape')[0];
        this.selected = false;
        rectangle.setStrokeWidth(1);
    };

    ModuleShape.prototype.addAnchor = function(group, x, y, name)
    {
        var that = this;
        var main_shape = group.find('.main_shape')[0];
        var anchor = new Kinetic.Circle({
            x: x,
            y: y,
            opacity: 0.5,
            stroke: '#ababab',
            fill: '#efefef',
            strokeWidth: 1,
            radius: this.options.handle_size,
            name: name,
            draggable: true,
            dragOnTop: false
        });

        anchor.on('mouseover', function(event) {
            event.cancelBubble = true;
            var layer = this.getLayer();
            document.body.style.cursor = name + '-resize';
            this.setOpacity(1);
            layer.draw();
        }).on('mousedown touchstart', function(event) {
            event.cancelBubble = true;
            this.moveToTop();
        }).on('dragmove', function() {
            var layer = this.getLayer();
            that.update(this);
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

        group.add(anchor);

        return anchor;
    };

    ModuleShape.prototype.update = function(moving_anchor)
    {
        var group = this.shape;

        var top_left = this.anchors.nw;
        var top_right = this.anchors.ne;
        var bottom_right = this.anchors.se;
        var bottom_left = this.anchors.sw;
        var shape = group.find('.main_shape')[0];
        var label = group.find('.main_label')[0];

        var anchor_x = moving_anchor.x();
        var anchor_y = moving_anchor.y();

        // update anchor positions
        switch (moving_anchor.name()) {
            case 'nw':
                top_right.setY(anchor_y);
                bottom_left.setX(anchor_x);
                if (anchor_x > top_right.getX() - this.options.min_width) {
                    moving_anchor.setX(top_right.getX() - this.options.min_width);
                    bottom_left.setX(top_right.getX() - this.options.min_width);
                }
                if (anchor_y > bottom_left.getY() - this.options.min_height) {
                    moving_anchor.setY(bottom_left.getY() - this.options.min_height);
                    top_right.setY(bottom_left.getY() - this.options.min_height);
                }
                break;
            case 'ne':
                top_left.setY(anchor_y);
                bottom_right.setX(anchor_x);
                if (anchor_x < top_left.getX() + this.options.min_width) {
                    moving_anchor.setX(top_left.getX() + this.options.min_width);
                    bottom_right.setX(top_left.getX() + this.options.min_width);
                }
                if (anchor_y > bottom_left.getY() - this.options.min_height) {
                    moving_anchor.setY(bottom_left.getY() - this.options.min_height);
                    top_left.setY(bottom_left.getY() - this.options.min_height);
                }
                break;
            case 'se':
                bottom_left.setY(anchor_y);
                top_right.setX(anchor_x);
                if (anchor_x < bottom_left.getX() + this.options.min_width) {
                    moving_anchor.setX(bottom_left.getX() + this.options.min_width);
                    top_right.setX(bottom_left.getX() + this.options.min_width);
                }
                if (anchor_y < top_left.getY() + this.options.min_height) {
                    moving_anchor.setY(top_left.getY() + this.options.min_height);
                    bottom_left.setY(top_left.getY() + this.options.min_height);
                }
                break;
            case 'sw':
                bottom_right.setY(anchor_y);
                top_left.setX(anchor_x);
                if (anchor_x > top_right.getX() - this.options.min_width) {
                    moving_anchor.setX(top_right.getX() - this.options.min_width);
                    top_left.setX(top_right.getX() - this.options.min_width);
                }
                if (anchor_y < top_left.getY() + this.options.min_height) {
                    moving_anchor.setY(top_left.getY() + this.options.min_height);
                    bottom_right.setY(top_left.getY() + this.options.min_height);
                }
                break;
        }

        shape.setPosition(top_left.getPosition());
        label.setPosition(top_left.getPosition());

        var width = top_right.x() - top_left.x();
        var height = bottom_left.y() - top_left.y();
        var i;
        if(width && height) {
            shape.setSize({width:width, height: height});
            label.setWidth(width);
            for (i = 0; i < this.fields.length; i++) {
                this.adoptField(this.fields[i], i);
            }
            for(i = 0; i < this.connections.length; i++) {
                this.connections[i].connect();
            }
        }
    };

    return ModuleShape;

});
