# Yarp - Open MCT

An Open MCT and Yarp based iCub telemetry visualizer.

* [Introduction](#introduction)
* [Example](#example)
* [Dependencies](#dependencies)
* [Server Installation](#server-installation)
* [Client Installation](#client-installation)
* [How to Run the Server](#how-to-run-the-server)
* [How to Run the Client](#how-to-run-the-client)

## Introduction

The Yarp-OpenMCT tool is meant for visualizing and plotting telemetry data from iCub sensors, published over a Yarp network. It collects sensor data published on a predefined set of Yarp output ports opened by the Yarp Robot Interface and exposes that data on predefined telemetry nodes within the visualizer interface as vectors or scalar signals. The pipeline can be summarized as follows:
- A telemetry data server reads the data from a Yarp port, then available within the server as realtime data.
- The data is buffered in a FIFO queue of predefined depth, and in parallel streamed over a [Socket.IO](https://socket.io/docs/v4) connection to the registered visualizer client<sup id="a1">[1](#f1)</sup>.
- The data is accessible via the respective telemetry node in the visualizer interface, in the left-hand tree under the "+Create" button. Any object visible in that tree is referred to as a "Domain Object" in the Open MCT glossary.

All telemetry nodes exposing sensor measurements shall appear under the folder "iCub Telemetry". They can then be combined in workspace layouts at the user convenience.

The visualizer implementation is based on the [Open MCT](https://github.com/nasa/openmct) (Open Mission Control Technologies), open source, next-generation mission control framework for visualization of data on desktop and mobile devices. It is developed at NASA's Ames Research Center, and is being used by NASA for data analysis of spacecraft missions, as well as planning and operation of experimental rover systems.


## Example

For instance, in the context of a simulation on Gazebo, the iCub head IMU measurements read on the port `/icubSim/inertial` are sent over a local network to the visualization tool client and exposed as a telemetry node, referred to as a "Domain Object" in the Open MCT nomenclature. The telemetry node wraps all the 12 measurement components:
- The orientation estimation Roll, Pitch and Yaw.
- The accelerometer measuremtents x, y, z components.
- The gyroscope measuremtents x, y, z components.
- The magnetometer measuremtents x, y, z components.

## Dependencies

Server dependencies:
- [YARP](https://github.com/robotology/yarp): Middleware for handling the communication with the robot.
- [node.js](https://nodejs.org/en/): Asynchronous event-driven JavaScript runtime, designed to build scalable network applications.
- [npm](https://www.npmjs.com/): Node package manager.
- [YarpJS](https://github.com/robotology/yarp.js): Yarp Javascript bindings
- [Open MCT](https://github.com/nasa/openmct): Open source visualization framework by NASA.

Client dependencies:
- Browser: [Google Chrome](https://www.google.com/chrome), [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/products), Apple Safari, etc.


## Server Installation

The following instructions assume you are installing the software as a non-root user. Make sure that you have [Git](https://git-scm.com) and the . The installation and run has been tested on MacOS Catalina 10.15.7.

1. Install **YARP**: it is recommended to install the binaries using the [Conda package manager](https://anaconda.org/) and installing the YARP package from the [Robotology Conda channel](https://anaconda.org/robotology).
    - If you are not already using the `conda` package manager, install the `conda` miniforge distribution following https://github.com/robotology/robotology-superbuild/blob/master/doc/install-miniforge.md#linux. Remember to restart your shell session or run `source ~/.bashrc` (`~/.bash_profile` on MacOS) for the `conda init` command to take effect.
    - Install Mamba, create a new environment and install the YARP package:
    ```
    conda install mamba
    conda create -n robotologyenv
    conda activate robotologyenv
    mamba install -c robotology yarp
    ```
    To read more about installing `robotology` package binaries refer to https://github.com/robotology/robotology-superbuild/blob/master/doc/conda-forge.md#binary-installation.
2. Install **node.js** and **npm**: you can follow the official guides in the respective web pages but we recommend to install them through [NVM](). Currently, the latest **node.js** LTS version compatible with **YarpJS** `master` commit [be28630](https://github.com/robotology/yarp.js/commit/be2863022713ded2fa48909404b43e98b09eeda2) is the LTS: Argon release **node.js v4.2.2** (refer to https://github.com/robotology/yarp.js/issues/19). Meanwhile, the latest **node.js** LTS version compatible with **Open MCT** is latest LTS:Fermium version **node.js v14.17.0**. For this reason we install both releases.
    ```
    nvm install 4.2.2 --latest-npm          // installs the LTS:Argon version v4.2.2 and latest respective supported npm (v2.14.7)
    nvm install 14.17.0 --latest-npm        // installs latest LTS:Fermium version v14.17.0 and latest respective supported npm (v6.14.13)
    nvm alias default v4.2.2                // updates the default alias
    nvm ls                                  // lists available and active nodejs and npm versions
    ```
3. Clone the `yarp-openmct` repository into `<yarp-openmct-root-folder>` folder
    ```
    git clone https://github.com/dic-iit/yarp-openmct.git <yarp-openmct-root-folder>
    ```
4. Install the **iCubTelemVizServer** server: go to the `<yarp-openmct-root-folder>/iCubTelemVizServer` folder, select **node v4.2.2** and install the server
    ```
    cd yarp-openmct/iCubTelemVizServer
    nvm use 4.2.2
    npm install
    ```
5. Install the **Open MCT** based visualizer: go to `<yarp-openmct-root-folder>/openmctServer`, select **node v14.17.0** and install the server
    ```
    cd yarp-openmct/openmctServer
    nvm use 14.17.0
    npm install
    ```

### Notes
- For checking the active node.js/npm versions, run respectively `node -v` and `npm -v`.
- The installation of Open MCT dependency completes with a warning on (refer to https://github.com/dic-iit/element_software-engineering/issues/47#issuecomment-855276088).


## Client Installation

Install one of the browsers listed in the client dependencies.


## How to Run the Server

The telemetry data server `iCubTelemVizServer` actually runs three servers:
- A YarpJS based server listening to the YARP ports, asynchronously fetching sensor data as soon as it is available on the ports, synchronously generating the formatted telemetry samples and buffering them in the FIFO queue.
- A history server replying to the Open MCT client time range telemetry samples requests.
- A realtime server replying to the Open MCT client latest samples requests.

All three servers will be run on the same machine through the same process:

1. Run the YARP server from a terminal on a device connected to the robot network and where the server is installed
    ```
    yarpserver --write
    ```
2. Run the Yarp Robot Interface on iCub head or run **Gazebo** (`gazebo -slibgazebo_yarp_clock.so`) and drop the iCub model `iCubGazeboV2_5` in the simulation world.
3. On a terminal on the same or any other machine connected to the network,  run `npm start` from `<yarp-openmct-root-folder>/iCubTelemVizServer` folder. You should get the following output on the temrinal:
    ```
    iCub Telemetry server launched!
    [INFO] |yarp.os.Port| Port /yarpjs/inertial:i active at tcp://192.168.1.18:10002/
    ICubTelemetry History hosted at http://localhost:8081/history
    ICubTelemetry Realtime hosted at ws://localhost:8081/realtime
    listening on *:3000
    ```
5. On the same machine, run `npm start` from `<yarp-openmct-root-folder>/openmctServer` folder. You should get the following output on the terminal:
    ```
    > openmct-tutorials@0.0.1 start /Users/nunoguedelha/dev/openmct-tutorial
    > node openmct-static-server/server.js

    Open MCT hosted at http://localhost:8080
    ```
    The Open MCT visualizer static server creates the main interface page and sends it to the Open MCT client.
6. Read the device IP address using `ifconfig` (Linux,MacOS) or `ipconfig` (Windows). We shall refer to this address as <server-IP-address>.

## How to Run the Client

Open a browser on any other device connected to the same network and go to `<server-IP-address>:8080`.

<p align='center'>
<img src="images/iCubTelemetryOpenMCTexample.png" width="80%">
</p>

<b id="f1">1</b>: The [Socket.IO](https://socket.io/docs/v4) connection wraps a [Websocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) protocol. The client tries to establish a websocket connection whenever possible, and falls back to HTTP long polling otherwise. [↩](#a1)
