(function($window, export_to)
{
    export_to = export_to || $window[0];

    var MIN_WIDTH = 200;
    var MIN_HEIGHT = 100;
    var FIELD_HEIGHT = 30;

    var ModuleShape = function(layer, name, options)
    {
        var noop = function() {};
        this.name = name;
        this.layer = layer;
        this.fields = [];

        this.options = $.extend({}, options || {});
        this.options.onSelected = this.options.onSelected || noop;
        this.options.onDeselected = this.options.onDeselected || noop;
        this.options.width = this.options.width || MIN_WIDTH;
        this.options.height = this.options.height || MIN_HEIGHT;
        this.options.fill = this.options.fill || '#b6edff';
        this.options.stroke = this.options.stroke || '#83bacc';
        this.options.stroke_width = this.options.stroke_width || 1;
        this.module_data = {
            name:  this.options.label,
            type: this.options.label,
            description: this.options.description,
            options: {}
        };

        this.stage = layer.getStage();
        this.shape = this.build(this.options);
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

    ModuleShape.prototype.removeField = function(field_shape)
    {
        var field_idx = this.fields.indexOf(field_shape);
        if (field_idx !== false) {
            this.fields.splice(field_idx, 1);
            for (var i = 0; i < this.fields.length; i++) {
                this.adoptField(this.fields[i], i);
            }
        }
    };

    ModuleShape.prototype.addField = function(field_shape)
    {
        field_shape.options.onSelected = this.onFieldSelected.bind(this);
        field_shape.options.onDeselected = this.options.onDeselected;
        this.fields.push(field_shape);
        this.shape.add(field_shape.shape);
        this.adoptField(field_shape, this.fields.length - 1);
        MIN_HEIGHT = FIELD_HEIGHT + (this.fields.length + 1) * FIELD_HEIGHT;
        this.onFieldSelected(field_shape);
    };

    ModuleShape.prototype.adoptField = function(field_shape, index)
    {
        var main_shape = this.shape.find('.main_shape')[0];
        field_shape.inheritModuleBounds(main_shape, index);
    };

    ModuleShape.prototype.setName = function(name)
    {
        this.module_data.name = name;
        var label = this.shape.find('.main_label')[0];
        if (this.options.type === 'aggregate') {
            label.setText('<<'+this.module_data.name+'>>');
        } else {
            label.setText(this.module_data.name);
        }
    };

    ModuleShape.prototype.setDescription = function(description)
    {
        this.module_data.description = description;
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

    ModuleShape.prototype.build = function(options)
    {
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
                var shape_w = rectangle.width();
                var shape_h = rectangle.height();

                if (pos.x <= 0) { pos.x = 0; }
                if (pos.x + shape_w >= stage_w) { pos.x = stage_w - shape_w; }
                if (pos.y <= 0) { pos.y = 0; }
                if (pos.y + shape_h >= stage_h) { pos.y = stage_h - shape_h; }

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
                return false;
            } else {
                that.options.onDeselected(that);
                return false;
            }
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

        this.addAnchor(group, 0, 0, 'nw');
        this.addAnchor(group, MIN_WIDTH, 0, 'ne');

        this.addAnchor(group, 0, MIN_HEIGHT, 'sw');
        this.addAnchor(group, MIN_WIDTH, MIN_HEIGHT, 'se');

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
            radius: 5,
            name: name,
            draggable: true,
            dragOnTop: false
        });

        anchor.on('dragmove', function() {
            var layer = this.getLayer();
            that.update(this);
            layer.draw();
        });
        anchor.on('mousedown touchstart', function(event) {
            event.cancelBubble = true;
            group.setDraggable(false);
            this.moveToTop();
        });
        anchor.on('dragend', function() {
            var layer = this.getLayer();
            group.setDraggable(true);
            layer.draw();
        });
        // add hover styling
        anchor.on('mouseover', function(event) {
            event.cancelBubble = true;
            var layer = this.getLayer();
            document.body.style.cursor = name + '-resize';
            this.setOpacity(1);
            layer.draw();
        });
        anchor.on('mouseout', function() {
            var layer = this.getLayer();
            document.body.style.cursor = 'default';
            this.setOpacity(0.5);
            layer.draw();
        });
        anchor.on('mouseup', function() {
            group.setDraggable(true);
        });

        group.add(anchor);
    };

    ModuleShape.prototype.update = function(active_anchor)
    {
        var group = active_anchor.getParent();

        var top_left = group.find('.nw')[0];
        var top_right = group.find('.ne')[0];
        var bottom_right = group.find('.se')[0];
        var bottom_left = group.find('.sw')[0];
        var shape = group.find('.main_shape')[0];
        var label = group.find('.main_label')[0];

        var anchor_x = active_anchor.x();
        var anchor_y = active_anchor.y();

        // update anchor positions
        switch (active_anchor.name()) {
            case 'nw':
                top_right.setY(anchor_y);
                bottom_left.setX(anchor_x);
                if (anchor_x > top_right.getX() - MIN_WIDTH) {
                    active_anchor.setX(top_right.getX() - MIN_WIDTH);
                    bottom_left.setX(top_right.getX() - MIN_WIDTH);
                }
                if (anchor_y > bottom_left.getY() - MIN_HEIGHT) {
                    active_anchor.setY(bottom_left.getY() - MIN_HEIGHT);
                    top_right.setY(bottom_left.getY() - MIN_HEIGHT);
                }
                break;
            case 'ne':
                top_left.setY(anchor_y);
                bottom_right.setX(anchor_x);
                if (anchor_x < top_left.getX() + MIN_WIDTH) {
                    active_anchor.setX(top_left.getX() + MIN_WIDTH);
                    bottom_right.setX(top_left.getX() + MIN_WIDTH);
                }
                if (anchor_y > bottom_left.getY() - MIN_HEIGHT) {
                    active_anchor.setY(bottom_left.getY() - MIN_HEIGHT);
                    top_left.setY(bottom_left.getY() - MIN_HEIGHT);
                }
                break;
            case 'se':
                bottom_left.setY(anchor_y);
                top_right.setX(anchor_x);
                if (anchor_x < bottom_left.getX() + MIN_WIDTH) {
                    active_anchor.setX(bottom_left.getX() + MIN_WIDTH);
                    top_right.setX(bottom_left.getX() + MIN_WIDTH);
                }
                if (anchor_y < top_left.getY() + MIN_HEIGHT) {
                    active_anchor.setY(top_left.getY() + MIN_HEIGHT);
                    bottom_left.setY(top_left.getY() + MIN_HEIGHT);
                }
                break;
            case 'sw':
                bottom_right.setY(anchor_y);
                top_left.setX(anchor_x);
                if (anchor_x > top_right.getX() - MIN_WIDTH) {
                    active_anchor.setX(top_right.getX() - MIN_WIDTH);
                    top_left.setX(top_right.getX() - MIN_WIDTH);
                }
                if (anchor_y < top_left.getY() + MIN_HEIGHT) {
                    active_anchor.setY(top_left.getY() + MIN_HEIGHT);
                    bottom_right.setY(top_left.getY() + MIN_HEIGHT);
                }
                break;
        }

        shape.setPosition(top_left.getPosition());
        label.setPosition(top_left.getPosition());

        var width = top_right.x() - top_left.x();
        var height = bottom_left.y() - top_left.y();
        if(width && height) {
            shape.setSize({width:width, height: height});
            label.setWidth(width);
            for (var i = 0; i < this.fields.length; i++) {
                this.adoptField(this.fields[i], i);
            }
            for(var i = 0; i < this.connections.length; i++) {
                this.connections[i].connect();
            }
        }
    };

    if (!export_to.honeybee) {
        export_to.honeybee = { wizard: { } };
    }

    export_to.honeybee.wizard.ModuleShape = ModuleShape;
})($(window));
