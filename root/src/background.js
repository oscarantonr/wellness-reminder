// Create the notification
function createAlarm(data, type, notificationTitle, notificationMessage) {
    const alarmInfo = {
        delayInMinutes: parseFloat(data.tiempo), // Retraso inicial
        periodInMinutes: parseFloat(data.tiempo) // Repetir cada X minutos
    };
    chrome.alarms.create(type, alarmInfo);

    chrome.storage.sync.set({
        [`notificationTitle_${type}`]: notificationTitle,
        [`notificationMessage_${type}`]: notificationMessage
    });
}

function showNotification(type, title, message) {
    // if(tipo === 'reminderHydrate'){
    //     chrome.notifications.create({
    //         type: 'basic',
    //         iconUrl: 'glass.png',
    //         title: '¡Es hora de hidratarse!',
    //         message: 'Recuerda beber agua para mantenerte saludable.',
    //         priority: 2
    //     });
    // } else {
    //     chrome.notifications.create({
    //         type: 'basic',
    //         iconUrl: 'stand_up.png',
    //         title: '¡Levántate!',
    //         message: 'Recuerda caminar unos minutos.',
    //         priority: 2
    //     });
    // }

    // if (type === 'reminderHydrate') {
    //     title = title;
    //     message = message;
    // } else if (type === 'reminderGetUp') {
    //     title = title;
    //     message = message;
    // }

    chrome.notifications.create({
        type: 'basic',
        iconUrl: type === 'reminderHydrate' ? 'glass.png' : 'stand_up.png',
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

        // chrome.storage.sync.get(['notificationTitle', 'notificationMessage'], (data) => {
            showNotification('reminderGetUp', notificationTitle, notificationMessage);
        // });
    }
});
});


// Listener para el evento "onInstalled" (instalación o actualización de la extensión)
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ extensionJustActivated: true }, () => {
    });
    chrome.storage.sync.set({ startAlarm: null, timeHydrate: null, timeGetUp: null });
});

// Listener para recibir mensajes del popup (para actualizar el tiempo, encender y apagar el temporizador)
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

    //Restart time
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
        hydration_start_alarm: null
    });
    chrome.storage.sync.set({
        startTimer_getUp: false,
        time_getUp: 1,
        getUp_start_alarm: null
    });
});
