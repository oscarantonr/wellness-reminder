function createAlarm(data, type, notificationTitle, notificationMessage) {
    const alarmInfo = {
        delayInMinutes: parseFloat(data.tiempo),
        periodInMinutes: parseFloat(data.tiempo)
    };
    chrome.alarms.create(type, alarmInfo);

    chrome.storage.sync.set({
        [`notificationTitle_${type}`]: notificationTitle,
        [`notificationMessage_${type}`]: notificationMessage
    });
}

function showNotification(type, title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: type === 'reminderHydrate' ? 'images/glass.png' : 'images/walking.png',
        title: title,
        message: message,
        priority: 2
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.sync.get(['language', 'translations'], (result) => {
    if (alarm.name === 'reminderHydrate') {
        const translations = result.translations;
        const notificationTitle = translations.notification_hydration_title.message;
        const notificationMessage = translations.notification_hydration_message.message;
        showNotification('reminderHydrate', notificationTitle, notificationMessage);
    } else if (alarm.name === 'reminderGetUp') {
            const translations = result.translations;
            const notificationTitle = translations.notification_stand_up_title.message;
            const notificationMessage = translations.notification_stand_up_message.message;

            showNotification('reminderGetUp', notificationTitle, notificationMessage);
    }
});
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ extensionJustActivated: true }, () => {
    });
    chrome.storage.sync.set({ startAlarm: null, timeHydrate: null, timeGetUp: null });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveNewHydration_Time') {
        chrome.storage.sync.set({
            hydration_time: request.tiempo,
            hydration_start_alarm: Date.now()
        }, () => {
            chrome.storage.sync.get(`timerOn_hydration`, (data) => {
                if (data[`timerOn_hydration`]) {
                    chrome.alarms.clear('reminderHydrate', () => {
                        createAlarm(request, 'reminderHydrate', request.notificationTitle, request.notificationMessage);
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: true });
                }
            });
        });
        return true;
    } else if (request.action === 'saveNewTimeGetUp') {
        chrome.storage.sync.set({
            time_getUp: request.tiempo,
            alarmStart_GetUp: Date.now()
        }, () => {
            chrome.storage.sync.get(`startTimer_getUp`, (data) => {
                if (data[`startTimer_getUp`]) {
                    chrome.alarms.clear('reminderGetUp', () => {
                        createAlarm(request, 'reminderGetUp', request.notificationTitle, request.notificationMessage);
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: true });
                }
            });
        });
        return true;
    } 

    if (request.action === 'reiniciarTemporizador') {
        chrome.storage.sync.get('hydration_time', function (data) {
            const timeHydrate = data.hydration_time ? data.hydration_time : 1;
            createAlarm(timeHydrate, 'reminderHydrate');
            sendResponse({ success: true });
        });
    }

    if (request.action === 'turnOffTimer_hydrate') {
        chrome.alarms.clear('reminderHydrate', () => {
            chrome.storage.sync.set({ hydration_start_alarm: null });
            sendResponse({ success: true });
        });
    } 
    if (request.action === 'turnOffTimer_getUp') {
        chrome.alarms.clear('reminderGetUp', () => {
            chrome.storage.sync.set({ alarmStart_GetUp: null });
            sendResponse({ success: true });
        });
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.sync.set({
        timerOn_hydration: false,
        hydration_time: 1,
        hydration_start_alarm: null,
        startTimer_getUp: false,
        time_getUp: 1,
        getUp_start_alarm: null
    });
});