# coding=utf-8
# --------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
#
# Code generated by Microsoft (R) AutoRest Code Generator.
# Changes may cause incorrect behavior and will be lost if the code is
# regenerated.
# --------------------------------------------------------------------------

from .resource import Resource


class Product(Resource):
    """Product

    :param str id: Resource Id
    :param str type: Resource Type
    :param dict tags:
    :param str location: Resource Location
    :param str name: Resource Name
    :param str provisioning_state:
    :param str provisioning_state_values: Possible values include:
     'Succeeded', 'Failed', 'canceled', 'Accepted', 'Creating', 'Created',
     'Updating', 'Updated', 'Deleting', 'Deleted', 'OK'
    """ 

    _attribute_map = {
        'id': {'key': 'id', 'type': 'str'},
        'type': {'key': 'type', 'type': 'str'},
        'tags': {'key': 'tags', 'type': '{str}'},
        'location': {'key': 'location', 'type': 'str'},
        'name': {'key': 'name', 'type': 'str'},
        'provisioning_state': {'key': 'properties.provisioningState', 'type': 'str', 'flatten': True},
        'provisioning_state_values': {'key': 'properties.provisioningStateValues', 'type': 'str', 'flatten': True},
    }

    def __init__(self, id=None, type=None, tags=None, location=None, name=None, provisioning_state=None, provisioning_state_values=None):
        super(Product, self).__init__(id=id, type=type, tags=tags, location=location, name=name)
        self.provisioning_state = provisioning_state
        self.provisioning_state_values = provisioning_state_values
