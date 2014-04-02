(function($window, export_to)
{
    // init zurb foundation
    $($window[0].document).foundation();

    // then setup the honeybee module wizard application
    var application = new export_to.honeybee.wizard.Application(
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
})($(window), window);
