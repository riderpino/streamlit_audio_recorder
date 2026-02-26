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




def recorder_new( options, name = "Streamlit", key = None): 
    return _recorder_new(options =options, name=name, default=None, key = key)

ai = ["luca", "franco", "carmesslo", "jova", "valerossi"]

return_value = recorder_new( options=ai,name="lorenzo")

if isinstance(return_value, dict) and "wav_base64" in return_value:
    wav_bytes = base64.b64decode(return_value["wav_base64"])
    st.audio(wav_bytes, format="audio/wav")   
    with open("recording.wav", "wb") as f:
        f.write(wav_bytes)
        st.success("Saved recording.wav")


else:
    st.write("selected value is: null")




#everything can recieve the same parameter but you must change the key





#_recorder_new(key="luca")
