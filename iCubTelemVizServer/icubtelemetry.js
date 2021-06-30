/*
 icubtelemetry.js generates the iCub sensors telemetry from data published in Yarp ports.

 === IMU sensor data ===
 Format source: <robotology-superbuild>/src/GazeboYARPPlugins/plugins/imu/src/IMUDriver.cpp

 The network interface is a single Port.
 We will stream bottles with 12 floats:
 0  1   2  = Euler orientation data (Roll-Pitch-Yaw)
 3  4   5  = Calibrated 3-axis (X, Y, Z) acceleration data
 6  7   8  = Calibrated 3-axis (X, Y, Z) gyroscope data
 9 10 11   = Calibrated 3-axis (X, Y, Z) magnetometer data

*/

function ICubTelemetry() {
    this.state = {
        "sens.imu": {
          "ori": {"roll": 0, "pitch": 0, "yaw": 0},
          "acc": {"x": 0, "y": 0, "z": 0},
          "gyr": {"x": 0, "y": 0, "z": 0},
          "mag": {"x": 0, "y": 0, "z": 0}
        }
    };
    this.maxDepthSamples = 1000;
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    const TEN_MS_REPEAT_INTERVAL = 10;
    setInterval(function () {
        this.generateTelemetry();
    }.bind(this), TEN_MS_REPEAT_INTERVAL);

    console.log("iCub Telemetry server launched!");
};

ICubTelemetry.prototype.flattenHelper = function (nestedObj,parentKey) {
  var flatObj = {};
  Object.keys(nestedObj).forEach(function (k) {
      if (typeof nestedObj[k] == "object") {
          Object.assign(flatObj, this.flattenHelper(nestedObj[k], parentKey + k + "."));
      } else {
          flatObj[parentKey + k] = nestedObj[k];
      }
  }, this);
  return flatObj;
}

ICubTelemetry.prototype.flatten = function (nestedObj) {
  return this.flattenHelper(nestedObj,'');
}

ICubTelemetry.prototype.updateState = function (sensorSample) {
  this.state["sens.imu"].ori.roll = sensorSample[0];
  this.state["sens.imu"].ori.pitch = sensorSample[1];
  this.state["sens.imu"].ori.yaw = sensorSample[2];
  this.state["sens.imu"].acc.x = sensorSample[3];
  this.state["sens.imu"].acc.y = sensorSample[4];
  this.state["sens.imu"].acc.z = sensorSample[5];
  this.state["sens.imu"].gyr.x = sensorSample[6];
  this.state["sens.imu"].gyr.y = sensorSample[7];
  this.state["sens.imu"].gyr.z = sensorSample[8];
  this.state["sens.imu"].mag.x = sensorSample[9];
  this.state["sens.imu"].mag.y = sensorSample[10];
  this.state["sens.imu"].mag.z = sensorSample[11];
};

/**
 * Takes a measurement of spacecraft state, stores in history, and notifies
 * listeners.
 */
ICubTelemetry.prototype.generateTelemetry = function () {
    var timestamp = Date.now();
    Object.keys(this.state).forEach(function (id) {
        var telemetrySample = this.flatten({timestamp: timestamp, value: this.state[id], id: id});
        this.notify(telemetrySample);
        this.history[id].push(telemetrySample);
        if (this.history[id].length > this.maxDepthSamples) {
          this.history[id].shift();
        }
    }, this);
};

ICubTelemetry.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

ICubTelemetry.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

module.exports = function () {
    return new ICubTelemetry()
};
