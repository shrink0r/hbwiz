define([
    "jquery"
], function($) {

    "use strict";

    var FieldForm = function(element, options)
    {
        var noop = function() {};

        this.$element = $(element);

        this.options = $.extend({}, options || {});
        this.options.onFieldChanged = this.options.onFieldChanged || noop;

        this.$container = $(this.options.container);
        this.$input_name = this.$element.find('.input-field-name');
        this.$input_description = this.$element.find('.input-field-description');
        this.$option_trigger = this.$element.find('.options-trigger');
        this.$flip_wrapper = this.$element.find('.flip-container');
        this.current_shape = null;

        this.init();
    };

    FieldForm.prototype.constructor = FieldForm;

    FieldForm.prototype.init = function()
    {
        var that = this;

        this.$container.append(this.$element);

        this.$option_trigger.click(function() {
            that.$flip_wrapper.toggleClass('flip');

            that.adoptContentHeight();
        });

        this.$element.find('.field-property').change(function() {
            var input = $(this);
            if (that.current_shape) {
                that.current_shape.setProperty(input.attr('name'), input.val());
                that.options.onFieldChanged(input, input.attr('name'));
            }
        });

        this.$element.find('.field-option').change(function() {
            var input = $(this);
            if (that.current_shape) {
                if (input.attr('type') === 'checkbox') {
                    that.current_shape.setOption(input.attr('name'), input.is(':checked'));
                } else {
                    that.current_shape.setOption(input.attr('name'), input.val());
                }
                that.options.onFieldChanged(input, input.attr('name'));
            }
        });
    };

    FieldForm.prototype.show = function(shape)
    {
        this.current_shape = shape;

        this.$element.find('.field-property').each(function(idx, $input) {
            $input = $($input);
            var name = $input.attr('name');
            if (shape.field_data[name]) {
                $input.val(shape.field_data[name]);
            } else {
                $input.val('');
            }
        });

        this.$element.find('.field-option').each(function(idx, $input) {
            $input = $($input);
            var name = $input.attr('name');
            if (shape.field_data.options[name]) {
                if ($input.attr('type') === 'checkbox') {
                    $input.prop('checked', shape.field_data.options[name]);
                } else {
                    $input.val(shape.field_data.options[name]);
                }
            } else {
                if ($input.attr('type') === 'checkbox') {
                    $input.prop('checked', false);
                } else {
                    $input.val('');
                }
            }
        });

        this.$input_name.val(shape.field_data.name);
        this.$input_description.val(shape.field_data.description);
        this.$element.show();

        this.adoptContentHeight();
    };

    FieldForm.prototype.hide = function(shape)
    {
        this.$element.hide();
        this.$flip_wrapper.removeClass('flip');
        this.current_shape = null;
    };

    FieldForm.prototype.adoptContentHeight = function()
    {
        if (this.$flip_wrapper.hasClass('flip')) {
            this.$flip_wrapper.height(
                this.$flip_wrapper.find('.back .panel').height() + 52
            );
        } else {
            this.$flip_wrapper.height(
                this.$flip_wrapper.find('.front .panel').height() + 52
            );
        }
    };

    return FieldForm;
});
