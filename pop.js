chrome.alarms.create("breakReminder", {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "breakReminder") {
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "red" });
    }
  });