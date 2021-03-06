define([
    "jquery",
    "app/Application"
], function($, Application) {

    "use strict";

    // url parameter used to make sure our templates aren't cached atm
    var cache_buster = "?cb=" + (new Date()).getTime();
    // create a new application instance, hence start the hb-module-wizard
    new Application(
        $(document.body),
        {
            'canvas_stage': '#kjs-stage-container',
            'data_urls': {
                'modules': 'data/Modules.json' + cache_buster,
                'fields': 'data/Fields.json' + cache_buster
            }
        },
        function() { console.log('Application loaded/ready!'); }
    );

}, function (err) {
// err has err.requireType (timeout, nodefine, scripterror)
// and err.requireModules (an array of module Ids/paths)
});
