/*!
 * ExpertCamJQuery 2.2.0 javascript video-camera handler
 * Author: Tóth András
 * Web: http://atandrastoth.co.uk
 * email: atandrastoth@gmail.com
 * Licensed under the MIT license
 */
(function($, window, document, undefined) {
    'use strict';
    var pluginName = 'ExpertCamJQuery';
    var mediaDevices = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? navigator.mediaDevices : ((navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
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
    var video, Self;
    var videoSelect = null,
        audioSelect = null,
        isStreaming = false,
        localStream = null,
        initialized = false;
    var defaults = {
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
        audioBackground: 'media/edgeaudio.jpg',
        noSignalBackground: 'media/no_signal.png',
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

    function Plugin(element, options) {
        Self = this;
        this.element = element;
        video = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        return this;
    }
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
            var element = $(selector).get(0);
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
        $(video).attr('width', Self.options.width);
        $(video).attr('height', Self.options.height);
        var constraints = changeConstraints();
        if (constraints.video || constraints.audio) {
            try {
                mediaDevices.getUserMedia(constraints).then(cameraSuccess).catch(function(error) {
                    Self.options.cameraError(error);
                });
            } catch (error) {
                Self.options.getUserMediaError(error);
            }
        }
    }

    function gotSources(device) {
        var text, face;
        if (device.kind === 'video' || device.kind === 'videoinput') {
            face = (!device.facing || !device.facingMode || device.facing === '') ? 'unknown' : device.facing || device.facingMode;
            text = device.label || 'camera ' + videoSelect.children().length + ' (facing: ' + face + ')';
            videoSelect.append($('<option value="' + (device.id || device.deviceId) + '">' + text + '</option>'));
        }
        if (device.kind === 'audio' || device.kind === 'audioinput') {
            text = device.label || 'Michrophone ' + audioSelect.children().length;
            audioSelect.append($('<option value="' + (device.id || device.deviceId) + '">' + text + '</option>'));
        }
        videoSelect.children().eq(0).attr('selected', true);
        audioSelect.children().eq(0).attr('selected', true);
    }

    function buildSelectMenu(selectorVideo, selectorAudio) {
        videoSelect = $(selectorVideo);
        audioSelect = $(selectorAudio);
        videoSelect.html('<option value="false">Off</option>');
        audioSelect.html('<option value="false">Off</option>');
        try {
            if (mediaDevices && mediaDevices.enumerateDevices) {
                mediaDevices.enumerateDevices().then(function(devices) {
                    devices.forEach(function(device) {
                        gotSources(device);
                    });
                }).catch(function(error) {
                    Self.options.getDevicesError(error);
                });
            } else if (mediaDevices && !mediaDevices.enumerateDevices) {
                audioSelect.append($('<option value="true">On</option>'));
                videoSelect.append($('<option value="true">On</option>'));
                Self.options.getDevicesError(new NotSupportError('enumerateDevices Or getSources is Not supported'));
            } else {
                throw new NotSupportError('getUserMedia is Not supported');
            }
        } catch (error) {
            Self.options.getDevicesError(error);
        }
    }

    function cameraSuccess(stream) {
        video.controls = false;
        video.muted = true;
        localStream = stream;
        video.streamSrc(stream);
        Self.options.cameraSuccess(stream);
        video.play();
    }

    function cameraError(error) {
        Self.options.cameraError(error);
        return false;
    }

    function NotSupportError(message) {
        this.name = 'NotSupportError';
        this.message = (message || '');
    }
    NotSupportError.prototype = Error.prototype;

    function setEventListeners() {
        $(video).on('canplay', canPlay);
        $(video).on('play', nowPlay);
        $(video).on('loadedmetadata', loadedMetaData);
    }

    function nowPlay() {}

    function canPlay() {
        isStreaming = true;
        Self.options.canPlayFunction();
    }

    function loadedMetaData() {}

    function pause() {
        video.pause();
    }

    function stop(bol) {
        var src = bol ? '' : Self.options.noSignalBackground;
        setPoster(src);
        video.pause();
        if (localStream) {
            for (var i = 0; i < localStream.getTracks().length; i++) {
                localStream.getTracks()[i].stop();
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
        var canvas = $('<canvas>').get(0);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(type, quality);
    }

    function downloadCapturedImage(filename, type, quality) {
        var a = $('<a style="display:none;">');
        a.attr('href', captureToImage(type, quality));
        a.prop('download', filename);
        a.appendTo('body');
        a.get(0).click();
        setTimeout(function() {
            a.remove();
        }, 300);
    }

    function localVideo() {
        stop(true);
        var input = $('<input type="file" accept="*.*" multiple style="display:none;">');
        input.change(function() {
            [].forEach.call(this.files, function(file, index) {
                var fileType = file.type.toLocaleLowerCase();
                var fileName = file.name.toLocaleLowerCase();
                if (Self.options.videoTypes.split('|').indexOf(fileType) !== -1 || Self.options.audioTypes.split('|').indexOf(fileType) !== -1) {
                    // IE, srt must be load first ???
                    if (Self.options.audioTypes.split('|').indexOf(fileType) !== -1) {
                        setPoster(Self.options.audioBackground);
                    } else {
                        setPoster();
                    }
                    setTimeout(function() {
                        video.streamSrc(file);
                        video.controls = true;
                        video.muted = false;
                    }, 500);
                }
                if (Self.options.subTitleTypes.split('|').indexOf(fileName.split('.').reverse()[0]) !== -1) {
                    var reader = new FileReader();
                    reader.onload = (function(file) {
                        return function(e) {
                            processSubtitle(e.target.result);
                        };
                    })(file);
                    reader.readAsText(file, Self.options.subTitleCoding);
                }
            });
            input.remove();
        });
        input.appendTo('body');
        input.get(0).click();
    }

    function processSubtitle(e) {
        var subtitle = [];
        var rows = e.split('\n');
        var Sub = function() {
            this.from = 0;
            this.to = 0;
            this.innerHTML = '';
        };
        var tmp;
        var rowAdd = false;
        var start = false;
        [].forEach.call(rows, function(row, index) {
        	if (row.trim() === '1') {
                start = true;
            }
        	if(start){
	            if (row.trim() === '') {
	                subtitle.push(tmp);
	                rowAdd = false;
	            }
	            if (rowAdd) {
	                tmp.innerHTML += row.concat('\n');
	            }
	            if (row.indexOf('-->') !== -1) {
	                tmp = new Sub();
	                tmp.from = createTime(row.split('-->')[0].trim());
	                tmp.to = createTime(row.split('-->')[1].trim());
	                rowAdd = true;
	            }
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
        var time1 = new Date(2000, 1, 1, 0, 0, 0, 0);
        var time2 = new Date(2000, 1, 1, td[0], td[1], td[2], td[3]);
        return (time2.getTime() - time1.getTime()) / 1000;
    }

    function changeConstraints() {
        var constraints = JSON.parse(JSON.stringify(Self.options.constraints));
        if (videoSelect && audioSelect) {
            switch (videoSelect.val().toString()) {
                case 'true':
                    if (navigator.userAgent.search("Edge") == -1 && navigator.userAgent.search("Chrome") != -1) {
                        constraints.video.optional = [{
                            sourceId: true
                        }];
                    } else {
                        constraints.video.deviceId = undefined;  
                    }
                    break;
                case 'false':
                    constraints.video = false;
                    break;
                default:
                    if (navigator.userAgent.search("Edge") == -1 && navigator.userAgent.search("Chrome") != -1) {
                        constraints.video.optional = [{
                            sourceId: videoSelect[videoSelect.selectedIndex].value
                        }];
                    } else if (navigator.userAgent.search("Firefox") != -1) {
                        constraints.video.deviceId = {
                            exact: videoSelect.val()
                        };
                    } else {
                         constraints.video.deviceId = videoSelect.val();
                    }
                    break;
            }
            switch (audioSelect.val().toString()) {
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
                        sourceId: audioSelect.val()
                    }];
                    break;
            }
        }
        return constraints;
    }

    function cloneVideo() {
        var clone = $(video).clone(true);
        clone.insertBefore(video);
        $(video).remove();
        video = clone.get(0);
        video.controls = false;
        video.muted = true;
        setEventListeners();
    }

    function setPoster(src) {
        if (src) {
            video.poster = src;
        } else {
            video.poster = '';
        }
        video.pause();
        video.streamSrc();
        cloneVideo();
    }
    $.extend(Plugin.prototype, {
        init: function(opt) {
            if (initialized) {
                return this;
            }
            if (!video || video.tagName.toLowerCase() !== 'video') {
                alert('Element type must be video!');
                return false;
            }
            if (opt) {
                this.options = mergeRecursive(this.options, opt);
                setPoster(this.options.noSignalBackground);
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
        getLastImageSrc: function() {
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
                container = new Q(container);
            } else {
                container = video;
            }
            fullScreen.toggleFullScreen(container);
            return this;
        }
    });
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };
})(jQuery, window, document);