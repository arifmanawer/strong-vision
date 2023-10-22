function getCurrentDomain() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs.length) {
                try {
                    const {url, favIconUrl} = tabs[0]
                    const {hostname} = new URL(url);
                    const domain = hostname.replace("www.", "")
                    // resolve(domain);
                    chrome.storage.local.get(["icons"], ({icons}) => {
                        icons = icons || {}
                        icons[domain] = favIconUrl
                        chrome.storage.local.set({icons}, () => resolve(domain))
                    })
                } catch (error) {
                    resolve("");
                }
            } else {
                resolve("");
            }
        });
    });
}

function setCurrentDomain(domain) {
    return new Promise((resolve) => chrome.storage.local.set({domain}, () => resolve(domain)))
}

chrome.storage.local.set({domain: "", timestamp: 0}, () => {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
            return
        }

        const {domain} = changes
        if (!domain) {
            return
        }

        const {oldValue, newValue} = domain
        if (oldValue === newValue) {
            return
        }

        console.log('change', oldValue, newValue)
        chrome.storage.local.get(["timestamp"], ({timestamp}) => {
            if (oldValue && timestamp) {
                const seconds = Math.round((Date.now() - timestamp) / 1000);
                // console.log('screen time', oldValue, seconds)

                const today = new Date().setHours(0, 0, 0, 0).toString();
                chrome.storage.local.get([today], (result) => {
                    if (!result.hasOwnProperty(today) && new Date().getDay() === 1) {
                        chrome.notifications.create(
                            null,
                            {
                                type: "basic",
                                iconUrl: "images/icon128.png",
                                title: "Screen Time",
                                message: `Screen Time report is ready`,
                                priority: 2,
                                eventTime: Date.now()
                            },
                            () => window.close()
                        );
                    }
                    const data = result[today] || {}
                    data[oldValue] = data.hasOwnProperty(oldValue) ? seconds + data[oldValue] : seconds
                    chrome.storage.local.set({[today]: data}, () => {
                        console.log('screen time', oldValue, seconds)
                    })
                })
            }
            chrome.storage.local.set({timestamp: Date.now()})
        })
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        const {status} = changeInfo;
        if (status === "complete") {
            console.log(changeInfo)
            getCurrentDomain().then(setCurrentDomain).then(domain => console.log('updated', domain))
        }
    });

    chrome.tabs.onActivated.addListener(() => {
        getCurrentDomain().then(setCurrentDomain).then(domain => console.log('activated', domain))
    });

    chrome.windows.onFocusChanged.addListener((window) => {
        if (window === -1) {
            setCurrentDomain("").then(() => console.log("blur"))
        } else {
            getCurrentDomain().then(setCurrentDomain).then(domain => console.log('focus', domain))
        }
    });

    chrome.runtime.onSuspend.addListener(() => {
        setCurrentDomain("").then(() => console.log("suspend"))
    })
});

let timer;

// Function to show the 10-minute popup
function showEyeExercisePopup() {
    const popup = document.createElement("div");
    popup.id = "eyeExercisePopup";
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.right = "20px";
    popup.style.padding = "10px";
    popup.style.background = "#fff";
    popup.style.border = "2px solid #333";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "9999";
    popup.innerHTML = "It's been 10 minutes. Take a few minutes to try out these eye exercises.";

    document.body.appendChild(popup);

    setTimeout(() => {
        const eyeExercisePopup = document.getElementById("eyeExercisePopup");
        if (eyeExercisePopup) {
            eyeExercisePopup.remove();
        }
    }, 60000); // Close the popup after 60 seconds (1 minute)
}

// Function to start the 10-minute timer
function startTenMinuteTimer() {
    timer = setInterval(() => {
        showEyeExercisePopup();
    }, 60000); // Show the popup after 10 minutes (600,000 milliseconds)
}

// Start the 10-minute timer
startTenMinuteTimer();