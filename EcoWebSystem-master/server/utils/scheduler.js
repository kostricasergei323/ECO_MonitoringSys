const { reverse } = require('dns');
const { tz } = require('moment-timezone');
const { resolve } = require('path');

const SaveEcoBot = require('./SaveEcoBotLoader/SaveEcoBotLoader');

class Schedule {
  constructor(hour_ = 2, minute_ = 30) {
    this.count = 0;
    this.hour = hour_;
    this.minute = minute_;
  }

  renewTimer() {
    this.ExectTime = new Date(tz('Europe/Kiev').format());
    this.ResetTime = new Date(
      tz('Europe/Kiev').hours(this.hour).minutes(this.minute).format()
    );
  }

  countTimeoutStart() {
    this.renewTimer();
    return Math.abs(this.ResetTime - this.ExectTime);
  }

  doJob() {
    return new Promise((resolve, refect) => {
      SaveEcoBot.LoadPoi_SaveEcoBotApi();
      setTimeout(() => {
        SaveEcoBot.LoadPoiIssue_SaveEcoBotApi();
        setTimeout(() => {
          resolve();
        }, 15000);
      }, 10000);
    });
  }

  Start() {
    setTimeout(() => {
      this.doJob().then(() => {
        setInterval(() => {
          this.doJob();
        }, 86375000);
      });
    }, this.countTimeoutStart());
  }
}

module.exports = {
  Schedule,
};
