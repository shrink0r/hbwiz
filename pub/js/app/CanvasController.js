define([
    "jquery",
    "kineticjs",
    "app/shape/ShapeConnection",
    "app/shape/ModuleShape",
    "app/shape/FieldShape"
], function($, Kinectic, ShapeConnection, ModuleShape, FieldShape) {

    "use strict";

    var CanvasController = function(element, options)
    {
        var noop = function() {};

        this.$element = $(element);

        this.options = $.extend({}, options || {});
        this.options.onShapeSelected = this.options.onShapeSelected || noop;
        this.options.onShapeDeselected = this.options.onShapeDeselected || noop;

        this.stage = null;
        this.layers = { main: null };
        this.shapes = [];
        this.active_shape = null;
        this.active_field = null;
        this.active_connection = null;

        this.initCanvas();
    };

    CanvasController.prototype.constructor = CanvasController;

    CanvasController.prototype.initCanvas = function()
    {
        var that = this;

        // initialize our stage
        this.stage = new Kinetic.Stage({
            container: this.$element[0],
            width: this.$element.width(),
            height: this.$element.height()
        });

        // initialize our main layer
        this.layers.main = new Kinetic.Layer();
        // setup a big transparent rect to capture clicks.
        var click_capture = new Kinetic.Rect({
            name: 'click_capture',
            x: 0,
            y: 0,
            width: this.stage.getWidth(),
            height: this.stage.getHeight()
        });
        this.layers.main.add(click_capture);
        this.stage.add(this.layers.main);

        // capture all clicks that are not handled by any concrete shapes.
        click_capture.on('click', function() {
            if (that.active_shape) {
                that.onShapeDeselected(that.active_shape);
            }
        });

        // remove shapes when they are selected and backspace is pressed
        $(document.body).keydown(function(keyup_event) {
            if (keyup_event.keyCode === 8) {
                if (keyup_event.target.tagName !== 'INPUT') {
                    if (that.active_connection) {
                        that.active_connection.source.removeConnection(that.active_connection);
                        that.active_connection.target.removeConnection(that.active_connection);
                        that.active_connection.line.remove();
                        that.active_connection.capture_line.remove();
                        that.layers.main.draw();
                    } else {
                        that.removeSelectedShape();
                    }
                    return false;
                }
            }
        });
    };

    CanvasController.prototype.removeSelectedShape = function()
    {
        if (this.active_shape) {
            var shape_idx = this.shapes.indexOf(this.active_shape);
            var shape = null;
            if (this.active_field) {
                shape = this.active_field;
                this.shapes[shape_idx].removeField(shape);
            } else {
                shape = this.shapes.splice(shape_idx, 1)[0];
            }
            this.onShapeDeselected(shape);
            shape.destroy();
            this.layers.main.draw();
        }
    };

    CanvasController.prototype.addShape = function(toolbar_item)
    {
        var relative_offset = this.$element.offset();
        var wizard_shape, that = this;

        var shape_options = toolbar_item.item;

        if (toolbar_item.name === 'modules') {
            // module shape factory
            shape_options.x = toolbar_item.coords.x - relative_offset.left;
            shape_options.y = toolbar_item.coords.y - relative_offset.top;
            shape_options.onSelected = this.onShapeSelected.bind(this);
            shape_options.onDeselected = this.onShapeDeselected.bind(this);
            wizard_shape = new ModuleShape(
                this.layers.main,
                toolbar_item.item.type,
                shape_options
            );

            var dimensions = {
                x: toolbar_item.coords.x,
                y: toolbar_item.coords.y,
                width: wizard_shape.options.width,
                height: wizard_shape.options.height
            };

            if (!this.isWithinBounds(dimensions)) {
                wizard_shape.destroy();
                return false;
            }

            this.layers.main.add(wizard_shape.shape);
            this.layers.main.draw();
            this.shapes.push(wizard_shape);
            this.onShapeSelected(wizard_shape);
        } else {
            // field shape factory
            var target_module_shape = this.determineTarget(toolbar_item);
            if (!target_module_shape) {
                return false;
            }

            wizard_shape = new FieldShape(
                this.layers.main,
                toolbar_item.item.type,
                shape_options
            );

            target_module_shape.addField(wizard_shape);
            this.layers.main.draw();
        }

        return true;
    };

    CanvasController.prototype.isWithinBounds = function(dimensions)
    {
        var relative_offset = this.$element.offset();

        var bounds = {
            left: relative_offset.left,
            top: relative_offset.top,
            right: relative_offset.left + this.stage.getWidth(),
            bottom: relative_offset.top + this.stage.getHeight()
        };

        return dimensions.x > bounds.left &&
            dimensions.x + dimensions.width < bounds.right &&
            dimensions.y > bounds.top &&
            dimensions.y + dimensions.height < bounds.bottom;
    };

    CanvasController.prototype.determineTarget = function(toolbar_item)
    {
        var relative_offset = this.$element.offset();
        var coords = toolbar_item.coords;
        var shape_pos;
        coords.x -= relative_offset.left;
        coords.y -= relative_offset.top;

        var i = 0, found_shape = false;
        var main_shape, group, bounds;
        for (; i < this.shapes.length && !found_shape; i++) {
            group = this.shapes[i].shape;
            main_shape = group.find('.main_shape')[0];
            shape_pos = main_shape.getPosition();
            bounds = {
                left: group.getX() - shape_pos.x,
                right: group.getX() - shape_pos.x + main_shape.width(),
                top: group.getY() - shape_pos.y,
                bottom: group.getY() - shape_pos.y + main_shape.height()
            };

            if (coords.x > bounds.left &&
                coords.x < bounds.right &&
                coords.y > bounds.top &&
                coords.y < bounds.bottom
            ) {
                found_shape = this.shapes[i];
            }
        }

        return found_shape;
    };

    CanvasController.prototype.onShapeSelected = function(wizard_shape)
    {
        if (this.active_connection) {
            this.onConnectionDeselected(this.active_connection);
        }
        if (wizard_shape instanceof ModuleShape) {
            if (this.active_shape) {
                if (this.active_field &&
                    this.active_field.field_data.type === 'aggregate' &&
                    wizard_shape.module_data.type === 'aggregate'
                ) {
                    this.connectShapes(this.active_shape, wizard_shape, this.active_field);
                    return;
                } else if (this.active_field &&
                    this.active_field.field_data.type === 'reference' &&
                    wizard_shape.module_data.type === 'root'
                ) {
                    this.connectShapes(this.active_shape, wizard_shape, this.active_field);
                    return;
                } else {
                    this.onShapeDeselected(this.active_shape);
                }
            }
            this.active_shape = wizard_shape;
            this.active_shape.select();
        } else {
            if (this.active_field) {
                this.onShapeDeselected(this.active_field);
            }
            this.active_field = wizard_shape;
            this.active_field.select();
        }

        this.options.onShapeSelected(wizard_shape);

        this.layers.main.draw();
    };

    CanvasController.prototype.onConnectionSelected = function(connection)
    {
        if (this.active_shape) {
            this.onShapeDeselected(this.active_shape);
        }
        connection.select();
        this.active_connection = connection;
        this.layers.main.draw();
    };

    CanvasController.prototype.onConnectionDeselected = function(connection)
    {
        connection.deselect();
        this.active_connection = null;
        this.layers.main.draw();
    };

    CanvasController.prototype.connectShapes = function(source, target, field)
    {
        if (source.hasConnection(target, field)) {
            return;
        }

        var connection = new ShapeConnection(
            source,
            target,
            field,
            {
                onSelected: this.onConnectionSelected.bind(this),
                onDeselected: this.onConnectionDeselected.bind(this)
            }
        );

        source.addConnection(connection);
        target.addConnection(connection);

        this.layers.main.add(connection.line);
        this.layers.main.add(connection.capture_line);

        connection.connect();

        this.layers.main.draw();
    };

    CanvasController.prototype.onShapeDeselected = function(wizard_shape)
    {
        if (wizard_shape instanceof ModuleShape) {
            if (this.active_field) {
                this.deselectField(this.active_field);
            }

            if (this.active_shape === wizard_shape) {
                this.active_shape.deselect();
                this.active_shape = null;
                this.options.onShapeDeselected(wizard_shape);
            }
        } else {
            this.deselectField(wizard_shape);
        }

        this.layers.main.draw();
    };

    CanvasController.prototype.deselectField = function(field_shape)
    {
        if (this.active_field === field_shape) {
            this.active_field.deselect();
            this.active_field = null;
            this.options.onShapeDeselected(field_shape);
        }
    };

    return CanvasController;
});
