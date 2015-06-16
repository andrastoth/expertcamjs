ExpertCamJS 
=============

javascript Camera handler with some options.

    - Capture video, audio
    - Open local video or audio file with subtitle
    - Forward captured stream to another object
    - Grab image from player
    - Record captured stream to webm or ogg

* [ExpertCamJS] - Online Demo 

<img src = "demo.png"/>

Version
----

1.2.0

    - Open local video or audio file with subtitle
      using multiselect
    - some minor modification  

Version
----

1.0.0

    - Capture video, audio
    - Open local video and audio files
    - Forward captured stream to another object
    - Grab image from player
    - Record captured stream to webm or ogg

Included recorder
-----------

Stream recorder ([MediaStreamRecorder])
 

Required HTML & Javascript example
--------------

```sh
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>ExpertCamJS</title>
    </head>
    <body>
        <hr>
        <h1 style="text-align:center;">Examples</h1>
     	<hr>
        <h4>Video:</h4>
        <select id="video"></select>
        <hr>
        <h4>Audio:</h4>
        <select id="audio"></select>
        <hr>
        <video></video>
        <hr>
        <button type="button" onclick="play()">play</button>
        <button type="button" onclick="pause()">pause</button>
        <button type="button" onclick="stop()">stop</button>
        <button type="button" onclick="openVideo()">Open</button>
        <hr>
        <script type="text/javascript" src="js/expertcam.js"></script>
        <script type="text/javascript">
        /*------------------------------------- Available parameters ------------------------------------*/

        var defaults = {
            width: 320,                                                 // video width
            height: 240,                                                // video height
            constraints: {
                video: {
                    mandatory: {
                        maxWidth: 1280,                                 // max Videosource resolution width
                        maxHeight: 720                                  // max Videosource resolution height
                    },
                    optional: [{
                        sourceId: true                                  // videosource id video enabled
                    }]
                },
                audio: true                                             // audio enabled
            },
            noSignal: 'media/no_signal.png',                            // nosignal image source
            videoTypes: 'video/mp4|video/webm|video/avi',               // audio types
            audioTypes: 'audio/wav|audio/mp3|audio/ogg|audio/mp3',      // video types
            subTitleTypes: 'srt',                                       // subtitle filetypes
            subTitleCoding: 'utf-8',                                    // subtitle encoding
            cameraSuccess: function(stream) {                           // init when cameraSucess function is done
                console.log('cameraSuccess');   
            },
            canPlayFunction: function() {                               // init when canPlayFunction is done
                console.log('canPlayFunction');
            },
            mediaStreamTrackError: function() {                         // init when MediaStreamTrack is not supported
                alert('Sorry, the browser you are using does not support MediaStreamTrack');
            },
            getUserMediaError: function() {                             // init when getUserMediaError detected
                console.log('getUserMediaError');
            },
            cameraError: function(error) {                              // init when cameraError detected
                console.log(error);
            }
        };
        /*---------------------------- Initialization: please check out examples --------------------------*/
        /*-------------------------- Simple initialization with default parameters ------------------------*/
         new ExpertCamJS('video').init().play();
        /*------------------------- Simple initialization with build select menu -------------------------*/
        var cam = new ExpertCamJS('video').buildSelectMenu('#video', '#audio').init(args);
        function play(){
            cam.play();
        }
        function pause(){
            cam.pause();
        }
        function stop(){
            cam.stop();
        }
        /*-------------------------- Simple initialization with play local video --------------------------*/
        var args = {
            width: '100%',
            height: '100%',
            constraints: {
                video: false,
                audio: false
                }
            };
            var cam = new ExpertCamJS('video').init(args);
            function openVideo(){
                cam.playLocalVideo();
            }
            function goFullScreen(){
                if(cam){
                    cam.toggleFullScreen();
                }
            }
        /*-------------------------------------- Available funtions --------------------------------------*/
        cam.buildSelectMenu(selectorVideo, selectorAudio);  // build select menu, return ExpertCamJS object
        cam.pause();                                        // pause video, return ExpertCamJS object
        cam.stop(boolean);                                  // stop video, boolean is true set video poster options.nosignal 
        cam.play();                                         // play stream, return ExpertCamJS object
        cam.getLastImageSrc();                              // grab image from video, return dataURL
        cam.isInitialized();                                // return true Or false
        cam.getStream();                                    // return Stream
        cam.getVideo();                                     // return Video URL
        cam.cssFilter(type, val);                           // CSS3 filters example 'blur', '2px'
        cam.playLocalVideo();                               // open localvideo browser window
        cam.toggleFullScreen();                             // video toggle Full Screen
        cam.options                                         // return options get, set
        cam.version                                         // return version information
        /*        for record and upload, merge video please check out the complex demo page source       */
        </script>
    </body>
</html>

```

License
----

MIT

Author: Tóth András
---
http://atandrastoth.co.uk/

2015-06-13

[ExpertCamJS]:http://atandrastoth.co.uk/main/pages/plugins/expertcam
[MediaStreamRecorder]:https://github.com/streamproc/MediaStreamRecorder