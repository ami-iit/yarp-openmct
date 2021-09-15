# Copyright (C) 2021 Istituto Italiano di Tecnologia (IIT). All rights reserved.
# This software may be modified and distributed under the terms of the Apache-2.0 license

# There is nothing to build, only the fake battery config files need to be copied to the install folder:

set(ICUB_MODELS_TO_INSTALL iCubGazeboV2_5;iCubGazeboV3 CACHE
    STRING "iCub models to install, semi-colon separated. If you modify this list, make sure the respective folder exists.")

set(INSTALL_FAKE_BATTERY_DEVICE_CONFIG_FILES OFF CACHE
    BOOL "Install the fake battery configuration files required for emulating the battery status data stream.")

if (${INSTALL_FAKE_BATTERY_DEVICE_CONFIG_FILES})
    set(FAKE_BATTERY_FILES_INSTALL_DIR ${YARP_ROBOTS_INSTALL_DIR} CACHE
        STRING "Location (relative to the install prefix) where the fake battery configuration specific files are installed.")

    foreach(robotName ${ICUB_MODELS_TO_INSTALL})
        set(FAKE_BATTERY_FILES_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/robots/${robotName}/battery)

        # Copy battery configuration files
        install(
            DIRECTORY ${FAKE_BATTERY_FILES_SOURCE_DIR}
            DESTINATION ${FAKE_BATTERY_FILES_INSTALL_DIR}/${robotName}
            USE_SOURCE_PERMISSIONS
            FILES_MATCHING
            PATTERN "*.xml"
            PATTERN "*.ini")
    endforeach()
endif()
