import os
import streamlit.components.v1 as components
import streamlit as st
import base64

_RELEASE = True

if _RELEASE:
    root_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(root_dir, "frontend/build")

    _recorder_new = components.declare_component(
        "recorder_new",
        path=build_dir
    )
else:
        _recorder_new = components.declare_component(
        "recorder_new", 
        url = "http://localhost:3001/"
    )



def recorder_new( text_on_the_component = "Press to start the recording",max_recording_time = 32, press_to_finish = "press to finish", key = None): 
    return _recorder_new(text_on_the_component = text_on_the_component, max_recording_time = max_recording_time, press_to_finish = press_to_finish, key = key)



if not _RELEASE:

    options= "test name"
    return_value = recorder_new()

    if isinstance(return_value, dict) and "wav_base64" in return_value:
        wav_bytes = base64.b64decode(return_value["wav_base64"])
        with open("audio_recording_not_release.wav", "wb") as f:
            f.write(wav_bytes)
            st.success("audio_recording_not_release.wav")
    
     #st.audio(wav_bytes, format="audio/wav")   
    





#everything can recieve the same parameter but you must change the key





#_recorder_new(key="luca")
