define([
    "jquery",
    "app/CanvasController",
    "app/Toolbar",
    "app/form/ModuleForm",
    "app/form/FieldForm",
    "app/shape/ModuleShape",
    "app/shape/FieldShape",
    "tpl!templates/forms/module",
    "tpl!templates/forms/field"
], function(
    $, CanvasController, Toolbar,
    ModuleForm, FieldForm,
    ModuleShape, FieldShape,
    module_form_tpl, field_form_tpl
) {

    "use strict";

    var Application = function(element, options, ready_callback)
    {
        var that = this;
        var noop = function() {};
        var ready_trigger = null;

        this.$element = $(element);
        this.options = $.extend({}, options || {});

        this.canvas_controller = null;
        this.toolbars = {};
        this.forms = {};

        this.canvas_controller = this.createCanvasController();

        ready_trigger = function() {
            if (that.forms.module && that.forms.field) {
                (ready_callback || noop)();
            }
        };

        this.initModules(ready_trigger);
        this.initFields(ready_trigger);
    };

    Application.prototype.constructor = Application;

    Application.prototype.createCanvasController = function()
    {
        return new CanvasController(
            this.options.canvas_stage,
            {
                onShapeSelected: this.onCanvasShapeSelected.bind(this),
                onShapeDeselected: this.onCanvasShapeDeselected.bind(this)
            }
        );
    };

    Application.prototype.initModules = function(ready_callback)
    {
        var that = this;
        var module_key = null;
        var module_data = null;

        $.getJSON(this.options.data_urls.modules, function(modules) {
            that.toolbars.module = new Toolbar(
                '.toolbar-type-modules',
                modules,
                { name: 'modules', onItemDropped: that.onToolbarItemDropped.bind(that) }
            );

            that.forms.module = {};

            for (module_key in modules) {
                module_data = modules[module_key];
                module_data.name = module_key;
                that.forms.module[module_key] = new ModuleForm(
                    module_form_tpl(module_data),
                    {
                        name: 'module',
                        onFieldChanged: that.onFormFieldChanged.bind(that),
                        container: '.forms-panel'
                    }
                );
            }

            ready_callback();
        });
    };

    Application.prototype.initFields = function(ready_callback)
    {
        var that = this;

        $.getJSON(this.options.data_urls.fields, function(fields) {
            var field_key = null;

            that.toolbars.field = new Toolbar(
                '.toolbar-type-fields',
                fields,
                { name: 'fields', onItemDropped: that.onToolbarItemDropped.bind(that) }
            );

            that.forms.field = {};

            for (field_key in fields) {
                that.forms.field[field_key] = new FieldForm(
                    field_form_tpl(fields[field_key]),
                    {
                        name: 'field',
                        onFieldChanged: that.onFormFieldChanged.bind(that),
                        container: '.forms-panel'
                    }
                );
            }

            ready_callback();
        });
    };

    Application.prototype.onFormFieldChanged = function($input, name)
    {
        this.canvas_controller.layers.main.draw();
    };

    Application.prototype.onToolbarItemDropped = function(dropped_item)
    {
        this.canvas_controller.addShape(dropped_item);
    };

    Application.prototype.onCanvasShapeSelected = function(canvas_shape)
    {
        var shape_type = null;

        if (canvas_shape instanceof ModuleShape) {
            shape_type = canvas_shape.module_data.type;
            this.forms.module[shape_type].show(canvas_shape);

            if (canvas_shape.module_data.type === 'root') {
                $('.show-schema').show();
            }
        } else {
            shape_type = canvas_shape.field_data.type;
            this.forms.field[shape_type].show(canvas_shape);
        }
    };

    Application.prototype.onCanvasShapeDeselected = function(canvas_shape)
    {

        var shape_type = null;

        if (canvas_shape instanceof ModuleShape) {
            shape_type = canvas_shape.module_data.type;
            this.forms.module[shape_type].hide(canvas_shape);

            if (canvas_shape.module_data.type === 'root') {
                $('.show-schema').hide();
            }
        } else {
            shape_type = canvas_shape.field_data.type;
            this.forms.field[shape_type].hide(canvas_shape);
        }
    };

    return Application;
});
