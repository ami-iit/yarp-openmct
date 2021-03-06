# Add a New Vector Collection Port and the Respective Domain Object in the Visualizer

## Overview
You can add a new telemetry entry under the folder "Vector Collections Telemetry" in the left pane of the visualizer workspace containing what we refer to as the telemetry domain objects. This new entry will read from a Yarp port publishing `BipedalLocomotion.YarpUtilities.VectorsCollection` type data. This can be done by adding:
- the respective port configuration entry in the `portInConfig` section of the JSON (**J**ava**S**cript **O**bject **N**otation[^1]) configuration defined in [`conf/servers.json`](../conf/servers.json).
  ```json
  {
      ...,
      "portInConfig": {
          ...,
          "<telemetry-key>": {
              "yarpName": "<yarp-output-port-name-publishing-the-data-to-visualize>",
              "localName": "<arbitrary-port-name-collecting-the-data-for-the-telemetry-server>",
              "portType": "bottle",
              "parser": {
                  "type": "internal",
                  "outputFormat": "vectorCollection"
              }
          }
      }
  }
  ```
- the respective telemetry entry in the dictionary defining the telemetry metadata used for plotting the data in the main canvas (central pane) when we select a telemetry domain object or used for an Overlay Plot previously added to the workspace on the left pane. The user defined dictionary is in [`conf/dictionaryVectorCollectionsTelemetry.json`](../conf/dictionaryVectorCollectionsTelemetry.json).
  ```json
  {
    "name": "<telemetry folder name>",
    "key": "vectorCollectionsTelemetry",
    "telemetryEntries": [
      {
        "name": "<telemetry entry name>",
        "key": "<same telemetry entry key matching the one used in the portInConfig section>",
        "type": "yarpopenmct.veccollectionmap",
        "values": {
          "range": {
            "name": "<vertical axis legend pattern>",
            "unit": "<SI unit>",
            "format": "[float|image]"
          },
          "domain": {
            "name": "<horizontal axis legend>"
          }
        }
      }
    ]
  }
  ```

### Note
In the above templates, you should interpret the field values as follows:
- `"<xxx>"` : an explanation of which you should set as value.
- `"xxx"` : the exact required string value. Often this is due to a temporary limitation.
- `"[xxx|yyy]"` : optional strings.

## Parameter Detailed Description

### "portInConfig" in `conf/servers.json`

  | Parameter | Type | Description | Allowed Values |
  | --- | --- | --- | --- |
  | `yarpName` | string | The source port publishing the Vector Collections formatted data to visualize. | Any Vector Collections port |
  | `localName` | string | The destination port to be connected to the source port, and from which the telemetry server shall read the data. | Any |
  | `portType` | string | The source port type from Yarp perspective, typically "bottle" or "image". | `bottle`[^2] |
  | `parser.type` | string | The parsing is either implemented within the `ICubTelemetry` class ("internal"), either relayed to a Yarp device ("yarpDevice"). | `internal`[^3] |
  | `parser.outputFormat` | string | Conditional field applicable for the "internal" parser type. The port data format, as well as the parser output format (flattened JSON object) are derived either from the signal either from the dynamic vector collection format. | `vectorCollection`[^4] |

[^1]: https://www.json.org/json-en.html
[^2]: Ports publishing data of type `BipedalLocomotion.YarpUtilities.VectorsCollection` are always of type "bottle".
[^3]: Currently, the only supported parser `"type"` is `"internal"`. In the future, we could select parsers implemented by Yarp devices once these are ported through Yarp Javascript bindings.
[^4]: For now, only the telemetry entries whose data is read from `BipedalLocomotion.YarpUtilities.VectorsCollection` data type can be added through these configuration files, without requiring source code changes.

The key `<telemetry-key>` uniquely identifies the port added in the "portInConfig" section element. This key associates the port with the configuration parameters in the `conf/dictionaryVectorCollectionsTelemetry.json` dictionary described below.

### `conf/dictionaryVectorCollectionsTelemetry.json` Dictionary

#### Mandatory Parameters

  | Parameter | Type | Description | Allowed Values |
  | --- | --- | --- | --- |
  | `name` | string | Name of the telemetry folder containing the added Vector Collection telemetry entries, to be displayed in the visualizer left pane. | Any |
  | `key` | string | A unique key identifying the dictionary associated to the folder (one dictionary per telemetry folder) | `vectorCollectionsTelemetry`[^5] |

[^5]: For now, the user cannot create a new telemetry folder. All new Vector Collection telemetry entries shall be automatically added to the folder identified by the `vectorCollectionsTelemetry` key. The user can only change the displayed name.

`telemetryEntries` is an array of objects, each of them describing the telemetry fetching and plotting parameters of a single port referenced in `conf/servers.json`$\rightarrow$`portInConfig`: `<telemetry-key>`.

  | Parameter | Type | Description | Allowed Values |
  | --- | --- | --- | --- |
  | `name` | string | Name of the telemetry domain object associated to the added Yarp port, to be displayed in the visualizer left pane, under the telemetry folder. | Any |
  | `key` | string | Unique key identifying the telemetry domain object. | Same `<telemetry-key>` referenced in `conf/servers. |
  | `type` | string | The telemetry entry name associated to the added Yarp port. | `yarpopenmct.veccollectionmap`[^6] |
  | `values` | object | Describes the properties of the data associated to the plot vertical and horizontal axes. Overriding the default values is optional. If you wish to use the default values, set this field to `{}`. | `[{}\|{"range":...,"domain":...}]`, refer to optional parameters. |

[^6]: Only domain object type `yarpopenmct.veccollectionmap` is available for Vector Collection telemetry data for now. :waring: Advanced users can edit the properties for this type in [openmctStaticServer/plugins/conf/domainObjTypes.js](../openmctStaticServer/plugins/conf/domainObjTypes.js) :warning:.

#### Optional Parameters

`values.range` describes the properties of the data associated to the plot **vertical** axis: legend, unit, etc.

  | Parameter | Type | Description | Allowed Values |
  | --- | --- | --- | --- |
  | `name` | string | Vertical axis legend. This can either be a simple string, either a pattern including predefined variables resolved by the visualizer application. | `[letters\|numbers\|brackets\|_\|-\|+\|${_signalName}\|${_componentIndex}]`[^7] |
  | `unit` | string | The SI unit of the data values, e.g. `km`, `seconds`. | Any or `n/a` if the data has a collection of mixed units |
  | `format` | string | A specific format identifier, mapping to a formatter. The list of available formatters is pre-defined. New formatters can be made available through feature request. In the future, creating custom formatters shall be possible for advanced users. | `[float\|image]` |

[^7]: For instance the pattern `${_signalName}[${_componentIndex}]`.

`values.domain` describes the properties of the data associated to the plot **horizontal** axis: legend.

  | Parameter | Type | Description | Allowed Values |
  | --- | --- | --- | --- |
  | `name` | string | Horizontal axis legend. | Any |


## Default Values for `conf/dictionaryVectorCollectionsTelemetry.json` Dictionary

The default values for the only domain type supported so far in the context of user defined telemetry entries, `yarpopenmct.veccollectionmap`, is:
```json
{
  "range": {
    "name": "${_signalName}[${_componentIndex}]",
    "unit": "n/a",
    "format": "float"
  },
  "domain": {
    "name": "Timestamp"
  }
}
```
If these values suit you, you can use the setting:
```js
  "values": {}
```


## Example

https://github.com/ami-iit/yarp-openmct/blob/8c0aa66991592e312fc675e7099467713733d07d/conf/servers.json#L81-L89

https://github.com/ami-iit/yarp-openmct/blob/8c0aa66991592e312fc675e7099467713733d07d/conf/dictionaryVectorCollectionsTelemetry.json#L1-L17


### Adding a Second Port to the same Telemetry Folder "Vector Collections Telemetry"

<p align='center'>
<img src="../images/newVectorCollectionTelemetryDomainElementEntry.png" width="80%">
</p>

Let's assume that a single port is already connected to the visualiser telemetry entry "Walking Controller Logger 1", and we wish to add a second entry "Walking Controller Logger 2" connected for instane to the same Yarp port, as illustrated in the figure above. We would then need the configuration depicted below:

[servers.json](../conf/servers.json):
```json
{
    ...,
    "portInConfig": {
        ...,
        "walkingController.logger.1": {
            "yarpName": "/walking-coordinator/logger/data:o",
            "localName": "${this.localYarpPortPrefix}/walking-coordinator-logger-1/data:i",
            "portType": "bottle",
            "parser": {
                "type": "internal",
                "outputFormat": "vectorCollection"
            }
        },
        "walkingController.logger.2": {
            "yarpName": "/walking-coordinator/logger/data:o",
            "localName": "${this.localYarpPortPrefix}/walking-coordinator-logger-2/data:i",
            "portType": "bottle",
            "parser": {
                "type": "internal",
                "outputFormat": "vectorCollection"
            }
        }
    }
}
```

[dictionaryVectorCollectionsTelemetry.json](../conf/dictionaryVectorCollectionsTelemetry.json):
```json
{
  "name": "Vector Collections Telemetry",
  "key": "vectorCollectionsTelemetry",
  "telemetryEntries": [
    {
      "name": "Walking Controller Logger 1",
      "key": "walkingController.logger.1",
      "type": "yarpopenmct.veccollectionmap",
      "values": {}
    },
    {
      "name": "Walking Controller Logger 2",
      "key": "walkingController.logger.2",
      "type": "yarpopenmct.veccollectionmap",
      "values": {}
    }
  ]
}
```
Typically, since we have duplicated the port data onto two telemetry entries, we can display two vector signals of that Vector Collection in the same Overlay Plot (refer to issue [#17](https://github.com/ami-iit/yarp-openmct/issues/17) and comment https://github.com/ami-iit/yarp-openmct/issues/45#issuecomment-1136066988).
