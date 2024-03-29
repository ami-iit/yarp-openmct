# Copyright (C) 2021 Istituto Italiano di Tecnologia (IIT). All rights reserved.
# This software may be modified and distributed under the terms of the Apache-2.0 license

cmake_minimum_required(VERSION 3.5)
project(yarp-openmct)

# Find YARP dependency
find_package(YARP REQUIRED)

# Define specific installation directories like:
# - YARPOPENMCT_ROBOTS_INSTALL_DIR for the project specific files
# - YARP_ROBOTS_INSTALL_DIR for robot configuration files
#   (Yarp share installation folder)
yarp_configure_external_installation(yarpopenmct)

# Load custom macro and functions
list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/ycm-0.12)

# Set default CMAKE_INSTALL_PREFIX to local "build/install"
if(CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
  set(CMAKE_INSTALL_PREFIX ${CMAKE_CURRENT_BINARY_DIR}/install CACHE PATH "Install path prefix, prepended onto install directories." FORCE)
endif()

add_subdirectory(iCubTelemVizServer)

include(AddUninstallTarget)
