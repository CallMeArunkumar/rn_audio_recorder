package com.rn_audio_recorder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.io.IOException

class AudioRecordService : Service() {

    private var recorder: MediaRecorder? = null
    private var filePath: String? = null
    private var isPaused = false
    private var startTime: Long = 0
    private val handler = Handler(Looper.getMainLooper())
    private val updateInterval: Long = 500

    private val progressRunnable = object : Runnable {
        override fun run() {
            val elapsed = ((System.currentTimeMillis() - startTime) / 1000).toInt()
            sendProgress(elapsed)
            handler.postDelayed(this, updateInterval)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.action?.let {
            when (it) {
                "START" -> {
                    filePath = intent.getStringExtra("path")
                    startForegroundServiceCompat()
                    startRecording()
                }
                "PAUSE" -> pauseRecording()
                "RESUME" -> resumeRecording()
                "STOP" -> stopRecording()
            }
        }
        return START_STICKY
    }

    private fun startForegroundServiceCompat() {
        val channelId = "audio_channel"
        val channelName = "Audio Recorder"
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_LOW)
            nm.createNotificationChannel(chan)
        }
        val notif = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Recording...")
            .setContentText("Audio recording in progress")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .build()
        startForeground(1, notif)
    }

    private fun startRecording() {
        val path = filePath ?: return
        recorder = MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(path)
            try {
                prepare()
                start()
                isPaused = false
                startTime = System.currentTimeMillis()
                handler.post(progressRunnable)
                sendEvent("onRecordingStarted")
            } catch (e: IOException) {
                e.printStackTrace()
                stopSelf()
            }
        }
    }

    private fun pauseRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && !isPaused) {
            recorder?.pause()
            isPaused = true
            handler.removeCallbacks(progressRunnable)
            sendEvent("onRecordingPaused")
        }
    }

    private fun resumeRecording() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isPaused) {
            recorder?.resume()
            isPaused = false
            startTime = System.currentTimeMillis() - ((System.currentTimeMillis() - startTime))
            handler.post(progressRunnable)
            sendEvent("onRecordingResumed")
        }
    }

    private fun stopRecording() {
        try {
            recorder?.stop()
            recorder?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        recorder = null
        handler.removeCallbacks(progressRunnable)
        sendStopped()
        stopForeground(true)
        stopSelf()
    }

    private fun sendProgress(elapsed: Int) {
        val map: WritableMap = Arguments.createMap()
        map.putInt("elapsed", elapsed)
        map.putString("filePath", filePath)
        AudioRecorderModule.reactContextStatic
            ?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onRecordingProgress", map)
    }

    private fun sendStopped() {
        val map: WritableMap = Arguments.createMap()
        map.putString("filePath", filePath)
        AudioRecorderModule.reactContextStatic
            ?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("onRecordingStopped", map)
    }

    private fun sendEvent(event: String) {
        val map: WritableMap = Arguments.createMap()
        map.putString("filePath", filePath)
        AudioRecorderModule.reactContextStatic
            ?.getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(event, map)
    }
}
