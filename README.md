# Yarp - Open MCT

<b id="top"></b>
An Open MCT and Yarp based iCub telemetry visualizer.

## [Introduction](#top)

The **Yarp-OpenMCT** tool is meant for visualizing and plotting telemetry data from iCub sensors, published over a Yarp network. It collects sensor data published on a predefined set of Yarp output ports opened by the Yarp Robot Interface and exposes that data on predefined telemetry nodes within the visualizer interface as vectors or scalar signals. The pipeline can be summarized as follows:
- A telemetry data server reads the data from a Yarp port, then available within the server as realtime data.
- The data is buffered in a FIFO queue of predefined depth, and in parallel streamed over a [Socket.IO](https://socket.io/docs/v4) connection to the registered visualizer client<sup id="a1">[1](#f1)</sup>.
- The data is accessible via the respective telemetry node in the visualizer interface, in the left-hand tree under the "+Create" button. Any object visible in that tree is referred to as a "Domain Object" in the Open MCT glossary.

All telemetry nodes exposing sensor measurements shall appear under the folder "iCub Telemetry". They can then be combined in workspace layouts at the user convenience.

The visualizer implementation is based on the [Open MCT](https://github.com/nasa/openmct) (Open Mission Control Technologies), open source, next-generation mission control framework for the visualization of data on desktop and mobile devices. It is developed at NASA's Ames Research Center, and is being used by NASA for data analysis of spacecraft missions, as well as planning and operation of experimental rover systems.

In addition, the **Yarp-OpenMCT** tool provides a Control Console implementing a web interface to two RPC Yarp server devices:
- The **wholeBodyDynamics** RPC server (`/wholeBodyDynamics/rpc` port) through which you can run the FT sensors calibrator,
- The **WalkingModule** RPC server, through which you can run all walking coordinator actions, like setting the robot initial configuration, setting the destination position, turn, start and stop walking.

The Control Console GUI displays a series of buttons which trigger the same commands usually sent through the RPC interface running on a terminal.
These commands are implemented with the most common options, which can be set through editable text input forms.

## [Dependencies](#top)

Server dependencies:
- [NVM](https://github.com/nvm-sh/nvm): Node Version Manager.
- [Node.js](https://nodejs.org/en/): Asynchronous event-driven JavaScript runtime, designed to build scalable network applications.
- [npm](https://www.npmjs.com/): Node package manager.
- [Open MCT](https://github.com/nasa/openmct): Open source visualization framework by NASA.
- [YarpJS](https://github.com/robotology/yarp.js): Yarp Javascript bindings
- [YARP](https://github.com/robotology/yarp): Middleware for handling the communication with the robot.
- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain for the given platform
    - Windows:
        - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or a recent version of Visual C++ will do ([the free Community](https://www.visualstudio.com/products/visual-studio-community-vs) version works well)
    - Unix/Posix:
        - Clang or GCC

#### Notes
- Additional dependencies [Open MCT](https://github.com/nasa/openmct) (Open source visualization framework by NASA) and [YarpJS](https://github.com/robotology/yarp.js) (Yarp Javascript bindings) are automatially installed by the Node.js `npm` package manager when installing the repository main modules (steps 7 and 8).
- [YARP](https://github.com/robotology/yarp), [CMake](http://www.cmake.org/download/) and C/C++ compiler toolchain are transitory dependencies which shouldn't be mentioned a priori here, but since they are not handled by the [YarpJS](https://github.com/robotology/yarp.js) installation process (via the package manager `npm`), they need to be manually installed.

Client dependencies:
- Browser: [Google Chrome](https://www.google.com/chrome), [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/products), Apple Safari, etc.


## [Server Installation](#top)

The following instructions assume you are installing the software as a non-root user. Make sure that you have [Git](https://git-scm.com) installed in your platform. The installation and run have been tested on MacOS Catalina 10.15.7 and Vanilla Ubuntu 20.04.

### YARP Robot Interface, WholeBodyDynamics and WalkingModule RPC Servers

The scope of this how-to includes only the modules implementing the **Yarp-OpenMCT** tool. We assume here that you have a setup ready with the following modules running on the same local network, referred to as the robot network:
- a **yarprobotinterface** running on the iCub head,
- a Yarp Name Server.

This requires installing the [robotology-superbuild](https://github.com/robotology/robotology-superbuild) and enabling the profile [iCub head profile](https://github.com/robotology/robotology-superbuild/blob/master/doc/cmake-options.md#icub-head) (`ROBOTOLOGY_ENABLE_ICUB_HEAD`).

### Install NVM, Node.js and npm

⚠️ Run the installation steps 1 and 2 from a new terminal without any `conda` package manager environment enabled.

1. Install [**NVM**](https://github.com/nvm-sh/nvm) (mandatory), a **Node.js** Version Manager by MIT, which safely handles the installation of multiple versions of Node.js and easy switching between versions. As mentioned in later steps, two different versions of Node.js versions are required for installing and running the visualization tool.
    Follow the NVM installation instruction steps in https://github.com/nvm-sh/nvm, recapped below:
    
    a. Run the command below which downloads and runs the one-line installer
    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    ```
    b. After restarting the terminal, the following lines were added to the `~/.bashrc` (`~/.bash_profile` on MacOS)
    ```
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    ```
    c. List available Node.js releases
    ```
    nvm ls-remote
    ```

2. Install **Node.js** and **npm** from the same terminal. Currently, the latest **Node.js** LTS version compatible with **YarpJS** `master` commit [be28630](https://github.com/robotology/yarp.js/commit/be2863022713ded2fa48909404b43e98b09eeda2) is the LTS: Argon release **Node.js v4.2.2** (refer to https://github.com/robotology/yarp.js/issues/19). Meanwhile, the latest **Node.js** LTS version compatible with **Open MCT** is latest LTS:Fermium version **Node.js v14.17.0**. For this reason we install both releases.
    ```
    nvm install 4.2.2 --latest-npm          // installs the LTS:Argon version v4.2.2 and latest respective supported npm (v2.14.7)
    nvm install 14.17.0 --latest-npm        // installs latest LTS:Fermium version v14.17.0 and latest respective supported npm (v6.14.13)
    nvm alias default v4.2.2                // updates the default alias
    nvm ls                                  // lists available and active nodejs and npm versions
    ```

### Install YARP, CMake and the C++ Compilers

⚠️ It is recommended to install the **YARP, CMake** and **C/C++ compiler toolchain** binaries using the [Conda package manager](https://anaconda.org/) and installing the respective packages from the [Robotology Conda channel](https://anaconda.org/robotology), as described in the following steps.

3. If you are not already using the `conda` package manager, install the `conda` mambaforge distribution following https://github.com/robotology/robotology-superbuild/blob/master/doc/install-mambaforge.md#linux. Remember to restart your shell session or run `source ~/.bashrc` (`~/.bash_profile` on MacOS) for the `conda init` command to take effect.
    - Create a new environment and activate it:
        ```
        conda create -n robotologyenv
        conda activate robotologyenv
        ```
    All the following steps shall be run within the activated `conda` **robotologyenv** environment. It is critical that you haven't any Node.js package installed through `conda` (**nodejs**) in that same environment since you will be using the Node.js package from NVM.

4. Install **YARP** from the [Robotology Conda channel](https://anaconda.org/robotology)
    ```
    mamba install -c robotology yarp
    ```
    To read more about installing `robotology` package binaries refer to https://github.com/robotology/robotology-superbuild/blob/master/doc/conda-forge.md#binary-installation.

5. Install the `compilers` and `cmake` packages from the [Robotology Conda channel](https://anaconda.org/robotology) (in case a specific CMake version meeting specific **YarpJS** requirements is maintained in that channel. Otherwise, `mamba` falls back to its default channel)
    ```
    mamba install -c robotology compilers cmake
    ```

### Install the Repository

6. Clone the `yarp-openmct` repository into `<yarp-openmct-root-folder>` folder
    ```
    git clone https://github.com/dic-iit/yarp-openmct.git <yarp-openmct-root-folder>
    ```

7. Install the **iCubTelemVizServer** server: go to the `<yarp-openmct-root-folder>/iCubTelemVizServer` folder, select **node v4.2.2** and install the server
    ```
    cd yarp-openmct/iCubTelemVizServer
    nvm use 4.2.2
    npm install
    ```

8. Install the **Open MCT** based visualizer: go to `<yarp-openmct-root-folder>/openmctStaticServer`, select **node v14.17.0** and install the server
    ```
    cd yarp-openmct/openmctStaticServer
    nvm use 14.17.0
    npm install
    ```

### Install the Fake Battery Device if Applicable

If are running a simulation on Gazebo or don't have a real battery on the iCub robot, and wish to check the battery state visualization handling on the telemetry visualization tool, you need to install the fake battery devicewhich publishes on the `/icubSim/battery` port a fake battery state (voltage, current, temperature, charge level, ...).

1. Got to the repository `yarp-openmct` root folder.
2. create a build folder `build`, run CMake, and run `ccmake` for editiong the CMake variables
```
mkdir buid
cd build
cmake ..
ccmake .
```
3. Set the `CMAKE_INSTALL_PREFIX` to your `$ROBOTOLOGY_SUPERBUILD_INSTALL_PREFIX` if you're using the superbuild, or any other location at your convenience.
4. Set the `ICUB_MODELS_TO_INSTALL`, which is by default set to `iCubGazeboV2_5`.
5. Turn `INSTALL_FAKE_BATTERY_DEVICE_CONFIG_FILES` on. Actually, the CMake configuration in the repository is for installing any device of additional module to build through the CMake system. In such case, installing the fake battery device can still be optional.
6. configure and generate the CMake files (hit "c" as many times as required, then "g").
7. install
```
make install
``` 

### Notes
- For checking the active Node.js/npm versions, run respectively `node -v` and `npm -v`.
- The installation of Open MCT dependency completes with a warning on some detected network vulnerability (refer to https://github.com/ami-iit/yarp-openmct/issues/35). This is not critical as we are running everything in a local private network, but further analysis is required.


## [Client Installation](#top)

Install one of the browsers listed in the client dependencies.


## [How to Run the Telemetry Server](#top)

### Run a YARP Robot interface or Connect to a Running Robot Network

If no robot setup is running, run the YARP name server on the robot local network and the YARP robot interface on the iCub head following the steps described in \<link-to-robot-startup-on-iCub-head\>.html.

Instead, for running a simulation on Gazebo on a machine with all the simulation framework installed:

1. Set the YARP_ROBOT_NAME environment variable according to the chosen Gazebo model (`icubGazeboSim` or `iCubGazeboV2_5`):
```
export YARP_ROBOT_NAME="iCubGazeboV2_5"
```
2. Set the YARP namespace and run the YARP server
```
yarp namespace /myNameSpace
yarpserver --write
```
3. Run Gazebo and drag and drop the iCub model (`icubGazeboSim` or `iCubGazeboV2_5`):
```
gazebo -slibgazebo_yarp_clock.so
```

If you wish to visualize iCub telemetry data from a robot setup already running on its local network under a given namespace \<yarpRobotNamespace\> (e.g. `/icub`, `/myNameSpace`), follow the steps below:

1. Set the YARP_ROBOT_NAME environment variable according to the target model \<robotModel\> (real robot model `iCubGenova04`, `iCubGenova09` model or simulation model `icubGazeboSim` or `iCubGazeboV2_5`):
```
export YARP_ROBOT_NAME="<robotModel>"
```
2. Set the Yarp namespace, detect the Yarp name server and save its address:
```
yarp namespace <yarpRobotNamespace>
yarp detect --write
```

### Activate Additional Services if Applicable

1. If you need to calibrate the FT sensors and/or visualize the ground reaction forces on the feet, make sure the **wholeBodyDynamics** RPC server is up and running, otherwise, run it
```
YARP_CLOCK=/clock yarprobotinterface --config launch-wholebodydynamics.xml
```
    - **FT sensors calibration:** make sure the RPC port `/wholeBodyDynamics/rpc` is available.
    - **Ground Reaction Forces:** make sure the RPC ports `/wholeBodyDynamics/left_foot/cartesianEndEffectorWrench:o` and `/wholeBodyDynamics/right_foot/cartesianEndEffectorWrench:o` are available.

1. **Walking Coordinator**: If you wish use the walking coordinator, you should run the  the `WalkingModule` RPC server, exposing the respective RPC port `/walking-coordinator/rpc`.
```
YARP_CLOCK=/clock WalkingModule
```

1. **iCub Cameras:** Run the iCub left and right eye camera frame grabber devices and make sure they are publishing the image data on the respective ports `/icub/camera/left` and `/icub/camera/right`.

1. **Battery State:** Make sure the battery device is publishing the battery state on the port `/icub/battery/data:o`. If you're running a simulation on Gazebo, you need to run the fake battery device instead, as described in the next section.

#### Running the Fake Battery Device in Simulation
We assume you have installed the fake battery device as explained in Section #install-the-repository. Run the fake battery device
```
YARP_CLOCK=/clock yarprobotinterface --config battery/icub_battery.xml
```


### Run the Telemetry Server

1. Open a terminal on the same or any other machine connected to the network.

2. If you have used `conda` package manager to install the dependencies as described in Section #server-installation, activate the `conda` environment where you installed these dependencies, otherwise skip to next step.
    ```
    conda activate robotologyenv
    ```

3. Run `npm start` from `<yarp-openmct-root-folder>/iCubTelemVizServer` folder. You should get on the temrinal standard output something like:
    ```
    > iCubTelemVizServer@1.0.0 start <user-home>/dev/yarp-openmct/iCubTelemVizServer
    > . ${NVM_DIR}/nvm.sh; nvm use v4.2.2; node ${NODE_DEBUG_OPTION} iCubTelemVizServer.js
    
    Now using node v4.2.2 (npm v2.14.7)
    iCub Telemetry server launched!
    [INFO] |yarp.os.Port| Port /yarpjs/inertial:i active at tcp://192.168.1.100:10117/
    [INFO] |yarp.os.impl.PortCoreInputUnit| Receiving input from /icubSim/inertial to /yarpjs/inertial:i using tcp
    ...
    [INFO] |yarp.os.Port| Port /yarpjs/sysCmdsGenerator/rpc active at tcp://192.168.1.100:10124/
    OK
    Opem-MCT static server process started.
    ICubTelemetry History hosted at http://localhost:8081/history
    ICubTelemetry Realtime hosted at ws://localhost:8081/realtime
    listening on http://localhost:3000
    [OPEN-MCT STATIC SERVER] stdout:
    > openmctStaticServer@1.0.0 start <user-home>/dev/yarp-openmct/openmctStaticServer
    > . ${NVM_DIR}/nvm.sh; nvm use v14.17.0; node server.js
    
    
    [OPEN-MCT STATIC SERVER] stdout: Now using node v14.17.0 (npm v6.14.13)
    
    [OPEN-MCT STATIC SERVER] stdout: iCub Telemetry Visualizer (Open MCT based) hosted at http://localhost:8080
    ```

4. Read the machine IP address using `ifconfig` (Linux,MacOS) or `ipconfig` (Windows). We shall refer to this address as \<server-IP-address>.

## [How to Run the Visualizer Client](#top)

The Visualizer Client is a GUI based on the [Open MCT](https://github.com/nasa/openmct) framework, displaying a set of iCub Telemetry data elements which plot the data received from the telemetry server. 

Run a browser on any other machine connected to the same network and open the link `<server-IP-address>:8080`. If you run the browser on the same machine as the telemetry server, just open the link `localhost:8080`.

<p align='center'>
<img src="images/iCubTelemetryOpenMCTexample.png" width="80%">
</p>

In the above example, the iCub head IMU measurements read on the port `/icub/inertial` and sent to the visualization tool client are exposed as the telemetry node "IMU sensor measurements". The telemetry node wraps all the 12 measurement components:
- The orientation estimation Roll, Pitch and Yaw.
- The accelerometer measuremtents x, y, z components.
- The gyroscope measuremtents x, y, z components.
- The magnetometer measuremtents x, y, z components.

The measurement components can be exclusively selected for plotting as shown in the picture.

## [How to Run the Control Console Client](#top)

The Control Console provides a web interface to the FT sensors calibrator from the **wholeBodyDynamics** RPC device and the walking coordinator (`WalkingModule`) RPC device.

On the same browser or on any browser running on another machine connected to the same network open the link `<server-IP-address>:3000`. If your browser is running on the same machine as the telemetry server, just open the link `localhost:3000`.

<p align='center'>
<img src="images/controlConsoleExample.png" width="80%">
</p>

#### Note
If you run the browser on the same machine as the telemetry server, instead of manually entering the link address, look for the respective links in the terminal output of the server run command (`npm start`), hover over the links and hit \<CTRL\>+\<mouse left button\> (on MacOS, \<Meta\> instead of \<CTRL\>).
```
listening on http://localhost:3000
[OPEN-MCT STATIC SERVER] stdout:
> openmctStaticServer@1.0.0 start <user-home>/dev/yarp-openmct/openmctStaticServer
> . ${NVM_DIR}/nvm.sh; nvm use v14.17.0; node server.js


[OPEN-MCT STATIC SERVER] stdout: Now using node v14.17.0 (npm v6.14.13)

[OPEN-MCT STATIC SERVER] stdout: iCub Telemetry Visualizer (Open MCT based) hosted at http://localhost:8080
```

<b id="f1">1</b>: The [Socket.IO](https://socket.io/docs/v4) connection wraps a [Websocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) protocol. The client tries to establish a websocket connection whenever possible, and falls back to HTTP long polling otherwise. [:arrow_up:](#a1)
