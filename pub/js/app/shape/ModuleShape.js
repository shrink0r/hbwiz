define([
    "jquery",
    "kineticjs"
], function($, Kinetic) {

    "use strict";

    var ModuleShape = function(layer, name, options)
    {
        var noop = function() {};
        var module_options = {};
        var option_name = null;

        this.name = name;
        this.layer = layer;
        this.fields = [];
        this.anchors = {};
        this.connectors = {};

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

        for (option_name in this.options.options) {
            if (this.options.options[option_name].default) {
                module_options[option_name] = this.options.options[option_name].default;
            }
        }
        this.module_data = {
            name:  this.options.label,
            type: this.options.type,
            description: this.options.description,
            options: module_options
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
        var anchor_idx = 0;
        var field_group = field_shape.shape;
        var field = field_group.find('.main_shape')[0];
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

        this.setupConnectors(group, rectangle);
        this.setupAnchors(group, rectangle);

        group.on('dragstart', function() {
            this.moveToTop();
        });

        return group;
    };

    ModuleShape.prototype.select = function()
    {
        var rectangle = this.shape.find('.main_shape')[0];
        var anchor_key = null;

        this.selected = true;
        rectangle.setStrokeWidth(3);

        for (anchor_key in this.anchors) {
            this.anchors[anchor_key].visible(true);
        }

        for (anchor_key in this.connectors) {
            this.connectors[anchor_key].visible(true);
        }
    };

    ModuleShape.prototype.deselect = function()
    {
        var rectangle = this.shape.find('.main_shape')[0];
        var anchor_key = null;

        this.selected = false;
        rectangle.setStrokeWidth(1);

        for (anchor_key in this.anchors) {
            this.anchors[anchor_key].visible(false);
        }

        for (anchor_key in this.connectors) {
            this.connectors[anchor_key].visible(false);
        }
    };

    ModuleShape.prototype.setupAnchors = function(group, rectangle)
    {
        this.anchors.nw = this.addAnchor(group, 0, 0, 'nw');
        this.anchors.ne = this.addAnchor(group, this.options.min_width, 0, 'ne');
        this.anchors.sw = this.addAnchor(group, 0, this.options.min_height, 'sw');
        this.anchors.se = this.addAnchor(group, this.options.min_width, this.options.min_height, 'se');
    };

    ModuleShape.prototype.addAnchor = function(group, x, y, name)
    {
        var that = this;
        var main_shape = group.find('.main_shape')[0];
        var size_offset = this.options.handle_size;
        var anchor = new Kinetic.Rect({
            x: x - size_offset,
            y: y - size_offset,
            opacity: 0.5,
            stroke: '#ababab',
            fill: '#efefef',
            strokeWidth: 1,
            width: this.options.handle_size * 2,
            height: this.options.handle_size * 2,
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

    ModuleShape.prototype.setupConnectors = function(group, rectangle)
    {
        var vunit_measure = rectangle.getHeight() / 3;
        var vunit_offset = vunit_measure / 2;
        var hunit_measure = rectangle.getWidth() / 3;
        var hunit_offset = hunit_measure / 2;

        this.connectors.north_left = this.addConnector(
            group,
            hunit_measure * 1 - hunit_offset,
            0,
            'north_left'
        );
        this.connectors.north_center = this.addConnector(
            group,
            hunit_measure * 2 - hunit_offset,
            0,
            'north_center'
        );
        this.connectors.north_right = this.addConnector(
            group,
            hunit_measure * 3 - hunit_offset,
            0,
            'north_right'
        );

        this.connectors.east_upper = this.addConnector(
            group,
            rectangle.getWidth(),
            vunit_measure * 1 - vunit_offset,
            'east_upper'
        );
        this.connectors.east_middle = this.addConnector(
            group,
            rectangle.getWidth(),
            vunit_measure * 2  - vunit_offset,
            'east_middle'
        );
        this.connectors.east_lower = this.addConnector(
            group,
            rectangle.getWidth(),
            vunit_measure * 3 - vunit_offset,
            'east_lower'
        );

        this.connectors.south_left = this.addConnector(
            group,
            hunit_measure * 1 - hunit_offset,
            rectangle.getHeight(),
            'south_left'
        );
        this.connectors.south_center = this.addConnector(
            group,
            hunit_measure * 2 - hunit_offset,
            rectangle.getHeight(),
            'south_center'
        );
        this.connectors.south_right = this.addConnector(
            group,
            hunit_measure * 3 - hunit_offset,
            rectangle.getHeight(),
            'south_right'
        );

        this.connectors.west_upper = this.addConnector(
            group,
            0,
            vunit_measure * 1 - vunit_offset,
            'west_upper'
        );
        this.connectors.west_middle = this.addConnector(
            group,
            0,
            vunit_measure * 2  - vunit_offset,
            'west_middle'
        );
        this.connectors.west_lower = this.addConnector(
            group,
            0,
            vunit_measure * 3 - vunit_offset,
            'west_lower'
        );
    };

    ModuleShape.prototype.updateConnectors = function()
    {
        var group = this.shape;
        var rectangle = group.find('.main_shape')[0];
        var pos = rectangle.getPosition();
        var vunit_measure = rectangle.getHeight() / 3;
        var vunit_offset = vunit_measure / 2;
        var hunit_measure = rectangle.getWidth() / 3;
        var hunit_offset = hunit_measure / 2;

        this.connectors.north_left.setPosition({
            x: pos.x + hunit_measure * 1 - hunit_offset,
            y: pos.y + 0
        });
        this.connectors.north_center.setPosition({
            x: pos.x + hunit_measure * 2 - hunit_offset,
            y: pos.y + 0
        });
        this.connectors.north_right.setPosition({
            x: pos.x + hunit_measure * 3 - hunit_offset,
            y: pos.y + 0
        });

        this.connectors.east_upper.setPosition({
            x: pos.x + rectangle.getWidth(),
            y: pos.y + vunit_measure * 1 - vunit_offset
        });
        this.connectors.east_middle.setPosition({
            x: pos.x + rectangle.getWidth(),
            y: pos.y + vunit_measure * 2  - vunit_offset
        });
        this.connectors.east_lower.setPosition({
            x: pos.x + rectangle.getWidth(),
            y: pos.y + vunit_measure * 3  - vunit_offset
        });

        this.connectors.south_left.setPosition({
            x: pos.x + hunit_measure * 1 - hunit_offset,
            y: pos.y + rectangle.getHeight()
        });
        this.connectors.south_center.setPosition({
            x: pos.x + hunit_measure * 2 - hunit_offset,
            y: pos.y + rectangle.getHeight()
        });
        this.connectors.south_right.setPosition({
            x: pos.x + hunit_measure * 3 - hunit_offset,
            y: pos.y + rectangle.getHeight()
        });

        this.connectors.west_upper.setPosition({
            x: pos.x + 0,
            y: pos.y + vunit_measure * 1 - vunit_offset
        });
        this.connectors.west_middle.setPosition({
            x: pos.x + 0,
            y: pos.y + vunit_measure * 2 - vunit_offset
        });
        this.connectors.west_lower.setPosition({
            x: pos.x + 0,
            y: pos.y + vunit_measure * 3 - vunit_offset
        });
    };

    ModuleShape.prototype.addConnector = function(group, x, y, name)
    {
        var that = this;
        var main_shape = group.find('.main_shape')[0];
        var connector = new Kinetic.Circle({
            x: x,
            y: y,
            opacity: 0.5,
            stroke: '#064204',
            fill: '#efefef',
            strokeWidth: 1,
            radius: this.options.handle_size,
            name: name,
            draggable: false
        });

        connector.on('mouseover', function(event) {
            event.cancelBubble = true;
            var layer = this.getLayer();
            document.body.style.cursor = name + '-resize';
            this.setOpacity(1);
            layer.draw();
        }).on('mouseout', function() {
            var layer = this.getLayer();
            document.body.style.cursor = 'default';
            this.setOpacity(0.5);
            layer.draw();
        });

        group.add(connector);

        return connector;
    };

    ModuleShape.prototype.update = function(moving_anchor)
    {
        var group = this.shape;
        var size_offset = this.options.handle_size;
        var top_left = this.anchors.nw;
        var top_right = this.anchors.ne;
        var bottom_right = this.anchors.se;
        var bottom_left = this.anchors.sw;
        var shape = group.find('.main_shape')[0];
        var label = group.find('.main_label')[0];
        var anchor_x = moving_anchor.x();
        var anchor_y = moving_anchor.y();
        var min_edge_left = top_right.getX() - this.options.min_width;
        var min_edge_right = top_left.getX() + this.options.min_width;
        var min_edge_top = bottom_left.getY() - this.options.min_height;
        var min_edge_bottom = top_left.getY() + this.options.min_height;
        var anchor_name = moving_anchor.getName().replace(/\-\d+/, '');
        var cur_anchor = null;
        var cur_anchor_name = null;
        var anchor_matches = null;
        var anchor_field_group = null;
        var anchor_field = null;

        // update anchor positions
        switch (anchor_name) {
            case 'nw':
                top_right.setY(anchor_y);
                bottom_left.setX(anchor_x);

                if (anchor_x > min_edge_left) {
                    moving_anchor.setX(min_edge_left);
                    bottom_left.setX(min_edge_left);
                }
                if (anchor_y > min_edge_top) {
                    moving_anchor.setY(min_edge_top);
                    top_right.setY(min_edge_top);
                }
                break;
            case 'ne':
                top_left.setY(anchor_y);
                bottom_right.setX(anchor_x);

                if (anchor_x < min_edge_right) {
                    moving_anchor.setX(min_edge_right);
                    bottom_right.setX(min_edge_right);
                }
                if (anchor_y > min_edge_top) {
                    moving_anchor.setY(min_edge_top);
                    top_left.setY(min_edge_top);
                }
                break;
            case 'se':
                bottom_left.setY(anchor_y);
                top_right.setX(anchor_x);

                if (anchor_x < min_edge_right) {
                    moving_anchor.setX(min_edge_right);
                    top_right.setX(min_edge_right);
                }
                if (anchor_y < min_edge_bottom) {
                    moving_anchor.setY(min_edge_bottom);
                    bottom_left.setY(min_edge_bottom);
                }
                break;
            case 'sw':
                bottom_right.setY(anchor_y);
                top_left.setX(anchor_x);

                if (anchor_x > min_edge_left) {
                    moving_anchor.setX(min_edge_left);
                    top_left.setX(min_edge_left);
                }
                if (anchor_y < min_edge_bottom) {
                    moving_anchor.setY(min_edge_bottom);
                    bottom_right.setY(min_edge_bottom);
                }
                break;
        }

        shape.setPosition({ x: top_left.getX() + size_offset, y: top_left.getY() + size_offset });
        label.setPosition({ x: top_left.getX() + size_offset, y: top_left.getY() + size_offset });

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

        this.updateConnectors(shape);
    };

    return ModuleShape;

});
