define([
    "jquery",
    "vkbeautify"
], function(
    $,
    vkbeautify
) {

    "use strict";

    var ModuleDataHolder = function(data)
    {
        this.module = {};
        this.aggregates = [];
        this.references = [];
        this.fields = [];

        if (data.module) {
            this.module = data.module;
        }
        if (data.aggregates) {
            this.aggregates = data.aggregates;
        }
        if (data.references) {
            this.references = data.references;
        }
        if (data.fields) {
            this.fields = data.fields;
        }
    };

    ModuleDataHolder.prototype.constructor = ModuleDataHolder;

    ModuleDataHolder.createFromShape = function(module_shape)
    {
        var module_data = module_shape.module_data;
        var connections = module_shape.connections;
        var aggregate_data = [];
        var reference_data = [];
        var module_name;
        var i;

        for (i = 0; i < connections.length; i++) {
            if (connections[i].source === module_shape) {
                if (connections[i].field.field_data.type === 'reference') {
                    module_name = connections[i].target.module_data.name;
                    module_name = "\\Honeybee\\Domain\\"+module_name+"\\"+module_name+"Module";
                    reference_data.push(
                        new ModuleDataHolder({
                            fields: [],
                            module: {
                                label: "ReferenceModule",
                                name:  connections[i].target.module_data.name + 'Reference',
                                type: 'reference',
                                description: "Referenced module description: " + connections[i].target.module_data.description,
                                options: { module: module_name, id_field: "identifier" }
                            },
                            aggregates: [],
                            references: []
                        })
                    );
                } else {
                    aggregate_data.push(
                        ModuleDataHolder.createFromShape(connections[i].target)
                    );
                }
            }
        }

        return new ModuleDataHolder({
            fields: ModuleDataHolder.mapFieldData(module_shape.fields),
            module: module_data,
            aggregates: aggregate_data,
            references: reference_data
        });
    };

    ModuleDataHolder.mapFieldData = function(fields)
    {
        var fields_data = [];
        var field_data, connections, n, i;

        for (n = 0; n < fields.length; n++) {
            field_data = fields[n].field_data;
            connections = fields[n].connections;

            switch (field_data.type) {
                case 'reference':
                    field_data.options.references = [];
                    for (i = 0; i < connections.length; i++) {
                        if (connections[i].field === fields[n]) {
                            field_data.options.references.push(
                                connections[i].target.module_data.name
                            );
                        }
                    }
                    break;
                case 'aggregate':
                    field_data.options.aggregates = [];
                    for (i = 0; i < connections.length; i++) {
                        if (connections[i].field === fields[n]) {
                            field_data.options.aggregates.push(
                                fields[n].connections[i].target.module_data.name
                            );
                        }
                    }
                    break;
                default:
                    // noting todo atm
            }
            fields_data.push(field_data);
        }

        return fields_data;
    };

    ModuleDataHolder.getReferences = function(module_data, found_references)
    {
        var i = 0, referenced_module = null;
        found_references = found_references || {};

        for (; i < module_data.references.length; i++) {
            referenced_module = module_data.references[i];
            found_references[referenced_module.module.name] = referenced_module;
            ModuleDataHolder.getReferences(referenced_module, found_references);
        }

        return found_references;
    };

    ModuleDataHolder.getAggregates = function(module_data, found_aggregates)
    {
        var i = 0, aggregate_module = null;
        found_aggregates = found_aggregates || {};

        for (; i < module_data.aggregates.length; i++) {
            aggregate_module = module_data.aggregates[i];
            found_aggregates[aggregate_module.module.name] = aggregate_module;
            ModuleDataHolder.getAggregates(aggregate_module, found_aggregates);
        }

        return found_aggregates;
    };

    return ModuleDataHolder;
});
