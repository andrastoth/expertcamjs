/*!
 * ExpertCamJQuery 2.0.0 javascript video-camera handler
 * Author: Tóth András
 * Web: http://atandrastoth.co.uk
 * email: atandrastoth@gmail.com
 * Licensed under the MIT license
 */
(function(undefined) {
    'use strict';
    var play = $('#play'),
        localVideo = $('#local-video'),
        videoSelect = $('#video-select'),
        audioSelect = $('#audio-select'),
        shootImg = $('#shoot-img'),
        shoot = $('#shoot'),
        pause = $('#pause'),
        record = $('#record'),
        streaming = $('#streaming'),
        streamVideo = $('#stream-video').get(0),
        streamText = $('#result .caption h3').eq(0);
    $(streamVideo).on('onended', function(e) {
        this.removeAttribute('src');
    });
    var isWebpSupport = !!navigator.webkitGetUserMedia || (navigator.mediaDevices && navigator.userAgent.indexOf('Edge') !== -1);
    var camera;
    var args = {
        getDevicesError: function(error) {
            var p, message = 'Error detected with the following parameters:\n';
            for (p in error) {
                message += p + ': ' + error[p] + '\n';
            }
            alert(message);
        },
        getUserMediaError: function(error) {
            var p, message = 'Error detected with the following parameters:\n';
            for (p in error) {
                message += p + ': ' + error[p] + '\n';
            }
            alert(message);
        },
        cameraError: function(error) {
            var p, message = "Error detected with the following parameters:\n";
            if (error.name == "NotSupportedError" || (error.name == "PermissionDeniedError" && error.message == "Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).")) {
                var ans = confirm("Your browser does not support getUserMedia via HTTP!\n(see: https://goo.gl/Y0ZkNV).\n You want to see github demo page in a new window?");
                if (ans) {
                    window.open("https://andrastoth.github.io/expertcamjs/");
                }
            } else {
                for (p in error) {
                    message += p + ": " + error[p] + "\n";
                }
                alert(message);
            }
        },
        cameraSuccess: function() {
            toggleClass([streaming, record], 'disabled', false);
        }
    };
    Page.On = function() {
        if (!camera) {
            camera = $('#camera-canvas').ExpertCamJQuery(args).data().plugin_ExpertCamJQuery;
            camera.buildSelectMenu('#video-select', '#audio-select').init();
            window.cc = camera;
        } else {
            camera.stop();
            streamVideo.streamSrc();
        }
        toggleClass([record, shoot, pause], 'disabled', true);
        toggleClass([localVideo, play], 'disabled', false);
        toggleClass([audioSelect, videoSelect], 'disabled', false);
        audioSelect.attr('disabled', false);
        videoSelect.attr('disabled', false);
    };
    Page.Play = function() {
        if (videoSelect.get(0).selectedIndex !== 0 || audioSelect.get(0).selectedIndex !== 0) {
            camera.play();
            toggleClass([shoot, pause, streaming], 'disabled', false);
            audioSelect.attr('disabled', true);
            videoSelect.attr('disabled', true);
        }
    };
    Page.Streaming = function() {
        streamText.text('Captured stream');
        streamVideo.controls = false;
        streamVideo.muted = true;
        if (camera && camera.getStream()) {
            streamVideo.streamSrc(camera.getStream());
        } else {
            streamVideo.streamSrc();
        }
    };
    Page.Stop = function() {
        if (camera.isInitialized()) {
            camera.pause();
        }
    };
    Page.Shoot = function() {
        if (camera) {
            var src = camera.getLastImageSrc();
            shootImg.attr('src', src);
        }
    };
    Page.LocalVideo = function() {
        if (camera) {
            toggleClass([record, streaming, play, pause], 'disabled', true);
            toggleClass([shoot], 'disabled', false);
            camera.playLocalVideo();
        }
    };
    Page.FullScreen = function() {
        if (camera) {
            camera.toggleFullScreen();
        }
    };
    Page.StartRecord = function() {
        streamVideo.removeAttribute('src');
        var stream = camera.getStream();
        if (stream) {
            toggleClass([record], 'disabled', true);
            var filename = (new Date().getTime().toString());
            var multiStreamRecorder;
            var hasAudio = Boolean(stream.getAudioTracks().length);
            var hasVideo = Boolean(stream.getVideoTracks().length);
            if (hasAudio && hasVideo && !isWebpSupport) {
                multiStreamRecorder = new MediaStreamRecorder(stream);
                multiStreamRecorder.mimeType = 'video/webm';
                multiStreamRecorder.width = camera.options.width;
                multiStreamRecorder.height = camera.options.height;
            } else if (hasAudio && hasVideo && isWebpSupport) {
                multiStreamRecorder = new MultiStreamRecorder(stream);
                multiStreamRecorder.video = camera.getVideo();
                multiStreamRecorder.width = camera.options.width;
                multiStreamRecorder.height = camera.options.height;
                multiStreamRecorder.audioChannels = 1;
            } else if (hasAudio && !hasVideo) {
                multiStreamRecorder = new MediaStreamRecorder(stream);
                multiStreamRecorder.mimeType = 'audio/ogg';
                multiStreamRecorder.audioChannels = 1;
            } else if (!hasAudio && hasVideo) {
                multiStreamRecorder = new MediaStreamRecorder(stream);
                multiStreamRecorder.mimeType = 'video/webm';
                multiStreamRecorder.width = camera.options.width;
                multiStreamRecorder.height = camera.options.height;
            }
            multiStreamRecorder.ondataavailable = function(blob) {
                /*Without upload*/
                var url = window.URL || window.webkitURL;
                if (isWebpSupport && hasAudio && hasVideo) {
                    window.open(url.createObjectURL(blob.video));
                    window.open(url.createObjectURL(blob.audio));
                } else {
                    window.open(url.createObjectURL(blob));
                }
                /*With upload*/
                /*
                streamVideo.src = 'media/loading.webm';
                streamText.text('Processing video');
                streamVideo.controls = false;
                streamVideo.loop = true;
                var data = new FormData();
                if (isWebpSupport && hasAudio && hasVideo) {
                    data.append('audio-filename', filename + '.ogg');
                    data.append('audio-blob', blob.audio);
                    data.append('video-filename', filename + '.webm');
                    data.append('video-blob', blob.video);
                } else if (hasVideo) {
                    data.append('video-filename', filename + '.webm');
                    data.append('video-blob', blob);
                } else {
                    data.append('audio-filename', filename + '.ogg');
                    data.append('audio-blob', blob);
                }
                xhr('save.php', data, function(fileURL) {
                    if (validURL(fileURL)) {
                        streamVideo.src = fileURL;
                        streamText.text('Recorded stream');
                        streamVideo.controls = true;
                        streamVideo.loop = false;
                        streamVideo.muted = false;
                    } else {
                        alert(fileURL);
                    }
                });
                */
            };
            setTimeout(function() {
                multiStreamRecorder.stop();
            }, 5E3);
            multiStreamRecorder.start(5E3);
            countDown(5E3);
        }
    };
    Page.changeBlurCSS = function(el) {
        camera.cssFilter('blur', el.value.toString() + 'px');
        $('#blur-value').text('Blur: ' + el.value.toString() + 'px');
    };
    Page.changeBrightnessCSS = function(el) {
        camera.cssFilter('brightness', el.value);
        $('#brightness-value').text('Brightness: ' + el.value.toString());
    };
    Page.changeGrayscaleCSS = function(el) {
        camera.cssFilter('grayscale', el.value);
        $('#grayscale-value').text('Grayscale: ' + el.value.toString());
    };
    Page.changeContrastCSS = function(el) {
        camera.cssFilter('contrast', el.value);
        $('#contrast-value').text('Contrast: ' + el.value.toString());
    };
    Page.changeInvertCSS = function(el) {
        camera.cssFilter('invert', el.value);
        $('#invert-value').text('Invert: ' + el.value.toString());
    };
    Page.changeSepiaCSS = function(el) {
        camera.cssFilter('sepia', el.value);
        $('#sepia-value').text('Sepia: ' + el.value.toString());
    };
    Page.changeHueCSS = function(el) {
        camera.cssFilter('hue-rotate', el.value.toString() + 'deg');
        $('#hue-value').text('Hue: ' + el.value.toString() + 'deg');
    };
    Page.changeSaturateCSS = function(el) {
        camera.cssFilter('saturate', el.value);
        $('#saturate-value').text('Saturate: ' + el.value);
    };

    function countDown(time) {
        var t = time;
        toggleClass([record], 'btn-danger', true);
        record.html('<span>&nbsp;' + t / 1E3 + '&nbsp;</span>');
        var count = setInterval(function() {
            t -= 1E3;
            record.html('<span>&nbsp;' + t / 1E3 + '&nbsp;</span>');
            if (t === 0) {
                window.scrollTo(0, offset(streamVideo).top - 100);
                clearInterval(count);
                toggleClass([record], 'disabled', false);
                record.html('<span class="glyphicon glyphicon-record""></span>');
                toggleClass([record], 'btn-danger', false);
            }
        }, 1E3);
    }

    function offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft
        };
    }

    function xhr(url, data, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status == 200) {
                callback(request.responseText);
            }
        };
        request.open('POST', url);
        request.send(data);
    }

    function validURL(str) {
        return /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(str);
    }

    function toggleClass(el, cl, bol) {
        $(el).each(function(index, element) {
            if (eval(bol)) {
                element.addClass(cl);
            } else {
                element.removeClass(cl);
            }
        });
    }
}).call(window.Page = window.Page || {});