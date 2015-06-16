<?php
if (isset($_FILES["video-blob"]) && isset($_FILES["audio-blob"])) {
    $video = getcwd() . '/uploads/' . $_POST["video-filename"];
    $audio = getcwd() . '/uploads/' . $_POST["audio-filename"];
    if (move_uploaded_file($_FILES["audio-blob"]["tmp_name"], $audio) && move_uploaded_file($_FILES["video-blob"]["tmp_name"], $video)) {
        
        $mergedFile = getcwd() . '/uploads/' . $_POST["video-filename"] . '-merged.webm';
        @unlink($mergedFile);
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $cmd = '-i ' . $audio . ' -i ' . $video . ' -map 0:0 -map 1:0 ' . $mergedFile;
        } 
        else {
            $cmd = ' -i ' . $audio . ' -i ' . $video . ' -c:v mpeg4 -c:a vorbis -b:v 64k -b:a 12k -strict experimental ' . $mergedFile;
        }
        
        exec('ffmpeg ' . $cmd . ' 2>&1', $out, $ret);
        if ($ret) {
            echo path2url($video);
        } 
        else {
            echo path2url($mergedFile);
            @unlink($video);
            @unlink($audio);
        }
    } 
    else {
        echo ("Problem writing video file to disk!");
    }
} 
else if (isset($_FILES["audio-blob"])) {
    $audio = getcwd() . '/uploads/' . $_POST["audio-filename"];
    if (move_uploaded_file($_FILES["audio-blob"]["tmp_name"], $audio)) {
        echo path2url($audio);
    } 
    else {
        echo ("Problem writing video file to disk!");
    }
} 
else if (isset($_FILES["video-blob"])) {
    $video = getcwd() . '/uploads/' . $_POST["video-filename"];
    if (move_uploaded_file($_FILES["video-blob"]["tmp_name"], $video)) {
        echo path2url($video);
    } 
    else {
        echo ("Problem writing video file to disk!");
    }
}
function path2url($file, $Protocol = 'http://') {
    $path = str_replace("\\", '/', $_SERVER['DOCUMENT_ROOT']);
    $file = str_replace("\\", '/', $file);
    return $Protocol . $_SERVER['HTTP_HOST'] . '/' . str_replace($path, '', $file);
}
?>