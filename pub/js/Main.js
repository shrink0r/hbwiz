define([
    "jquery",
    "foundation",
    "app/Application"
], function($, foundation, Application) {

    "use strict";

    // init zurb foundation
    $(document).foundation();

    // then setup the honeybee module wizard application
    new Application(
        $(document.body),
        {
            'canvas_stage': '#kjs-stage-container',
            'toolbars': {
                'modules': {
                    'selector': '.toolbar-type-modules',
                    'items': 'data/Modules.json'
                },
                'fields': {
                    'selector': '.toolbar-type-fields',
                    'items': 'data/Fields.json'
                }
            },
            'forms': {
                'field': {
                    'label': 'Field Properties',
                    'selector': '.field-properties-form'
                },
                'module': {
                    'label': 'Module Properties',
                    'selector': '.module-properties-form'
                }
            }
        }
    );

}, function (err) {
// err has err.requireType (timeout, nodefine, scripterror)
// and err.requireModules (an array of module Ids/paths)
});
