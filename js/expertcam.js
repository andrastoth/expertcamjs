/*!
 * ExpertCamJS 1.7.0 javascript video-camera handler
 * Author: Tóth András
 * Web: http://atandrastoth.co.uk
 * email: atandrastoth@gmail.com
 * Licensed under the MIT license
 */
var ExpertCamJS = function(element) {
    'use strict';
    var Version = {
        name: 'ExpertCamJS',
        version: '1.7.0.',
        author: 'Tóth András'
    };
    var video = Q(element);
    var streams = {},
        videoSelect = null,
        audioSelect = null,
        isStreaming = false,
        localStream = null,
        initialized = false;
    var options = {
        width: 320,
        height: 240,
        constraints: {
            video: {
                mandatory: {
                    maxWidth: 1280,
                    maxHeight: 720
                },
                optional: [{
                    sourceId: true
                }]
            },
            audio: true
        },
        noSignal: 'media/no_signal.png',
        videoTypes: 'video/mp4|video/webm|video/avi',
        audioTypes: 'audio/wav|audio/mp3|audio/ogg|audio/mp3',
        subTitleTypes: 'srt',
        subTitleCoding: 'utf-8',
        cameraSuccess: function(stream) {
            console.log('cameraSuccess');
        },
        canPlayFunction: function() {
            console.log('canPlayFunction');
        },
        getDevicesError: function(error) {
            console.log(error);
        },
        getUserMediaError: function(error) {
            console.log(error);
        },
        cameraError: function(error) {
            console.log(error);
        }
    };
    var mediaDevices = navigator.mediaDevices || ((navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
        getUserMedia: function(c) {
            return new Promise(function(y, n) {
                (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
            });
        },
        enumerateDevices: function(c) {
            return new Promise(function(c, y, n) {
                (MediaStreamTrack.getSources).call(navigator, c, y, n);
            });
        }
    } : null);
    HTMLVideoElement.prototype.streamSrc = ('srcObject' in HTMLVideoElement.prototype) ? function(stream) {
        this.srcObject = !!stream ? stream : null;
    } : function(stream) {
        this.src = !!stream ? (window.URL || window.webkitURL).createObjectURL(stream) : new String();
    };
    var fullScreen = {
        isFullScreen: document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen || document.msIsFullScreen,
        toggleFullScreen: function(selector) {
            if (!this.isFullScreen) {
                this.goFullScreen(selector);
            } else {
                this.exitFullScreen();
            }
            return this.isFullScreen;
        },
        goFullScreen: function(selector) {
            var element = Q(selector);
            if (element.requestFullScreen) {
                element.requestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        },
        exitFullScreen: function() {
            if (document.exitFullScreen) {
                document.exitFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    function init() {
        video.setAttribute('width', options.width);
        video.setAttribute('height', options.height);
        var constraints = changeConstraints();
        if (constraints.video || constraints.audio) {
            try {
                mediaDevices.getUserMedia(constraints).then(cameraSuccess).catch(function(error) {
                    options.cameraError(error);
                });
            } catch (error) {
                options.getUserMediaError(error);
            }
        }
    }

    function gotSources(device) {
        if (device.kind === 'video' || device.kind === 'videoinput') {
            var face = (!device.facing || !device.facingMode || device.facing === '') ? 'unknown' : device.facing || device.facingMode;
            var text = device.label || 'camera ' + videoSelect.length + ' (facing: ' + face + ')';
            html('<option value="' + (device.id || device.deviceId) + '">' + text + '</option>', videoSelect);
        }
        if (device.kind === 'audio' || device.kind === 'audioinput') {
            var text = device.label || 'Michrophone ' + audioSelect.length;
            html('<option value="' + (device.id || device.deviceId) + '">' + text + '</option>', audioSelect);
        }
        videoSelect.children[0].setAttribute('selected', true);
        audioSelect.children[0].setAttribute('selected', true);
    }

    function buildSelectMenu(selectorVideo, selectorAudio) {
        videoSelect = Q(selectorVideo);
        audioSelect = Q(selectorAudio);
        videoSelect.innerHTML = '<option value="false">Off</option>';
        audioSelect.innerHTML = '<option value="false">Off</option>';
        try {
            if (mediaDevices && mediaDevices.enumerateDevices) {
                mediaDevices.enumerateDevices().then(function(devices) {
                    devices.forEach(function(device) {
                        gotSources(device);
                    });
                }).catch(function(error) {
                    options.getDevicesError(error);
                });
            } else if (mediaDevices && !mediaDevices.enumerateDevices) {
                html('<option value="true">On</option>', audioSelect);
                html('<option value="true">On</option>', videoSelect);
                options.getDevicesError(new NotSupportError('enumerateDevices Or getSources is Not supported'));
            } else {
                throw new NotSupportError('getUserMedia is Not supported');
            }
        } catch (error) {
            options.getDevicesError(error);
        }
    }

    function cameraSuccess(stream) {
        video.controls = false;
        video.muted = true;
        localStream = stream;
        streams[stream.id] = stream;
        video.streamSrc(stream);
        options.cameraSuccess(stream);
        video.play();
    }

    function cameraError(error) {
        options.cameraError(error);
        return false;
    }

    function NotSupportError(message) {
        this.name = 'NotSupportError';
        this.message = (message || '');
    }
    NotSupportError.prototype = Error.prototype;

    function setEventListeners() {
        video.addEventListener('canplay', canPlay, false);
        video.addEventListener('play', nowPlay, false);
        video.addEventListener('loadedmetadata', loadedMetaData, false);
    }

    function nowPlay() {}

    function canPlay() {
        isStreaming = true;
        options.canPlayFunction();
    }

    function loadedMetaData() {}

    function pause() {
        video.pause();
    }

    function stop(bol) {
        var src = bol ? '' : options.noSignal;
        noSignal(src);
        video.pause();
        for (var st in streams) {
            if (streams[st]) {
                try {
                    streams[st].stop();
                } catch (e) {
                    streams[st].active = false;
                    streams[st].enabled = false;
                }
                delete streams[st];
            }
        }
        localStream = null;
    }

    function play() {
        if (!initialized) {
            initialized = true;
            setEventListeners();
        }
        if (!localStream) {
            changeConstraints();
            init();
        }
        video.play();
    }

    function cssFilter(type, val) {
        var filterType = typeof video.style.webkitFilter !== 'undefined' ? 'webkitFilter' : 'filter';
        var filters = video.style[filterType].split(' ');
        for (var filter in filters) {
            if (filters[filter].indexOf(type) != -1) {
                filters[filter] = type + '(' + val + ') ';
                video.style[filterType] = filters.join(' ');
                return;
            }
        }
        video.style[filterType] += type + '(' + val + ') ';
    }

    function captureToImage(type, quality) {
        type = !!type ? type : 'image/png';
        quality = !!quality ? quality : 1.0;
        var canvas = document.createElement('canvas');
        var ratio = video.videoWidth / video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(type, quality);
    }

    function downloadCapturedImage(filename, type, quality) {
        var a = window.document.createElement('a');
        a.href = captureToImage(type, quality);
        a.download = filename;
        a.click();
    }

    function localVideo() {
        stop(true);
        var input = html('<input type="file" accept="*.*" multiple>');
        input.onchange = function() {
            [].forEach.call(this.files, function(file, index) {
                var fileType = file.type.toLocaleLowerCase();
                var fileName = file.name.toLocaleLowerCase();
                if (options.videoTypes.split('|').indexOf(fileType) !== -1 || options.audioTypes.split('|').indexOf(fileType) !== -1) {
                    // IE, srt must be load first ???
                    setTimeout(function() {
                        video.src = URL.createObjectURL(file);
                        video.controls = true;
                        video.muted = false;
                    }, 500);
                }
                if (options.subTitleTypes.split('|').indexOf(fileName.split('.').reverse()[0]) !== -1) {
                    var reader = new FileReader();
                    reader.onload = (function(file) {
                        return function(e) {
                            processSubtitle(e.target.result);
                        };
                    })(file);
                    reader.readAsText(file, options.subTitleCoding);
                }
            });
        };
        input.click();
    }

    function processSubtitle(e) {
        var subtitle = [];
        var rows = e.split('\n');
        var sub = function() {
            this.from = 0;
            this.to = 0;
            this.innerHTML = '';
        };
        var tmp;
        var rowAdd = false;
        var textTrk;
        [].forEach.call(rows, function(row, index) {
            if (row.trim() === '') {
                subtitle.push(tmp);
                rowAdd = false;
            }
            if (rowAdd) {
                tmp.innerHTML += row.concat('\n');
            }
            if (row.indexOf('-->') !== -1) {
                tmp = new sub();
                tmp.from = createTime(row.split('-->')[0].trim());
                tmp.to = createTime(row.split('-->')[1].trim());
                rowAdd = true;
            }
        });
        subtitle.push(tmp);
        var track = video.addTextTrack('subtitles', 'srt', 'en');
        track.mode = 'showing';
        subtitle.forEach(function(sub, index) {
            track.addCue(new(window.VTTCue || window.TextTrackCue)(sub.from, sub.to, sub.innerHTML));
        });
        track.mode = 'showing';
    }

    function createTime(data) {
        var td = data.replace(/\D/g, '|').split('|');
        var time1 = new Date('2000', '01', '01', '00', '00', '00', '000');
        var time2 = new Date('2000', '01', '01', td[0], td[1], td[2], td[3]);
        return (time2.getTime() - time1.getTime()) / 1000;
    }

    function changeConstraints() {
        var constraints = JSON.parse(JSON.stringify(options.constraints));
        if (videoSelect && audioSelect) {
            switch (videoSelect[videoSelect.selectedIndex].value.toString()) {
                case 'true':
                    constraints.video.optional = [{
                        sourceId: true
                    }];
                    break;
                case 'false':
                    constraints.video = false;
                    break;
                default:
                    constraints.video.optional = [{
                        sourceId: videoSelect[videoSelect.selectedIndex].value
                    }];
                    break;
            }
            switch (audioSelect[audioSelect.selectedIndex].value.toString()) {
                case 'true':
                    constraints.audio.optional = [{
                        sourceId: true
                    }];
                    break;
                case 'false':
                    constraints.audio = false;
                    break;
                default:
                    constraints.video.optional = [{
                        sourceId: audioSelect[audioSelect.selectedIndex].value
                    }];
                    break;
            }
        }
        return constraints;
    }

    function optimalZoom(zoom) {
        return video.videoHeight / h;
    }

    function cloneVideo() {
        var clone = video.cloneNode(true);
        (video.parentElement || video.parentNode).insertBefore(clone, video);
        removeElement(video);
        video = clone;
        video.controls = false;
        video.muted = true;
        setEventListeners();
    }

    function Q(el) {
        if (typeof el === 'string') {
            var els = document.querySelectorAll(el);
            return typeof 'undefined' === els ? undefined : els.length > 1 ? els : els[0];
        }
        return el;
    }

    function removeElement(el) {
        el && el.parentNode && el.parentNode.removeChild(el);
    }

    function mergeRecursive(target, source) {
        if (typeof target !== 'object') {
            target = {};
        }
        for (var property in source) {
            if (source.hasOwnProperty(property)) {
                var sourceProperty = source[property];
                if (typeof sourceProperty === 'object') {
                    target[property] = mergeRecursive(target[property], sourceProperty);
                    continue;
                }
                target[property] = sourceProperty;
            }
        }
        for (var a = 2, l = arguments.length; a < l; a++) {
            mergeRecursive(target, arguments[a]);
        }
        return target;
    }

    function html(innerinnerHTML, appendTo) {
        var item = document.createElement('div');
        if (innerinnerHTML) {
            item.innerHTML = innerinnerHTML;
        }
        if (appendTo) {
            appendTo.appendChild(item.children[0]);
            return item;
        }
        return item.children[0];
    }

    function noSignal(src) {
        if (src) {
            video.poster = src;
        } else {
            video.poster = '';
        }
        video.pause();
        video.streamSrc();
        cloneVideo();
    }
    return {
        init: function(opt) {
            if (initialized) {
                return this;
            }
            if (!video || video.tagName.toLowerCase() !== 'video') {
                alert('Element type must be video!');
                return false;
            }
            if (opt) {
                options = mergeRecursive(options, opt);
                noSignal(options.noSignal);
            }
            return this;
        },
        buildSelectMenu: function(selectorVideo, selectorAudio) {
            buildSelectMenu(selectorVideo, selectorAudio);
            return this;
        },
        pause: function() {
            pause();
            return this;
        },
        stop: function(bol) {
            stop(bol);
            return this;
        },
        play: function() {
            play();
            return this;
        },
        getLastImageSrc: function(){
            return captureToImage();
        },
        captureToImage: function(type, quality) {
            return captureToImage(type, quality);
        },
        downloadCapturedImage: function(filename, type, quality) {
            downloadCapturedImage(filename, type, quality);
        },
        isInitialized: function() {
            return initialized;
        },
        getStream: function() {
            return localStream;
        },
        getVideo: function() {
            return video;
        },
        cssFilter: function(type, val) {
            cssFilter(type, val);
            return this;
        },
        playLocalVideo: function() {
            localVideo();
        },
        toggleFullScreen: function(container) {
            if (container) {
                container = Q(container);
            } else {
                container = video;
            }
            fullScreen.toggleFullScreen(container);
            return this;
        },
        options: options,
        version: Version
    };
};