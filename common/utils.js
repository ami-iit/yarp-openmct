"use strict";

/*
 * Signal string to code conversion from the POSIX standard
 *
 *      1       HUP (hang up)
 *      2       INT (interrupt)
 *      3       QUIT (quit)
 *      6       ABRT (abort)
 *      9       KILL (non-catchable, non-ignorable kill)
 *      14      ALRM (alarm clock)
 *      15      TERM (software termination signal)
 */

const SignalName2codeMap = {
    SIGHUP :  1,
    SIGINT :  2,
    SIGQUIT:  3,
    SIGABRT:  6,
    SIGKILL:  9,
    SIGALRM:  14,
    SIGTERM:  15
};

/*
 * A counter
 */
function MyCounter() {
    this.counter = 0;
    this.incr = () => {this.counter += 1; return this.counter};
    this.decr = () => {this.counter -= 1; return this.counter};
    this.reset = () => {this.counter= 0};
}

module.exports = {
    SignalName2codeMap: SignalName2codeMap,
    MyCounter: MyCounter
};
