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

// Handle errors
var assert = require('assert');
const NOTIFIER_REPEAT_INTERVAL_MS = 10;
const TELEMETRY_DATA_DEPTH_MS = 60 * 1000;

function ICubTelemetry(portInConfig) {
    this.state = {
        "sens.imu": {
          "ori": {"roll": 0, "pitch": 0, "yaw": 0},
          "acc": {"x": 0, "y": 0, "z": 0},
          "gyr": {"x": 0, "y": 0, "z": 0},
          "mag": {"x": 0, "y": 0, "z": 0}
        },
        "sens.leftLegJointState": {
            "jointPos": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "jointVel": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "jointAcc": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "jointTrq": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "motorPos": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "motorVel": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "motorAcc": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "motorCur": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0},
            "motorPwm": {"hip_pitch": 0, "hip_roll": 0, "hip_yaw": 0, "knee": 0, "ankle_pitch": 0, "ankle_roll": 0}
        },
        "sens.rightLegJointState": {},
        "sens.leftArmJointState": {
            "jointPos": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "jointVel": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "jointAcc": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "jointTrq": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "motorPos": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "motorVel": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "motorAcc": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "motorCur": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0},
            "motorPwm": {"shoulder_pitch": 0, "shoulder_roll": 0, "shoulder_yaw": 0, "elbow": 0, "wrist_prosup": 0, "wrist_pitch": 0, "wrist_yaw": 0}
        },
        "sens.rightArmJointState": {},
        "sens.torsoJointState": {
            "jointPos": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "jointVel": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "jointAcc": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "jointTrq": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "motorPos": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "motorVel": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "motorAcc": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "motorCur": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0},
            "motorPwm": {"torso_pitch": 0, "torso_roll": 0, "torso_yaw": 0}
        },
        "sens.headJointState": {
            "jointPos": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "jointVel": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "jointAcc": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "jointTrq": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "motorPos": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "motorVel": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "motorAcc": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "motorCur": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0},
            "motorPwm": {"head_pitch": 0, "head_roll": 0, "head_yaw": 0}
        },
        "sens.camLeftEye": 0,
        "sens.camRightEye": 0,
        "sens.leftFootEEwrench": {
            "force": {"x": 0, "y": 0, "z": 0},
            "torque": {"x": 0, "y": 0, "z": 0}
        },
        "sens.rightFootEEwrench": {
            "force": {"x": 0, "y": 0, "z": 0},
            "torque": {"x": 0, "y": 0, "z": 0}
        },
        "sens.batteryStatus": {
            "voltage": 0, "current": 0, "charge": 0, "temperature": 0, "status": 0
        }
    };

    this.state["sens.rightLegJointState"] = JSON.parse(JSON.stringify(this.state["sens.leftLegJointState"]));
    this.state["sens.rightArmJointState"] = JSON.parse(JSON.stringify(this.state["sens.leftArmJointState"]));

    this.parser = {};
    Object.keys(portInConfig).forEach((key) => {
        switch (portInConfig[key].parser.type) {
            case "internal":
                switch ((portInConfig[key]).parser.outputFormat) {
                    case "vectorCollection":
                        this.state[key] = {};
                        this.parser[key] = this.parseVectorCollectionMap.bind(this);
                        break;
                    case "fromId":
                        this.parser[key] = this.parseFromId.bind(this);
                        break;
                    default:
                        console.error('Unsupported output format');
                }
                break;
            default:
                console.error('Unsupported parser type.');
        }
    }, this);
    this.forwardYarpDataToNotifier = {};
    Object.keys(portInConfig).forEach((key) => {this.forwardYarpDataToNotifier[key] = (id,data) => {}});

    this.connectNetworkSource = (id) => {};
    this.disconnectNetworkSource = (id) => {};

    this.maxDepthSamples = (TELEMETRY_DATA_DEPTH_MS/NOTIFIER_REPEAT_INTERVAL_MS).toFixed(0);
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).concat('ping').forEach(function (k) {
        this.history[k] = [];
    }, this);

    this.notifierTask = function () {
        var timestamp = Date.now();
        Object.keys(this.state).forEach(function (id) {
            this.generateTelemetry(timestamp,this.state[id],id);
        }, this);
    }.bind(this);

    console.log("iCub Telemetry server launched!");
}

ICubTelemetry.prototype.defineNetworkConnector = function (connectCallback,disconnectCallback) {
  assert(
      typeof connectCallback == "function" && typeof disconnectCallback == "function" &&
      connectCallback.length == 1 && disconnectCallback.length == 1,
      new TypeError('Input callback is not a function or has wrong number of arguments!')
  );
  this.connectNetworkSource = connectCallback;
  this.disconnectNetworkSource = disconnectCallback;
}

ICubTelemetry.prototype.connectTelemSrcToNotifier = function (id) {
  this.forwardYarpDataToNotifier[id] = this.parser[id];
  this.connectNetworkSource(id);
  return (() => {this.disconnectTelemSrcFromNotifier(id)}).bind(this);
}

ICubTelemetry.prototype.disconnectTelemSrcFromNotifier = function (id) {
  this.disconnectNetworkSource(id);
  this.forwardYarpDataToNotifier[id] = (id,data) => {};
}

ICubTelemetry.prototype.startNotifier = function () {
  if (this.notifierTimer === undefined) {
    this.notifierTimer = setInterval(this.notifierTask,NOTIFIER_REPEAT_INTERVAL_MS);
  } else {
    console.warn('Notifier task timer already started!');
  }
}

ICubTelemetry.prototype.stopNotifier = function () {
  if (this.notifierTimer !== undefined) {
    clearInterval(this.notifierTimer);
    this.notifierTimer = undefined;
  } else {
    console.warn('Notifier task timer not running!');
  }
}

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

ICubTelemetry.prototype.parseFromId = function (id,sensorSample) {
    switch(id) {
        case "sens.imu":
            this.state[id].ori.roll = sensorSample[0];
            this.state[id].ori.pitch = sensorSample[1];
            this.state[id].ori.yaw = sensorSample[2];
            this.state[id].acc.x = sensorSample[3];
            this.state[id].acc.y = sensorSample[4];
            this.state[id].acc.z = sensorSample[5];
            this.state[id].gyr.x = sensorSample[6];
            this.state[id].gyr.y = sensorSample[7];
            this.state[id].gyr.z = sensorSample[8];
            this.state[id].mag.x = sensorSample[9];
            this.state[id].mag.y = sensorSample[10];
            this.state[id].mag.z = sensorSample[11];
            break;
        case "sens.leftLegJointState":
        case "sens.rightLegJointState":
            for (let [jointStateMod,index] of [['jointPos',0],['jointVel',2],['jointAcc',4],['jointTrq',12],['motorPos',6],['motorVel',8],['motorAcc',10],['motorCur',14],['motorPwm',16]]) {
                this.state[id][jointStateMod].hip_pitch = sensorSample[index][0];
                this.state[id][jointStateMod].hip_roll = sensorSample[index][1];
                this.state[id][jointStateMod].hip_yaw = sensorSample[index][2];
                this.state[id][jointStateMod].knee = sensorSample[index][3];
                this.state[id][jointStateMod].ankle_pitch = sensorSample[index][4];
                this.state[id][jointStateMod].ankle_roll = sensorSample[index][5];
            }
            break;
        case "sens.leftArmJointState":
        case "sens.rightArmJointState":
            for (let [jointStateMod,index] of [['jointPos',0],['jointVel',2],['jointAcc',4],['jointTrq',12],['motorPos',6],['motorVel',8],['motorAcc',10],['motorCur',14],['motorPwm',16]]) {
                this.state[id][jointStateMod].shoulder_pitch = sensorSample[index][0];
                this.state[id][jointStateMod].shoulder_roll = sensorSample[index][1];
                this.state[id][jointStateMod].shoulder_yaw = sensorSample[index][2];
                this.state[id][jointStateMod].elbow = sensorSample[index][3];
                this.state[id][jointStateMod].wrist_prosup = sensorSample[index][4];
                this.state[id][jointStateMod].wrist_pitch = sensorSample[index][5];
                this.state[id][jointStateMod].wrist_yaw = sensorSample[index][6];
            }
            break;
        case "sens.torsoJointState":
            for (let [jointStateMod,index] of [['jointPos',0],['jointVel',2],['jointAcc',4],['jointTrq',12],['motorPos',6],['motorVel',8],['motorAcc',10],['motorCur',14],['motorPwm',16]]) {
                this.state[id][jointStateMod].torso_pitch = sensorSample[index][0];
                this.state[id][jointStateMod].torso_roll = sensorSample[index][1];
                this.state[id][jointStateMod].torso_yaw = sensorSample[index][2];
            }
            break;
        case "sens.headJointState":
            for (let [jointStateMod,index] of [['jointPos',0],['jointVel',2],['jointAcc',4],['jointTrq',12],['motorPos',6],['motorVel',8],['motorAcc',10],['motorCur',14],['motorPwm',16]]) {
                this.state[id][jointStateMod].head_pitch = sensorSample[index][0];
                this.state[id][jointStateMod].head_roll = sensorSample[index][1];
                this.state[id][jointStateMod].head_yaw = sensorSample[index][2];
            }
            break;
        case "sens.leftFootEEwrench":
        case "sens.rightFootEEwrench":
            this.state[id].force.x = sensorSample[0];
            this.state[id].force.y = sensorSample[1];
            this.state[id].force.z = sensorSample[2];
            this.state[id].torque.x = sensorSample[3];
            this.state[id].torque.y = sensorSample[4];
            this.state[id].torque.z = sensorSample[5];
            break;
        case "sens.batteryStatus":
            this.state[id].voltage = sensorSample[0];
            this.state[id].current = sensorSample[1];
            this.state[id].charge = sensorSample[2];
            this.state[id].temperature = sensorSample[3];
            this.state[id].status = sensorSample[4];
            break;
        default:
            this.state[id] = sensorSample;
    }
}

ICubTelemetry.prototype.parseVectorCollectionMap = function (id,sensorSample) {
    sensorSample[0].forEach(function (signal) {
        this.state[id][signal[0]] = signal[1];
    },this);
}

/**
 * Takes a measurement of spacecraft state, stores in history, and notifies
 * listeners.
 */
ICubTelemetry.prototype.generateTelemetry = function (timestamp,value,id) {
    switch(id) {
        case "sens.camLeftEye":
        case "sens.camRightEye":
            var telemetrySample = {timestamp: timestamp, value: value, id: id};
            break;
        default:
            var telemetrySample = this.flatten({timestamp: timestamp, value: value, id: id});
    }
    this.notify(telemetrySample);
    this.history[id].push(telemetrySample);
    if (this.history[id].length > this.maxDepthSamples) {
        this.history[id].shift(); // removes the oldest element
    }
}

ICubTelemetry.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
}

ICubTelemetry.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
}

module.exports = ICubTelemetry;
