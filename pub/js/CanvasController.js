define([
    "jquery",
    "kineticjs",
    "ShapeConnection",
    "ModuleShape",
    "FieldShape"
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

        this.initCanvas();
    };

    CanvasController.prototype.constructor = CanvasController;

    CanvasController.prototype.initCanvas = function()
    {
        var that = this;
        this.adjustStageContainerSize();
        $(window).resize(this.adjustStageContainerSize);

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
                    that.removeSelectedShape();
                    return false;
                }
            }
        });
    };

    CanvasController.prototype.adjustStageContainerSize = function()
    {
        var stage_height = $(window).height() - this.$element.offset().top - 75;
        stage_height = stage_height > 300 ? stage_height : 300;
        this.$element.height(stage_height);
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
        }

        return dimensions.x > bounds.left
            && dimensions.x + dimensions.width < bounds.right
            && dimensions.y > bounds.top
            && dimensions.y + dimensions.height < bounds.bottom;
    };

    CanvasController.prototype.determineTarget = function(toolbar_item)
    {
        var relative_offset = this.$element.offset();
        var coords = toolbar_item.coords;
        coords.x -= relative_offset.left;
        coords.y -= relative_offset.top;

        var i = 0, found_shape = false;
        var main_shape, group, bounds;
        for (; i < this.shapes.length && !found_shape; i++) {
            group = this.shapes[i].shape;
            main_shape = group.find('.main_shape')[0];

            bounds = {
                left: group.getX(),
                right: group.getX() + main_shape.width(),
                top: group.getY(),
                bottom: group.getY() + main_shape.height()
            };

            if (coords.x > bounds.left
                && coords.x < bounds.right
                && coords.y > bounds.top
                && coords.y < bounds.bottom
            ) {
                found_shape = this.shapes[i];
            }
        }

        return found_shape;
    };

    CanvasController.prototype.onShapeSelected = function(wizard_shape)
    {
        if (wizard_shape instanceof ModuleShape) {
            if (this.active_shape) {
                if (this.active_field
                    && this.active_field.field_data.type === 'Aggregate'
                    && wizard_shape.module_data.type === 'AggregateModule'
                ) {
                    this.connectAggregate(this.active_shape, wizard_shape, this.active_field);
                    return;
                } else if (this.active_field
                    && this.active_field.field_data.type === 'Reference'
                    && wizard_shape.module_data.type === 'RootModule'
                ) {
                    this.connectReference(this.active_shape, wizard_shape, this.active_field);
                    return;
                } else {
                    this.onShapeDeselected(this.active_shape);
                }
            }
            this.active_shape = wizard_shape;
            this.active_shape.select();
        } else {
            if (this.active_field) {
                this.active_field.deselect();
            }
            this.active_field = wizard_shape;
            this.active_field.select();
        }

        this.options.onShapeSelected(wizard_shape);

        this.layers.main.draw();
    };

    CanvasController.prototype.onConnectionSelected = function(connection)
    {
        connection.line.remove();
        connection.capture_line.remove();
        this.layers.main.draw();
    };

    CanvasController.prototype.connectAggregate = function(source, target, field)
    {
        var connection = new ShapeConnection(
            source,
            target,
            field,
            { onSelected: this.onConnectionSelected.bind(this) }
        );

        source.addConnection(connection);
        target.addConnection(connection);

        this.layers.main.add(connection.line);
        this.layers.main.add(connection.capture_line);

        connection.connect();

        this.layers.main.draw();
    };

    CanvasController.prototype.connectReference = function(source_shape, target_shape, field_shape)
    {
        alert("connect " + source_shape.module_data.name + " with " + target_shape.module_data.name);
    };

    CanvasController.prototype.onShapeDeselected = function(wizard_shape)
    {
        if (wizard_shape instanceof ModuleShape) {
            if (this.active_shape === wizard_shape) {
                this.active_shape.deselect();
            }
            this.active_shape = null;
        }

        if (this.active_field) {
            this.active_field.deselect();
            this.options.onShapeDeselected(this.active_field);
            this.active_field = null;
        }
        this.options.onShapeDeselected(wizard_shape);

        this.layers.main.draw();
    };

    return CanvasController;
});
