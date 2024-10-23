import { initInputComponent } from './inputComponent.js';
let cuentaAtrasIntervalId;
let countdownIntervalGetUp;

const languageSelector = document.getElementById('language-selector');

languageSelector.addEventListener('change', (event) => {
    const lang = event.target.value;

    chrome.storage.sync.set({ language: lang }, () => {
        changeLanguage(lang);
    });
});

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
    const buttonStop = document.getElementById('stop');
    const buttonStopStandUp = document.getElementById('stopStandUp');
    const buttonStart = document.getElementById('start');
    const buttonStartStandUp = document.getElementById('startStandUp');
    const timeInputWater = document.getElementById('waterTime');
    const timeInputStandUp = document.getElementById('standUpTime');
    const inputs = [document.getElementById('waterTime'), document.getElementById('standUpTime')];
    let startButtonPressed = false;
    let stopButtonPressed = false;
    const rangeInput = document.getElementById('waterTime');
    const textInput = document.getElementById('textInput');

    initInputComponent();

    window.onload = function() {
    chrome.storage.sync.get(['extensionJustActivated'], function (result) {
        if (result.extensionJustActivated) {
            buttonStop.click();
            buttonStopStandUp.click();
            chrome.storage.sync.set({ extensionJustActivated: false });
        }
    });
    }
    
    chrome.storage.sync.get(['language'], (result) => {
        const lang = result.language || 'es';
        languageSelector.value = lang;
        changeLanguage(lang);
    });
    
    chrome.storage.sync.get([`timerOn_hydration`], function (data) {
        if (data[`timerOn_hydration`]) {
            buttonStop.classList.remove('disabled');
            buttonStop.disabled = false;
            buttonStart.classList.add('disabled');
            buttonStart.disabled = true;
        } else {
            buttonStop.classList.add('disabled');
            buttonStop.disabled = true;
            buttonStart.classList.remove('disabled');
            buttonStart.disabled = false;
        }
    });

    chrome.storage.sync.get([`startTimer_getUp`], function (data) {
        if (data[`startTimer_getUp`]) {
            buttonStopStandUp.classList.remove('disabled');
            buttonStopStandUp.disabled = false;
            buttonStartStandUp.classList.add('disabled');
            buttonStartStandUp.disabled = true;
        } else {
            buttonStopStandUp.classList.add('disabled');
            buttonStopStandUp.disabled = true;
            buttonStartStandUp.classList.remove('disabled');
            buttonStartStandUp.disabled = false;
        }
    });

    buttonStop.classList.add('disabled');
    buttonStopStandUp.classList.add('disabled');

    function actualizarEstadoUI() {
        chrome.storage.sync.get([`timerOn_hydration`, `hydration_time`, `hydration_start_alarm`, `startButtonPressed_hydration`], function (data) {
            if (data[`startButtonPressed_hydration`]) {
                document.getElementById('messageWaterStop').style.display = 'none';
                document.getElementById('messageWaterStart').style.display = 'block';
    
                if (data[`hydration_start_alarm`] && data[`hydration_time`]) {
                    updateCountdown(data[`hydration_time`], data[`hydration_start_alarm`], 'messageWaterStart');
                }
            } else {
                buttonStart.disabled = false;
                buttonStart.classList.remove('disabled');
                document.getElementById('messageWaterStart').style.display = 'none';
            }
    
            chrome.storage.sync.get([`startTimer_getUp`, `time_getUp`, `getUp_start_alarm`, `startButtonPressed_GetUp`], function (dataGetUp) {
                if (dataGetUp[`startButtonPressed_GetUp`]) {
                    document.getElementById('messageStandUpStop').style.display = 'none';
                    document.getElementById('messageStandUpStart').style.display = 'block';
    
                    if (dataGetUp[`getUp_start_alarm`] && dataGetUp[`time_getUp`]) {
                        updateCountdownStandUp(dataGetUp[`time_getUp`], dataGetUp[`getUp_start_alarm`], 'messageStandUpStart');
                    }
                } else {
                    buttonStartStandUp.disabled = false;
                    buttonStartStandUp.classList.remove('disabled');
                    // document.getElementById('messageStandUpStop').style.display = 'block';
                    document.getElementById('messageStandUpStart').style.display = 'none';
                }
            });
        });
    }
    
    

    buttonStop.addEventListener('click', function () {
        stopButtonPressed = true;
            chrome.runtime.sendMessage({ action: `turnOffTimer_hydrate` }, function () {
                if (stopButtonPressed) {
                // buttonStop.classList.add('stop');
                // buttonStop.classList.remove('apagar');
                chrome.storage.sync.set({ [`timerOn_hydration`]: false });
                chrome.storage.sync.set({ [`startButtonPressed_hydration`]: false });
                clearInterval(cuentaAtrasIntervalId); // Limpiar el intervalo del temporizador
                // document.getElementById('messageWaterStop').style.display = 'block';
                document.getElementById('messageWaterStart').style.display = 'none';
                buttonStart.disabled = false;
                buttonStart.classList.remove('disabled');
                buttonStop.disabled = true;
                buttonStop.classList.add('disabled');
                chrome.storage.sync.remove([`hydration_start_alarm`], function() {
                    console.log('Notificaciones deshabilitadas.');
                });
            } else{
                
            }
            });
    });

    buttonStopStandUp.addEventListener('click', function () {
        stopButtonPressed = true; 

            chrome.runtime.sendMessage({ action: `turnOffTimer_getUp` }, function () {
                if (stopButtonPressed) {
                    // buttonStopStandUp.classList.add('stop');
                    // buttonStopStandUp.classList.remove('apagar');
                    chrome.storage.sync.set({ [`startTimer_getUp`]: false });
                    chrome.storage.sync.set({ [`startButtonPressed_GetUp`]: false });            
                    clearInterval(countdownIntervalGetUp);
                    // document.getElementById('messageStandUpStop').style.display = 'block';
                    document.getElementById('messageStandUpStart').style.display = 'none';
                    
                    buttonStartStandUp.disabled = false;
                    buttonStartStandUp.classList.remove('disabled');
                    buttonStopStandUp.disabled = true;
                    buttonStopStandUp.classList.add('disabled');

                    chrome.storage.sync.remove([`getUp_start_alarm`], function () {
                        console.log('Notificaciones deshabilitadas.');
                    });
                }
            });
    });
    
buttonStart.addEventListener('click', function () {
    const time = parseInt(timeInputWater.value);
    const startAlarm = Date.now();  // Momento actual
    startButtonPressed = true;

    if (isNaN(time) || time < 1 || time > 120) {
        showAlertInvalidNumber();
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
        buttonStop.disabled = false;
        buttonStop.classList.remove('disabled');
        buttonStart.disabled = true;
        buttonStart.classList.add('disabled');
        document.getElementById('messageWaterStop').style.display = 'none';
        document.getElementById('messageWaterStart').style.display = 'block';
        actualizarEstadoUI();
    }
});

    

    buttonStartStandUp.addEventListener('click', function () {
        const time = parseInt(timeInputStandUp.value);
        const startAlarm = Date.now();
    
        if (isNaN(time) || time < 1 || time > 120) {
            showAlertInvalidNumber();
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
                notificationTitle: chrome.i18n.getMessage('notification_stand_up_title'), // Título de la notificación traducido
                notificationMessage: chrome.i18n.getMessage('notification_stand_up_message') // Mensaje de la notificación traducido
            }, function (response) {
                if (response.success) {
                }
            });
        });
    
            buttonStopStandUp.disabled = false;
            buttonStopStandUp.classList.remove('disabled');
            buttonStartStandUp.disabled = true;
            buttonStartStandUp.classList.add('disabled');
            document.getElementById('messageStandUpStop').style.display = 'none';
            document.getElementById('messageStandUpStart').style.display = 'block';
            actualizarEstadoUI();
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
        const messageId = 'messageWaterStart';

        if (remainingTime > 0) {
            const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
            const remainingSeconds = Math.floor((remainingTime / 1000) % 60);
            
            const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

            document.getElementById(messageId).innerText = `${remainingMinutes} : ${formattedSeconds}`;
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
        const messageId = 'messageStandUpStart';

        if (remainingTime > 0) {
            const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
            const remainingSeconds = Math.floor((remainingTime / 1000) % 60);
            const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

            document.getElementById(messageId).innerText = `${remainingMinutes} : ${formattedSeconds}`;
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