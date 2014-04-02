define([
    "jquery"
], function($) {

    "use strict";

    var ModuleForm = function(element, options)
    {
        var noop = function() {};

        this.$element = $(element);
        this.$input_name = this.$element.find('.input-module-name');
        this.$input_description = this.$element.find('.input-module-description');
        this.current_shape = null;

        this.options = $.extend({}, options || {});
        this.options.onFieldChanged = this.options.onFieldChanged || noop;

        this.init();
    };

    ModuleForm.prototype.constructor = ModuleForm;

    ModuleForm.prototype.init = function()
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

    ModuleForm.prototype.show = function(shape)
    {
        this.current_shape = shape;
        this.$input_name.val(shape.module_data.name);
        this.$input_description.val(shape.module_data.description);
        this.$element.show();
    };

    ModuleForm.prototype.hide = function(shape)
    {
        this.$element.hide();
        this.current_shape = null;
    };

    return ModuleForm;

});
