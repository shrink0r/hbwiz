(function($window, export_to)
{
    export_to = export_to || $window[0];

    var FieldForm = function(element, options)
    {
        var noop = function() {};

        this.$element = $(element);
        this.$input_name = this.$element.find('.input-field-name');
        this.$input_description = this.$element.find('.input-field-description');
        this.current_shape = null;

        this.options = $.extend({}, options || {});
        this.options.onFieldChanged = this.options.onFieldChanged || noop;

        this.init();
    };

    FieldForm.prototype.constructor = FieldForm;

    FieldForm.prototype.init = function()
    {
        var that = this;
        this.$input_name.change(function() {
            if (that.current_shape) {
                that.current_shape.setName(that.$input_name.val());
                that.options.onFieldChanged(that.$input_name, 'name');
            }
        });

        this.$input_description.change(function() {
            if (that.current_shape) {
                that.current_shape.setDescription(that.$input_description.val());
                that.options.onFieldChanged(that.$input_description, 'description');
            }
        });
    };

    FieldForm.prototype.show = function(shape)
    {
        this.current_shape = shape;
        this.$input_name.val(shape.field_data.name);
        this.$input_description.val(shape.field_data.description);
        this.$element.show();
    };

    FieldForm.prototype.hide = function(shape)
    {
        this.$element.hide();
        this.current_shape = null;
    };

    if (!export_to.honeybee) {
        export_to.honeybee = { wizard: { } };
    }

    export_to.honeybee.wizard.FieldForm = FieldForm;
})($(window));
