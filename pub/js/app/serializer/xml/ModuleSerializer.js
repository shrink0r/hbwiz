define([
    "jquery",
    "vkbeautify",
    "app/serializer/ModuleDataHolder"
], function(
    $,
    vkbeautify,
    ModuleDataHolder
) {

    "use strict";

    var ModuleSerializer = function(options)
    {
        this.options = $.extend({}, options || {});
    };

    ModuleSerializer.prototype.constructor = ModuleSerializer;

    ModuleSerializer.prototype.asString = function(module_data)
    {
        var xml_doc = document.implementation.createDocument('', 'module_schema');
        var reference_definitions_node = xml_doc.createElement('reference_definitions');
        var aggregate_definitions_node = xml_doc.createElement('aggregate_definitions');

        var scheme_node = xml_doc.documentElement;
        var serializer = new XMLSerializer();

        var reference_definitions = null;
        var aggregate_definitions = null;
        var referenced_module = null;
        var aggregate_module = null;
        var has_references = false;
        var has_aggregates = false;
        var module_name = null;

        xml_doc.xmlVersion = '1.0';

        scheme_node.setAttribute('namespace', 'Honeybee\\Domain');
        scheme_node.appendChild(
            this.createModuleNode(xml_doc, module_data, 'module_definition')
        );

        reference_definitions = ModuleDataHolder.getReferences(module_data);
        aggregate_definitions = ModuleDataHolder.getAggregates(module_data);

console.log(reference_definitions);
console.log(aggregate_definitions);

        for (module_name in reference_definitions) {
            referenced_module = reference_definitions[module_name];
            reference_definitions_node.appendChild(
                this.createModuleNode(xml_doc, referenced_module, 'reference_definition')
            );
            has_references = true;
        }

        for (module_name in aggregate_definitions) {
            aggregate_module = aggregate_definitions[module_name];
            aggregate_definitions_node.appendChild(
                this.createModuleNode(xml_doc, aggregate_module, 'aggregate_definition')
            );
            has_aggregates = true;
        }

        if (has_aggregates) {
            scheme_node.appendChild(aggregate_definitions_node);
        }
        if (has_references) {
            scheme_node.appendChild(reference_definitions_node);
        }

        return vkbeautify.xml(
            '<?xml version="1.0" encoding="UTF-8" ?>\n' +
            serializer.serializeToString(xml_doc)
        );
    };

    ModuleSerializer.prototype.createModuleNode = function(xml_doc, module_data, node_name)
    {
        var module_node = xml_doc.createElement(node_name);
        var fields_data = module_data.fields;
        var fields_node = null;
        var options_node = null;
        var description_node = null;

        module_node.setAttribute('name', module_data.module.name);

        if (module_data.module.description) {
            description_node = xml_doc.createElement('description');
            description_node.appendChild(
                xml_doc.createTextNode(module_data.module.description)
            );
            module_node.appendChild(description_node);
        }

        options_node = this.createOptionsNode(xml_doc, module_data.module.options);
        if (options_node) {
            module_node.appendChild(options_node);
        }

        fields_node = this.createFieldsNode(xml_doc, fields_data);
        if (fields_node) {
            module_node.appendChild(fields_node);
        }

        return module_node;
    };

    ModuleSerializer.prototype.createFieldsNode = function(xml_doc, fields_data)
    {
        var fields_node = xml_doc.createElement('fields');
        var has_fields = false;
        var i = 0;

        for (; i < fields_data.length; i++) {
            fields_node.appendChild(
                this.createFieldNode(xml_doc, fields_data[i])
            );

            if (!has_fields) {
                has_fields = true;
            }
        }

        return has_fields ? fields_node : null;
    };

    ModuleSerializer.prototype.createFieldNode = function(xml_doc, field_data)
    {
        var field_node = null;
        var options_node = null;
        var description_node = null;

        field_node = xml_doc.createElement('field');
        field_node.setAttribute('name', field_data.name);
        field_node.setAttribute('type', field_data.type);

        if (field_data.description) {
            description_node = xml_doc.createElement('description');
            description_node.appendChild(
                xml_doc.createTextNode(field_data.description)
            );
            field_node.appendChild(description_node);
        }

        options_node = this.createOptionsNode(xml_doc, field_data.options);
        if (options_node) {
            field_node.appendChild(options_node);
        }

        return field_node;
    };

    ModuleSerializer.prototype.createOptionsNode = function(xml_doc, options_data)
    {
        var options_node = null;
        var option_node = null;
        var option_value = null;
        var option_name = null;
        var has_options = false;

        options_node = xml_doc.createElement('options');
        for (option_name in options_data) {
            option_node = xml_doc.createElement('option');
            options_node.appendChild(option_node);
            option_value = options_data[option_name];

            if ($.isArray(option_value) || option_value instanceof Object) {
                option_node.appendChild(
                    this.createOptionsNode(xml_doc, option_value)
                );
            } else {
                option_node.appendChild(
                    xml_doc.createTextNode(options_data[option_name])
                );
            }

            if (!/\d+/.test(option_name)) {
                option_node.setAttribute('name', option_name);
            }

            if (!has_options) {
                has_options = true;
            }
        }

        return has_options ? options_node : null;
    };

    return ModuleSerializer;
});
