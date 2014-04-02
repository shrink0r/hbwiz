define([
    "jquery",
    "CanvasController",
    "Toolbar",
    "ModuleForm",
    "ModuleShape",
    "FieldForm",
    "FieldShape"
], function($, CanvasController, Toolbar, ModuleForm, ModuleShape, FieldForm, FieldShape) {

    "use strict";

    var Application = function(element, options)
    {
        this.$element = $(element);
        this.options = $.extend({}, options || {});
        this.canvas_controller = null;
        this.toolbars = {};
        this.forms = {};

        this.canvas_controller = this.createCanvasController();
        this.createToolbars();
        this.createForms();
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

    Application.prototype.createToolbars = function()
    {
        var that = this, toolbar_name, toolbar_options;
        for (toolbar_name in this.options.toolbars) {
            toolbar_options = this.options.toolbars[toolbar_name];
            $.getJSON(toolbar_options.items, (function() {
                var css_selector = toolbar_options.selector;
                var name = toolbar_name;

                return function(data) {
                    that.toolbars[name] = new Toolbar(
                        css_selector,
                        {
                            name: name,
                            items: data,
                            onItemDropped: that.onToolbarItemDropped.bind(that)
                        }
                    );
                }
            })());
        }
    };

    Application.prototype.createForms = function()
    {
        var that = this, form_name, form_options, form;
        var onFormFieldChanged = this.onFormFieldChanged.bind(this);
        for (form_name in this.options.forms) {
            form_options = this.options.forms[form_name];
            if (form_name == 'module') {
                form = new ModuleForm(
                    $(form_options.selector),
                    { name: form_name, onFieldChanged: onFormFieldChanged }
                );
            } else {
                form = new FieldForm(
                    $(form_options.selector),
                    { name: form_name, onFieldChanged: onFormFieldChanged }
                );
            }
            this.forms[form_name] = form;
        }
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
        if (canvas_shape instanceof ModuleShape) {
            this.forms.module.show(canvas_shape);
            if (canvas_shape.module_data.type === 'RootModule') {
                $('.show-schema').show();
            }
        } else {
            this.forms.field.show(canvas_shape);
        }
    };

    Application.prototype.onCanvasShapeDeselected = function(canvas_shape)
    {
        if (canvas_shape instanceof ModuleShape) {
            this.forms.module.hide(canvas_shape);
            if (canvas_shape.module_data.type === 'RootModule') {
                $('.show-schema').hide();
            }
        } else {
            this.forms.field.hide(canvas_shape);
        }
    };

    return Application;
});
