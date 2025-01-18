
// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

export class Timer {
    public readonly startTime: number;

    constructor() {
        this.startTime = Date.now();
    }

    // Returns the elapsed time in milliseconds
    get elapsedTime(): number {
        return Date.now() - this.startTime;
    }

}
