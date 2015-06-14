(function(undefined) {
    var Q = function(sel) {
        var els = document.querySelectorAll(sel);
        return els.length > 1 ? els : els[0];
    };
    var txt = 'innerText' in HTMLElement.prototype ? 'innerText' : 'textContent';
    var play = Q('#play'),
        localVideo = Q('#local-video'),
        videoSelect = Q('#video-select'),
        audioSelect = Q('#audio-select'),
        shootImg = Q('#shoot-img'),
        shoot = Q('#shoot'),
        stop = Q('#stop'),
        record = Q('#record'),
        streaming = Q('#streaming'),
        streamVideo = Q('#stream-video'),
        streamText = Q('#result .caption h3')[1];
    streamVideo.onended = function(e) {
        this.removeAttribute('src');
    };
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isChrome = !!window.chrome && !isOpera;
    var camera;
    var args = {
        getUserMediaError: function() {
            alert('Sorry, the browser you are using does not support getUserMedia');
        },
        cameraError: function(error) {
            var p, message = 'Error detected with the following parameters:\n';
            for (p in error) {
                message += p + ': ' + error[p] + '\n';
            }
            alert(message);
        },
        cameraSuccess: function() {
            toggleClass([streaming, record], 'disabled', false);
        }
    };
    Page.OnTV = function() {
        if (!camera) {
            camera = (new ExpertCamJS('#camera-canvas')).buildSelectMenu('#video-select', '#audio-select');
            toggleClass([play], 'disabled', false);
            toggleClass([streaming, record, shoot, stop], 'disabled', true);
            toggleClass([localVideo], 'disabled', false);
            audioSelect.disabled = false;
            videoSelect.disabled = false;
        } else if (camera && !camera.getStream()) {
            toggleClass([play, streaming, record, shoot, stop], 'disabled', true);
            camera.stop(true);
            camera = null;
        } else if (camera && camera.getStream()) {
            audioSelect.disabled = false;
            videoSelect.disabled = false;
            toggleClass([streaming, record, shoot, stop], 'disabled', true);
            camera.stop();
        }
    };
    Page.Play = function() {
        if (videoSelect.selectedIndex === 0 && audioSelect.selectedIndex === 0) {
            return;
        }
        if (!camera.isInitialized()) {
            camera.init(args);
            toggleClass([shoot, stop], 'disabled', false);
        } else {
            camera.play();
            toggleClass([shoot, stop], 'disabled', false);
        }
        audioSelect.disabled = true;
        videoSelect.disabled = true;
    };
    Page.Streaming = function() {
        streamText[txt] = 'Captured stream';
        streamVideo.controls = false;
        if (camera && camera.getStream()) {
            if (streamVideo.src.length === 0) {
                streamVideo.src = URL.createObjectURL(camera.getStream());
            } else {
                streamVideo.src = '';
                streamVideo.removeAttribute('src');
            }
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
            shootImg.setAttribute('src', src);
        }
    };
    Page.LocalVideo = function(e) {
        if (camera) {
            toggleClass([record, streaming], 'disabled', true);
            toggleClass([shoot], 'disabled', false);
            camera.playLocalVideo(e);
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
            if (hasAudio && hasVideo && isFirefox) {
                multiStreamRecorder = new MediaStreamRecorder(stream);
                multiStreamRecorder.mimeType = 'video/webm';
            } else if (hasAudio && hasVideo && isChrome) {
                multiStreamRecorder = new MultiStreamRecorder(stream);
                multiStreamRecorder.video = camera.getVideo();
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
                var data = new FormData();
                if (isChrome && hasAudio && hasVideo) {
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
                        streamText[txt] = 'Recorded stream';
                        streamVideo.controls = true;
                    } else {
                        alert(fileURL);
                    }
                });
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
        document.querySelector('#blur-value')[txt] = 'Blur: ' + el.value.toString() + 'px';
    };
    Page.changeBrightnessCSS = function(el) {
        camera.cssFilter('brightness', el.value);
        document.querySelector('#brightness-value')[txt] = 'Brightness: ' + el.value.toString();
    };
    Page.changeGrayscaleCSS = function(el) {
        camera.cssFilter('grayscale', el.value);
        document.querySelector('#grayscale-value')[txt] = 'Grayscale: ' + el.value.toString();
    };
    Page.changeContrastCSS = function(el) {
        camera.cssFilter('contrast', el.value);
        document.querySelector('#contrast-value')[txt] = 'Contrast: ' + el.value.toString();
    };
    Page.changeInvertCSS = function(el) {
        camera.cssFilter('invert', el.value);
        document.querySelector('#invert-value')[txt] = 'Invert: ' + el.value.toString();
    };
    Page.changeSepiaCSS = function(el) {
        camera.cssFilter('sepia', el.value);
        document.querySelector('#sepia-value')[txt] = 'Sepia: ' + el.value.toString();
    };
    Page.changeHueCSS = function(el) {
        camera.cssFilter('hue-rotate', el.value.toString() + 'deg');
        document.querySelector('#hue-value')[txt] = 'Sepia: ' + el.value.toString() + 'deg';
    };
    Page.changeSaturateCSS = function(el) {
        camera.cssFilter('saturate', el.value);
        document.querySelector('#saturate-value')[txt] = 'Saturate: ' + el.value;
    };

    function countDown(time) {
        var t = time;
        toggleClass([record], 'btn-danger', true);
        record.innerHTML = '<span>&nbsp;' + t / 1E3 + '&nbsp;</span>';
        var count = setInterval(function() {
            t -= 1E3;
            record.innerHTML = '<span>&nbsp;' + t / 1E3 + '&nbsp;</span>';
            if (t === 0) {
                window.scrollTo(0, offset(streamVideo).top);
                clearInterval(count);
                toggleClass([record], 'disabled', false);
                record.innerHTML = '<span class="glyphicon glyphicon-record""></span>';
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
        el.forEach(function(element, index) {
            var list = element.classList;
            if (eval(bol)) {
                list.add(cl);
            } else {
                list.remove(cl);
            }
        });
    }
}).call(window.Page = window.Page || {});