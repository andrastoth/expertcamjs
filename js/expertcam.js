var ExpertCamJS = function(element) {
    var Version = {
        name: 'ExpertCamJS',
        version: '1.0.0.',
        author: 'Tóth András'
    };
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    var videoSelect, ausioSelect, w, h;
    var video = typeof element === 'string' ? document.querySelector(element) : element,
        streams = {},
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
        noSignal: 'img/no_signal.png',
        cameraSuccess: function(stream) {
            console.log('cameraSuccess');
        },
        canPlayFunction: function() {
            console.log('canPlayFunction');
        },
        getUserMediaError: function() {
            console.log('getUserMediaError');
        },
        cameraError: function(error) {
            console.log(error);
        }
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
            var element;
            if (typeof selector != 'object') {
                element = document.querySelector(selector);
            } else {
                element = selector;
            }
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
            if (navigator.getUserMedia) {
                navigator.getUserMedia(constraints, cameraSuccess, options.cameraError);
            } else {
                options.getUserMediaError();
                return false;
            }
            return true;
        }
        return false;
    }

    function gotSources(sourceInfos) {
        for (var i = 0; i !== sourceInfos.length; ++i) {
            var sourceInfo = sourceInfos[i];
            if (sourceInfo.kind === 'video') {
                var face = sourceInfo.facing === '' ? 'unknown' : sourceInfo.facing;
                var text = sourceInfo.label || 'camera ' + videoSelect.length + ' (facing: ' + face + ')';
                html('<option value="' + sourceInfo.id + '">' + text + '</option>', videoSelect);
            }
            if (sourceInfo.kind === 'audio') {
                var text = sourceInfo.label || 'Michrophone ' + audioSelect.length;
                html('<option value="' + sourceInfo.id + '">' + text + '</option>', audioSelect);
            }
        }
        videoSelect.children[0].setAttribute('selected', true);
        audioSelect.children[0].setAttribute('selected', true);
    }

    function buildSelectMenu(selectorVideo, selectorAudio) {
        videoSelect = document.querySelector(selectorVideo);
        audioSelect = document.querySelector(selectorAudio);
        videoSelect.innerHTML = '<option value="false">Off</option>';
        audioSelect.innerHTML = '<option value="false">Off</option>';
        if (typeof MediaStreamTrack.getSources !== 'undefined') {
            MediaStreamTrack.getSources(gotSources);
        } else {
            html('<option value="true">On</option>', audioSelect);
            html('<option value="true">On</option>', videoSelect);
        }
    }

    function cameraSuccess(stream) {
        video.controls = false;
        video.muted = true;
        localStream = stream;
        streams[stream.id] = stream;
        var url = window.URL || window.webkitURL;
        video.src = url ? url.createObjectURL(stream) : stream;
        options.cameraSuccess(stream);
        video.play();
    }

    function cameraError(error) {
        options.cameraError(error);
        return false;
    }

    function setEventListeners() {
        video.addEventListener('canplay', function(e) {
            isStreaming = true;
            options.canPlayFunction();
        }, false);
        video.addEventListener('play', function() {}, false);
    }

    function pause() {
        video.pause();
    }

    function stop(bol) {
        var src = bol ? '' : options.noSignal;
        noSignal(src);
        video.pause();
        for (var st in streams) {
            if (streams[st]) {
                streams[st].stop();
                streams[st] = null;
            }
        }
        localStream = null;
    }

    function play() {
        changeConstraints();
        if (!localStream) {
            init();
        }
        video.play();
    }

    function filter(type, val) {
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

    function getLastImageSrc() {
        var canvas = document.createElement('canvas');
        var ratio = video.videoWidth / video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL();
    }

    function localVideo(e) {
        stop(true);
        var input = html('<input type="file" accept="video/*;audio/*" style="display:none;">');
        input.onchange = function() {
            if (this.files[0].length !== 0) {
                video.src = URL.createObjectURL(this.files[0]);
                video.controls = true;
                video.muted = false;
            }
        };
        input.click();
    }

    function changeConstraints() {
        var constraints = JSON.parse(JSON.stringify(options.constraints));
        if (videoSelect && audioSelect) {
            switch (videoSelect.selectedOptions[0].value.toString()) {
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
                        sourceId: videoSelect.selectedOptions[0].value
                    }];
                    break;
            }
            switch (audioSelect.selectedOptions[0].value.toString()) {
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
                        sourceId: audioSelect.selectedOptions[0].value
                    }];
                    break;
            }
        }
        return constraints;
    }

    function optimalZoom(zoom) {
        return video.videoHeight / h;
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
            merge(target, arguments[a]);
        }
        return target;
    }

    function html(innerhtml, appendTo) {
        var item = document.createElement('div');
        if (innerhtml) {
            item.innerHTML = innerhtml;
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
        video.setAttribute('src', '');
    }
    noSignal(options.noSignal);
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
            }
            if (init()) {
                initialized = true;
                setEventListeners();
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
        stop: function(boolean) {
            stop(boolean);
            return this;
        },
        play: function(boolean) {
            play();
            return this;
        },
        getLastImageSrc: function() {
            return getLastImageSrc();
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
            filter(type, val);
            return this;
        },
        playLocalVideo: function(e) {
            localVideo(e);
        },
        toggleFullScreen: function() {
            fullScreen.toggleFullScreen(video);
            return this;
        },
        options: options,
        version: Version
    };
};