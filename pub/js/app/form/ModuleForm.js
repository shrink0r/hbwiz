define([
    "jquery"
], function($) {

    "use strict";

    var ModuleForm = function(element, options)
    {
        var noop = function() {};

        this.$element = $(element);

        this.options = $.extend({}, options || {});
        this.options.onFieldChanged = this.options.onFieldChanged || noop;
        this.options.onSchemeViewDemanded = this.options.onSchemeViewDemanded || noop;

        this.$container = $(this.options.container);
        this.$input_name = this.$element.find('.input-module-name');
        this.$input_description = this.$element.find('.input-module-description');
        this.$option_trigger = this.$element.find('.options-trigger');
        this.$scheme_trigger = this.$element.find('.scheme-trigger');
        this.$flip_wrapper = this.$element.find('.flip-container');
        this.current_shape = null;

        this.init();
    };

    ModuleForm.prototype.constructor = ModuleForm;

    ModuleForm.prototype.init = function()
    {
        var that = this;

        this.$container.append(this.$element);

        this.$option_trigger.click(function() {
            that.$flip_wrapper.toggleClass('flip');

            that.adoptContentHeight();
        });

        this.$scheme_trigger.click(function() {
            that.options.onSchemeViewDemanded();
        });

        this.$element.find('.module-property').change(function() {
            var input = $(this);
            if (that.current_shape) {
                that.current_shape.setProperty(input.attr('name'), input.val());
                that.options.onFieldChanged(input, input.attr('name'));
            }
        });

        this.$element.find('.module-option').change(function() {
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

    ModuleForm.prototype.show = function(shape)
    {
        if (shape.module_data.type === 'AggregateModule') {
            this.$element.find('.option-root').hide();
        } else {
            this.$element.find('.option-root').show();
        }

        this.$element.find('.module-property').each(function(idx, $input) {
            $input = $($input);
            var name = $input.attr('name');
            if (shape.module_data[name]) {
                $input.val(shape.module_data[name]);
            } else {
                $input.val('');
            }
        });

        this.$element.find('.module-option').each(function(idx, $input) {
            $input = $($input);
            var name = $input.attr('name');
            if (shape.module_data.options[name]) {
                if ($input.attr('type') === 'checkbox') {
                    $input.prop('checked', shape.module_data.options[name]);
                } else {
                    $input.val(shape.module_data.options[name]);
                }
            } else {
                if ($input.attr('type') === 'checkbox') {
                    $input.prop('checked', false);
                } else {
                    $input.val('');
                }
            }
        });

        this.current_shape = shape;
        this.$input_name.val(shape.module_data.name);
        this.$input_description.val(shape.module_data.description);
        this.$element.show();

        this.adoptContentHeight();
    };

    ModuleForm.prototype.adoptContentHeight = function()
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

    ModuleForm.prototype.hide = function(shape)
    {
        this.$element.hide();
        this.$flip_wrapper.removeClass('flip');
        this.current_shape = null;
    };

    return ModuleForm;

});
