(function($window, export_to)
{
    export_to = export_to || $window[0];

    var FieldShape = function(layer, name, options)
    {
        var noop = function() {};
        this.name = name;

        this.options = $.extend({}, options || {});
        this.options.onSelected = this.options.onSelected || noop;
        this.options.onDeselected = this.options.onDeselected || noop;
        this.options.width = this.options.width || 150;
        this.options.height = this.options.height || 75;
        this.options.fill = this.options.fill || '#a5dcee';
        this.options.stroke = this.options.stroke || '#83bacc';
        this.options.stroke_width = this.options.stroke_width || 1;
        this.field_data = {
            name: 'no name',
            type: this.options.label,
            description: this.options.description,
            options: {}
        };

        this.layer = layer;
        this.stage = layer.getStage();
        this.shape = this.build(this.options);
        this.selected = false;
    };

    FieldShape.prototype.constructor = FieldShape;

    FieldShape.prototype.setName = function(name)
    {
        this.field_data.name = name;
        var label = this.shape.find('.name_label')[0];
        label.setText(this.field_data.name);
    };

    FieldShape.prototype.setDescription = function(description)
    {
        this.field_data.description = description;
    };

    FieldShape.prototype.select = function()
    {
        this.selected = true;
        var rectangle = this.shape.find('.main_shape')[0];
        rectangle.setStrokeWidth(3);
    };

    FieldShape.prototype.inheritModuleBounds = function(module_shape, field_index)
    {
        var field_shape_main = this.shape.find('.main_shape')[0];
        var type_label = this.shape.find('.type_label')[0];
        var name_label = this.shape.find('.name_label')[0];
        field_shape_main.setWidth(module_shape.width());
        field_shape_main.setHeight(30);
        this.shape.setPosition({
            x: module_shape.getX(),
            y: module_shape.getY() + field_shape_main.height() * (field_index + 1)
        });
        var label_width = module_shape.width() / 2;
        type_label.setWidth(label_width);
        type_label.setX(label_width);
        name_label.setWidth(label_width);
    };

    FieldShape.prototype.deselect = function()
    {
        this.selected = false;
        var rectangle = this.shape.find('.main_shape')[0];
        rectangle.setStrokeWidth(1);
    };

    FieldShape.prototype.destroy = function()
    {
        this.shape.remove();
        // @todo remove event listeners
    };

    FieldShape.prototype.build = function(options)
    {
        var that = this;
        var stage_h = this.stage.height();
        var stage_w = this.stage.width();

        var group = new Kinetic.Group({
            x: options.x || 20,
            y: options.y || 20,
            dragOnTop: false
        });

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

        group.on('click', function(event) {
            event.cancelBubble = true;
            if (!that.selected) {
                that.options.onSelected(that);
            } else {
                that.options.onDeselected(that);
            }
        });

        group.add(rectangle);

        var name_label = new Kinetic.Text({
            name: 'name_label',
            x: 0,
            y: 0,
            width: 100,
            height: 30,
            fontFamily: 'Calibri',
            fontSize: 18,
            padding: 5,
            fill: 'black',
            text: this.field_data.name
        });
        group.add(name_label);

        var type_label = new Kinetic.Text({
            name: 'type_label',
            x: 100,
            y: 0,
            width: 100,
            height: 30,
            fontFamily: 'Calibri',
            fontSize: 18,
            padding: 5,
            fill: 'black',
            text: this.field_data.type
        });
        group.add(type_label);

        return group;
    }

    if (!export_to.honeybee) {
        export_to.honeybee = { wizard: { } };
    }

    export_to.honeybee.wizard.FieldShape = FieldShape;
})($(window));