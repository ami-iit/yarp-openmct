# Copyright (C) 2021 Istituto Italiano di Tecnologia (IIT). All rights reserved.
# This software may be modified and distributed under the terms of the Apache-2.0 license

cmake_minimum_required(VERSION 3.5)
project(matlab-whole-body-simulator)

# There is nothing to build, only the fake battery config files need to be copied to the install folder:

if(CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
  set(CMAKE_INSTALL_PREFIX ${CMAKE_CURRENT_SOURCE_DIR}/build/install CACHE PATH "Install path prefix, prepended onto install directories." FORCE)
endif()

set(YARP_ROBOTS_INSTALL_DIR "share/yarp/robots" CACHE
    STRING "Location (relative to the install prefix) where the robot configuration files are installed.")

# Load custom macro and functions
list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/ycm-0.12)

set(ICUB_MODELS_TO_INSTALL iCubGazeboV2_5)

foreach(YARP_ROBOT_NAME ${ICUB_MODELS_TO_INSTALL})
    set(FAKE_BATTERY_INSTALL_FILES_DIR ${YARP_ROBOTS_INSTALL_DIR}/${YARP_ROBOT_NAME} CACHE
        STRING "Location (relative to the install prefix) where the fake battery configuration specific files are installed.")

    set(FAKE_BATTERY_SOURCE_FILES_DIR ${CMAKE_CURRENT_SOURCE_DIR}/robots/${YARP_ROBOT_NAME}/battery CACHE
        STRING "Location (relative to the CMakeLists.txt parent folder) in which the fake battery configuration files are     installed.")
    
    # Copy battery configuration files
    install(
        DIRECTORY ${FAKE_BATTERY_SOURCE_FILES_DIR}
        DESTINATION ${FAKE_BATTERY_INSTALL_FILES_DIR}
        USE_SOURCE_PERMISSIONS
        FILES_MATCHING
        PATTERN "*.xml"
        PATTERN "*.ini")
endforeach()

include(AddUninstallTarget)
