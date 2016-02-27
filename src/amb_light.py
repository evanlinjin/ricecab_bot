#!/usr/bin/env python
# Determines average light value.

import RPi.GPIO as GPIO, time, os

DEBUG = 1
GPIO.setmode(GPIO.BCM)

def get_light (RCpin):
    reading = 0
    GPIO.setup(RCpin, GPIO.OUT)
    GPIO.output(RCpin, GPIO.LOW)
    time.sleep(0.1)

    GPIO.setup(RCpin, GPIO.IN)
    while (GPIO.input(RCpin) == GPIO.LOW):
            reading += 1
    return reading

def get_avg_light (RCpin, n_times):
    reading = 0
    for i in range(n_times):
        reading += get_light(RC_pin)
    reading /= n_times
    return reading

while True:
        print get_light(18)     # Read RC timing using pin #18
