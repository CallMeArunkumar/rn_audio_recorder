package com.rn_audio_recorder

import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.media.MediaMuxer
import android.media.MediaFormat
import android.media.MediaCodec
import com.facebook.react.bridge.*
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.nio.ByteBuffer

class AudioRecorderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        var reactContextStatic: ReactApplicationContext? = null
    }

    init {
        reactContextStatic = reactContext
    }

    override fun getName() = "AudioRecorder"

    @ReactMethod
    fun addListener(eventName: String) {} // required stub

    @ReactMethod
    fun removeListeners(count: Int) {} // required stub

    private fun startServiceWithAction(action: String, path: String? = null) {
        val intent = Intent(reactContext, AudioRecordService::class.java)
        intent.action = action
        path?.let { intent.putExtra("path", it) }
        reactContext.startService(intent)
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        val name = "rec_${System.currentTimeMillis()}.aac"
        val path = reactContext.cacheDir.absolutePath + "/" + name
        startServiceWithAction("START", path)
        promise.resolve(path)
    }

    @ReactMethod
    fun pauseRecording(promise: Promise) {
        startServiceWithAction("PAUSE")
        promise.resolve("paused")
    }

    @ReactMethod
    fun resumeRecording(promise: Promise) {
        startServiceWithAction("RESUME")
        promise.resolve("resumed")
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        startServiceWithAction("STOP")
        promise.resolve("stopped")
    }

    @ReactMethod
    fun trimRecording(filePath: String, startSec: Double, endSec: Double, promise: Promise) {
    try {
        val outputFile = File(reactContext.cacheDir, "trimmed_${System.currentTimeMillis()}.aac")

        val inputPath = filePath
        val startMs = (startSec * 1000).toLong()
        val durationMs = ((endSec - startSec) * 1000).toLong()

        // Use MediaExtractor + MediaMuxer for trimming AAC/MP4
        val extractor = android.media.MediaExtractor()
        extractor.setDataSource(inputPath)
        val muxer = android.media.MediaMuxer(outputFile.absolutePath, android.media.MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

        val trackIndex = 0
        var format = extractor.getTrackFormat(trackIndex)
        muxer.addTrack(format)
        muxer.start()

        extractor.selectTrack(trackIndex)
        extractor.seekTo(startMs * 1000, android.media.MediaExtractor.SEEK_TO_CLOSEST_SYNC)

        val maxBufferSize = 1024 * 1024
        val buffer = ByteBuffer.allocate(maxBufferSize)
        val bufferInfo = android.media.MediaCodec.BufferInfo()

        var sampleTime = 0L
        while (true) {
            bufferInfo.offset = 0
            bufferInfo.size = extractor.readSampleData(buffer, 0)
            if (bufferInfo.size < 0) break

            sampleTime = extractor.sampleTime
            if (sampleTime > endSec * 1_000_000) break

            bufferInfo.presentationTimeUs = sampleTime - startMs * 1000
            bufferInfo.flags = extractor.sampleFlags
            muxer.writeSampleData(0, buffer, bufferInfo)
            extractor.advance()
        }

        muxer.stop()
        muxer.release()
        extractor.release()

        promise.resolve(outputFile.absolutePath)
    } catch (e: Exception) {
        promise.reject("TRIM_ERROR", e.message)
    }
    }
    @ReactMethod
    fun shareFile(filePath: String, mimeType: String, promise: Promise) {
    try {
        val intent = Intent(Intent.ACTION_SEND)
        val file = File(filePath)
        val uri = FileProvider.getUriForFile(
            reactApplicationContext,
            reactApplicationContext.packageName + ".provider",
            file
        )
        intent.type = mimeType
        intent.putExtra(Intent.EXTRA_STREAM, uri)
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        val chooser = Intent.createChooser(intent, "Share Recording")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(chooser)
        promise.resolve("Shared")
    } catch (e: Exception) {
        promise.reject("SHARE_ERROR", e)
    }
    }

}
