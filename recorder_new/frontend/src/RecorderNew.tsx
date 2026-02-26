import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from "streamlit-component-lib"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactElement,
  useRef
} from "react"
import Box from '@mui/material/Box';

import Slider from '@mui/material/Slider';
import { styled } from '@mui/system';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Grid from '@mui/material/Grid';

import StopIcon from "@mui/icons-material/Stop"
import MicIcon from "@mui/icons-material/Mic"

import { MultiRecorder } from "react-ts-audio-recorder";
import vmsgWasm from "react-ts-audio-recorder/assets/vmsg.wasm?url";
import pcmWorklet from "react-ts-audio-recorder/assets/pcm-worklet.js?url"
/**
 * A template for creating Streamlit components with React
 *
 * This component demonstrates the essential structure and patterns for
 * creating interactive Streamlit components, including:
 * - Accessing props and args sent from Python
 * - Managing component state with React hooks
 * - Communicating back to Streamlit via Streamlit.setComponentValue()
 * - Using the Streamlit theme for styling
 * - Setting frame height for proper rendering
 *
 * @param {ComponentProps} props - The props object passed from Streamlit
 * @param {Object} props.args - Custom arguments passed from the Python side
 * @param {string} props.args.name - Example argument showing how to access Python-defined values
 * @param {boolean} props.disabled - Whether the component is in a disabled state
 * @param {Object} props.theme - Streamlit theme object for consistent styling
 * @returns {ReactElement} The rendered component
 */
function RecorderNew({ args, disabled, theme }: ComponentProps): ReactElement {

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const recorderRef = useRef<MultiRecorder | null>(null)



  async function blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ""
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
  }

  const originalGUMRef = useRef<((c: MediaStreamConstraints) => Promise<MediaStream>) | null>(null)


  const getDefaultSampleRate = () => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()          // ✅ default rate chosen by browser
    const sr = ctx.sampleRate
    ctx.close().catch(() => { })
    return sr
  }

  const handleStart = async () => {
    const originalGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    originalGUMRef.current = originalGUM

      // override to force constraints
      ; (navigator.mediaDevices as any).getUserMedia = (constraints: MediaStreamConstraints) => {
        // ignore what the library asked and use our own audio constraints
        return originalGUM({
          audio: {
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,

            // optional: ask for "rawer" capture where supported
            // @ts-ignore
            googEchoCancellation: false,
            // @ts-ignore
            googNoiseSuppression: false,
            // @ts-ignore
            googAutoGainControl: false,
          } as any,
          video: false,
        })
      }


    const defaultSR = getDefaultSampleRate()
    const recorder = new MultiRecorder({
      format: "wav",
      sampleRate: defaultSR,
      workletURL: pcmWorklet,
    })

    recorderRef.current = recorder
    await recorder.init()
    await recorder.startRecording()
    setRecording(true)
    startTimer()
  }

  const handleStop = async () => {
    if (!recorderRef.current) return

    const blob = await recorderRef.current.stopRecording()
    recorderRef.current.close()
    recorderRef.current = null

    // restore getUserMedia
    if (originalGUMRef.current) {
      ; (navigator.mediaDevices as any).getUserMedia = originalGUMRef.current
      originalGUMRef.current = null
    }

    const url = URL.createObjectURL(blob)
    setAudioURL(url)
    setRecording(false)
    stopTimer()
    setSeconds(0)

    const b64 = await blobToBase64(blob)
    Streamlit.setComponentValue({ mime: blob.type || "audio/wav", wav_base64: b64 })
  }





  // Extract custom arguments passed from Python
  const { name } = args
  const { greetings } = args
  const { options } = args


  // Component state
  const [isFocused, setIsFocused] = useState(false)
  const [numClicks, setNumClicks] = useState(0)

  /**
   * Dynamic styling based on Streamlit theme and component state
   * This demonstrates how to use the Streamlit theme for consistent styling
   */
  const style: React.CSSProperties = useMemo(() => {
    if (!theme) return {}

    // Use the theme object to style the button border
    // Access theme properties like primaryColor, backgroundColor, etc.
    const borderStyling = `1px solid ${isFocused ? theme.primaryColor : "gray"}`
    return { border: borderStyling, outline: borderStyling }
  }, [theme, isFocused])

  /**
   * Tell Streamlit the height of this component
   * This ensures the component fits properly in the Streamlit app
   */
  useEffect(() => {
    // Call this when the component's size might change
    Streamlit.setFrameHeight()
    // Adding the style and theme as dependencies since they might
    // affect the visual size of the component.
  }, [style, theme])

  /**
   * Click handler for the button
   * Demonstrates how to update component state and send data back to Streamlit
   */
  const onClicked = useCallback((): void => {
    const newNumClicks = numClicks + 1
    // Update local state
    setNumClicks(newNumClicks)
    // Send value back to Streamlit (will be available in Python)
    //Streamlit.setComponentValue(newNumClicks)
  }, [numClicks])

  const onClicked_two = useCallback((): void => {
    const newNumClicks = numClicks + 1
    // Update local state
    setNumClicks(newNumClicks)
    // Send value back to Streamlit (will be available in Python)
    //Streamlit.setComponentValue(newNumClicks)
  }, [numClicks])

  /**
   * Focus handler for the button
   * Updates visual state when the button receives focus
   */
  const onFocus = useCallback((): void => {
    setIsFocused(true)
  }, [])

  /**
   * Blur handler for the button
   * Updates visual state when the button loses focus
   */
  const onBlur = useCallback((): void => {
    setIsFocused(false)
  }, [])

  const marks = [
    {
      value: 0,
      label: '0°C',
    },
    {
      value: 20,
      label: '20°C',
    },
    {
      value: 37,
      label: '37°C',
    },
    {
      value: 100,
      label: '100°C',
    },
  ];



  function valuetext(value: number) {
    return `${value}°C`;
  }



  const MySlider = styled(Slider)({
    margin: "50px 100px",



  });

  const MyBox = styled(Box)({
    margin: "100px 200px",


  });

  function createMarks(labels: string[]): any[] {
    return labels.map((label, index) => {
      return { value: index, label }
    })
  }

  const option = ["luca", "franco", "carmelo", "jova", "valerossi"]

  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)

  const startTimer = () => {
    setSeconds(0)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    if (recording && seconds >= 32) {
      handleStop()
    }
  }, [recording, seconds])

  useEffect(() => {
    return () => stopTimer()
  }, [])




  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.2,
        borderRadius: "999px",
        border: `1px solid ${theme?.secondaryBackgroundColor ?? "#e6e9ef"}`,
        background: theme?.backgroundColor ?? "#fff",
        boxShadow: recording ? "0 0 0 3px rgba(255, 75, 75, 0.15)" : "none",
      }}
    >
      <IconButton
        onClick={recording ? handleStop : handleStart}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        sx={{
          width: 46,
          height: 46,
          borderRadius: "999px",
          border: `1px solid ${theme?.primaryColor ?? "#ff4b4b"}`,
          backgroundColor: recording ? (theme?.primaryColor ?? "#ff4b4b") : "transparent",
          "&:hover": {
            backgroundColor: recording ? (theme?.primaryColor ?? "#ff4b4b") : "transparent",
          },
        }}
      >
        {recording ? (
          <StopIcon sx={{ color: "#fff" }} />
        ) : (
          <MicIcon sx={{ color: theme?.primaryColor ?? "#ff4b4b" }} />
        )}
      </IconButton>

      <Box sx={{ minWidth: 180, lineHeight: 1.1 }}>
        <Typography sx={{ fontSize: 12, color: theme?.textColor ?? "#262730" }}>
          {recording ? "Recording…" : "Click to record"}
        </Typography>
        <Typography sx={{ fontSize: 11, opacity: 0.7, color: theme?.textColor ?? "#262730" }}>
          {recording ? "Press stop to finish" : "WAV • mono"}
        </Typography>
      </Box>

      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: "999px",
          border: `1px solid ${theme?.secondaryBackgroundColor ?? "#e6e9ef"}`,
          color: theme?.textColor ?? "#262730",
          fontSize: 12,
          minWidth: 44,
          textAlign: "center",
          opacity: recording ? 1 : 0.6,
        }}
      >
        {seconds}s
      </Box>

     
    </Box>

  )
}

/**
 * withStreamlitConnection is a higher-order component (HOC) that:
 * 1. Establishes communication between this component and Streamlit
 * 2. Passes Streamlit's theme settings to your component
 * 3. Handles passing arguments from Python to your component
 * 4. Handles component re-renders when Python args change
 *
 * You don't need to modify this wrapper unless you need custom connection behavior.
 */
export default withStreamlitConnection(RecorderNew)



/**
 *
 * <Box sx={{ width: 300 }}>
 *         <MySlider
  *          aria-label="Restricted values"
    *        defaultValue={20}
   *         min = {0}
     *       max = {options.length -1 }
      *      //getAriaValueText={valuetext}
       *     step={null}
        *    valueLabelDisplay="off"
            marks={createMarks(options)}
*            onChangeCommitted={(event, value) => {
*            const selectedOption = options[Number(value)]
*            Streamlit.setComponentValue(selectedOption)
*        }}
*        disabled={disabled}
*
*          />
*        </Box>
 *
 *
 * {audioURL && !recording && (
*        <Box sx={{ ml: 1 }}>
 *         <audio src={audioURL} controls />
  *      </Box>
 *     )}
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
//