import { initInputComponent } from './inputComponent.js';
let cuentaAtrasIntervalId;
let countdownIntervalGetUp;

function getDefaultLanguage() {
    const browserLanguage = navigator.language;
    console.log("test lang: " + browserLanguage);
    const lang = browserLanguage.startsWith('es') ? 'es' : (browserLanguage.startsWith('en') ? 'en' : 'en');
    return lang;
}

function loadTranslations(lang) {
    return new Promise((resolve, reject) => {
        const filePath = `../_locales/${lang}/messages.json`;
        
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar las traducciones.');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error al cargar el archivo de traducción:', error);
                reject(error);
            });
    });
}

function applyTranslations(translations) {
    const items = document.querySelectorAll('[data-i18n]');
    items.forEach(item => {
        const key = item.getAttribute('data-i18n');
        const translation = translations[key]?.message || key;

        if (item.tagName.toLowerCase() === 'input' || item.tagName.toLowerCase() === 'textarea' || item.tagName.toLowerCase() === 'button') {
            item.value = translation;
        } else {
            item.innerText = translation;
        }
    });
}

function changeLanguage(lang) {
    loadTranslations(lang)
        .then(translations => {
            applyTranslations(translations);
            chrome.storage.sync.set({ language: lang, translations: translations }, () => {
                console.log(`Idioma cambiado a: ${lang}`);
            });
        })
        .catch(error => {
            console.error('Error al cambiar idioma:', error);
        });
}

function showAlertInvalidNumber() {
    chrome.storage.sync.get(['language'], (result) => {
        const lang = result.language;

        loadTranslations(lang).then(translations => {
            const alertMessage = translations['alertNumberInvalid']?.message || 'Por favor, ingresa un número válido para el tiempo en minutos (1-120).';
            alert(alertMessage);
        }).catch(error => {
            console.error('Error:', error);
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const timeInputWater = document.getElementById('waterTime');
    const timeInputStandUp = document.getElementById('standUpTime');
    let startButtonPressed, startButtonGetStandUp = false;
    let stopButtonPressed, stopButtonGetStandUp = false;
    const checkboxWater = document.getElementById('waterCheckbox');
    const checkboxStand = document.getElementById('standCheckbox');

    checkboxWater.checked = false;
    checkboxStand.checked = false;

    chrome.storage.sync.get(['hydration_time', 'time_getUp'], function (data) {
        if (data.hydration_time) {
            timeInputWater.value = data.hydration_time;
        }
        if (data.time_getUp) {
            timeInputStandUp.value = data.time_getUp;
        }
    });
    
    initInputComponent();

    window.onload = function() {
    chrome.storage.sync.get(['extensionJustActivated'], function (result) {
        if (result.extensionJustActivated) {
            const lang = getDefaultLanguage();
            changeLanguage(lang);
            chrome.storage.sync.set({ extensionJustActivated: false });
        }
    });
    }
    
    chrome.storage.sync.get(['language'], (result) => {
        const lang = result.language || 'es';
        changeLanguage(lang);
    });
    
    chrome.storage.sync.get([`timerOn_hydration`], function (data) {
        if (data[`timerOn_hydration`]) {
            checkboxWater.checked = true;
            document.getElementsByClassName('container-water')[0].classList.add('transition');
        }
    });

    chrome.storage.sync.get([`startTimer_getUp`], function (data) {
        if (data[`startTimer_getUp`]) {
            checkboxStand.checked = true;
            document.getElementsByClassName('container-stand')[0].classList.add('transition');
        }
    });

    function actualizarEstadoUI() {
        chrome.storage.sync.get([`timerOn_hydration`, `hydration_time`, `hydration_start_alarm`, `startButtonPressed_hydration`], function (data) {
            if (data[`startButtonPressed_hydration`]) {
                if (data[`hydration_start_alarm`] && data[`hydration_time`]) {
                    updateCountdown(data[`hydration_time`], data[`hydration_start_alarm`], 'messageWaterStart');
                }
            }
    
            chrome.storage.sync.get([`startTimer_getUp`, `time_getUp`, `getUp_start_alarm`, `startButtonPressed_GetUp`], function (dataGetUp) {
                if (dataGetUp[`startButtonPressed_GetUp`]) {
                    if (dataGetUp[`getUp_start_alarm`] && dataGetUp[`time_getUp`]) {
                        updateCountdownStandUp(dataGetUp[`time_getUp`], dataGetUp[`getUp_start_alarm`], 'messageStandUpStart');
                    }
                }
            });
        });
    }
        
checkboxWater.addEventListener('change', function() {
    if(checkboxWater.checked){
        const time = parseInt(timeInputWater.value);
        const startAlarm = Date.now();
        startButtonPressed = true;
        document.getElementsByClassName('container-water')[0].classList.add('transition');
    
        if (isNaN(time) || time < 1 || time > 120) {
            showAlertInvalidNumber();
            checkboxWater.checked = false;
            document.getElementsByClassName('container-water')[0].classList.remove('transition');
            return;
        }
    
        updateCountdown(time); 
    
        chrome.storage.sync.set({ 
            [`timerOn_hydration`]: true,
            [`hydration_time`]: time,
            [`hydration_start_alarm`]: startAlarm,
            [`startButtonPressed_hydration`]: true
        }, () => {
            chrome.runtime.sendMessage({
                action: `saveNewHydration_Time`,
                tiempo: time,
                notificationTitle: chrome.i18n.getMessage('notification_hydrate_title'),
                notificationMessage: chrome.i18n.getMessage('notification_hydrate_message') 
            }, function (response) {
                if (response.success) {
                    console.log("Sincronización completa.");
                }
            });
        });
    
        if (startButtonPressed) {            
            actualizarEstadoUI();
        }
    } else {
        stopButtonPressed = true;
        document.getElementsByClassName('container-water')[0].classList.remove('transition');
        chrome.runtime.sendMessage({ action: `turnOffTimer_hydrate` }, function () {
            if (stopButtonPressed) {
            chrome.storage.sync.set({ [`timerOn_hydration`]: false });
            chrome.storage.sync.set({ [`startButtonPressed_hydration`]: false });
            clearInterval(cuentaAtrasIntervalId);
            chrome.storage.sync.remove([`hydration_start_alarm`], function() {
                console.log('Notificaciones deshabilitadas.');
            });
        } 
        });
    }
})

checkboxStand.addEventListener('click', function () {
    if(checkboxStand.checked){
        const time = parseInt(timeInputStandUp.value);
        const startAlarm = Date.now();
        startButtonGetStandUp = true;
        document.getElementsByClassName('container-stand')[0].classList.add('transition');

        if (isNaN(time) || time < 1 || time > 120) {
            showAlertInvalidNumber();
            checkboxStand.checked = false;
            document.getElementsByClassName('container-stand')[0].classList.remove('transition');
            return;
        }
        
        updateCountdownStandUp(time); 
    
        chrome.storage.sync.set({
            [`startTimer_getUp`]: true,
            [`time_getUp`]: time,
            [`getUp_start_alarm`]: startAlarm,
            [`startButtonPressed_GetUp`]: true
        }, () => {
            chrome.runtime.sendMessage({ 
                action: `saveNewTimeGetUp`, 
                tiempo: time, 
                notificationTitle: chrome.i18n.getMessage('notification_stand_up_title'),
                notificationMessage: chrome.i18n.getMessage('notification_stand_up_message')
            }, function (response) {
                if (response.success) {
                }
            });
        });
    
            if (startButtonGetStandUp) {
                actualizarEstadoUI();
            }
    } else {
        stopButtonGetStandUp = true;
        document.getElementsByClassName('container-stand')[0].classList.remove('transition');
        chrome.runtime.sendMessage({ action: `turnOffTimer_getUp` }, function () {
            if (stopButtonGetStandUp) {
            chrome.storage.sync.set({ [`startTimer_getUp`]: false });
            chrome.storage.sync.set({ [`startButtonPressed_GetUp`]: false });
            clearInterval(cuentaAtrasIntervalId);
            chrome.storage.sync.remove([`getUp_start_alarm`], function() {
                console.log('Notificaciones deshabilitadas.');
            });
        } 
        });
    }
});
timeInputWater.addEventListener('input', function () {
    const time = parseInt(timeInputWater.value);
    if (!isNaN(time) && time >= 1 && time <= 120) {
        chrome.storage.sync.set({ hydration_time: time }, () => {
            console.log('Tiempo de hidratación guardado:', time);
        });
    }
});

timeInputStandUp.addEventListener('input', function () {
    const time = parseInt(timeInputStandUp.value);
    if (!isNaN(time) && time >= 1 && time <= 120) {
        chrome.storage.sync.set({ time_getUp: time }, () => {
            console.log('Tiempo para levantarse guardado:', time);
        });
    }
});

actualizarEstadoUI();
});

function updateCountdown(time, startAlarm) {
    if (!startAlarm) {
        startAlarm = Date.now();
    }

    clearInterval(cuentaAtrasIntervalId);

    const updateTimer = () => {
        const now = Date.now();
        const remainingTime = (startAlarm + (time * 60 * 1000)) - now;

        if (remainingTime > 0) {
            const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
            const remainingSeconds = Math.floor((remainingTime / 1000) % 60);
            
            const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

        } else {
            clearInterval(cuentaAtrasIntervalId);

            const newStart = Date.now();
            chrome.storage.sync.set({ hydration_start_alarm: newStart }, () => {
                chrome.runtime.sendMessage({ action: 'mostrarNotificacion', tiempo: time });
                updateCountdown(time, newStart);
            });
        }
    };

    updateTimer();

    cuentaAtrasIntervalId = setInterval(updateTimer, 1000);
}

function updateCountdownStandUp(time, startAlarm) {
    if (!startAlarm) {
        startAlarm = Date.now();
    }

    clearInterval(countdownIntervalGetUp);

        const updateTimer = () => {
        const now = Date.now();
        const remainingTime = (startAlarm + (time * 60 * 1000)) - now;

        if (remainingTime > 0) {
            const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
            const remainingSeconds = Math.floor((remainingTime / 1000) % 60);
            const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

        } else {
            clearInterval(countdownIntervalGetUp);
            const newStart = Date.now();
            chrome.storage.sync.set({ [`getUp_start_alarm`]: newStart }, () => {
                chrome.runtime.sendMessage({ action: 'mostrarNotificacion', tiempo: time });
                updateCountdownStandUp(time, newStart);
            });
        }
    };
    updateTimer();

    cuentaAtrasIntervalId = setInterval(updateTimer, 1000);
}