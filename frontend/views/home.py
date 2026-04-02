import streamlit as st
from services.api import get_cameras, get_users

def render():
    # Define your brand colors from the sidebar
    PRIMARY = "#9E1111"  # Deep red (used for headers/accents)
    ACCENT = "#FF4B4B"   # Bright red (used for icons to pop)

    # Apply colors to the main title using HTML
    st.markdown(f"## <span style='color: {ACCENT};'>:material/dashboard:</span> <span>Dashboard</span>", unsafe_allow_html=True)
    st.divider()

    # -------- USER INFO (Welcome Banner) --------
    users = get_users()
    
    if users:
        user = users[0]   # temporary (replace with auth later)
        st.markdown(f"### <span style='color: {ACCENT};'>:material/person:</span> Welcome, {user.get('username')}", unsafe_allow_html=True)
        st.caption(f"Role: {user.get('role')}")
    else:
        st.warning("User info not available", icon=":material/warning:")

    st.write("") # Vertical spacing

    # -------- SYSTEM OVERVIEW (Card Layout) --------
    st.markdown(f"### <span style='color: {ACCENT};'>:material/bar_chart:</span> System Overview", unsafe_allow_html=True)

    cameras = get_cameras()
    total_cams = len(cameras) if cameras else 0
    active_cams = len([c for c in cameras if c.get("status") == "active"]) if cameras else 0
    inactive_cams = total_cams - active_cams 

    col1, col2, col3 = st.columns(3)

    with col1:
        with st.container(border=True):
            st.metric("Total Cameras", total_cams)

    with col2:
        with st.container(border=True):
            st.metric(":material/check_circle: Active", active_cams)

    with col3:
        with st.container(border=True):
            st.metric(":material/error: Inactive", inactive_cams)

    st.write("") 

   # -------- LIVE FEEDS PREVIEW (Grid Layout) --------
    st.markdown(f"### <span style='color: {ACCENT};'>:material/videocam:</span> Live Feeds", unsafe_allow_html=True)
    
    feed_col1, feed_col2 = st.columns(2)
    
    for i in range(4):
        col = feed_col1 if i % 2 == 0 else feed_col2
        
        with col:
            with st.container(border=True):
                st.markdown(f"**Camera 0{i+1}**")
                
                st.markdown(
                    f"""
                    <div style="background-color: #1e1e1e; height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 5px; color: #666; font-family: sans-serif;">
                        <div style="font-size: 20px; margin-bottom: 5px; color: {ACCENT};">:material/videocam_off:</div>
                        <div style="font-size: 14px; font-weight: 500; letter-spacing: 1px;">NO SIGNAL / AWAITING FEED</div>
                    </div>
                    """, 
                    unsafe_allow_html=True
                )
            
            st.write("") 
    
    st.write("")

    # -------- RECENT ACTIVITY LOG --------
    st.markdown(f"### <span style='color: {ACCENT};'>:material/history:</span> Recent Activity", unsafe_allow_html=True)
    
    with st.container(border=True, height=200):
        st.info("YOLOv5 model weights loaded successfully.", icon=":material/check:")
        st.warning("Tracking algorithm lost feed on Camera 03.", icon=":material/videocam_off:")
        st.info("Admin logged in.", icon=":material/person:")