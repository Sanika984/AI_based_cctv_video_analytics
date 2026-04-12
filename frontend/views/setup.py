import streamlit as st

def render():
    # Brand colors
    PRIMARY = "#9E1111"  
    ACCENT = "#FF4B4B"   

    # Page Header
    st.markdown(f"## <span style='color: {ACCENT};'>:material/settings:</span> <span>Camera Setup</span>", unsafe_allow_html=True)
    st.divider()


    # -------- CONFIGURED CAMERAS LIST --------
    st.markdown(f"### <span style='color: {ACCENT};'>:material/list:</span> Configured Cameras", unsafe_allow_html=True)

    mock_db_cameras = [
        {
            "camera_id": "CAM-1024",
            "name": "Front Desk",
            "location": "Lobby",
            "source": "rtsp://admin:pass@192.168.1.101:554/stream1",
            "status": "active",
            "floor": 1,
            "description": "Wide angle shot covering the reception and waiting area.",
            "modules": ["Consumer Analytics", "Security"],
            "features": ["Footfall Counting", "Face Detection"]
        },
        {
            "camera_id": "CAM-1025",
            "name": "Loading Dock A",
            "location": "Rear Exit",
            "source": "rtsp://admin:pass@192.168.1.102:554/stream2",
            "status": "maintenance",
            "floor": 0,
            "description": "Monitors incoming deliveries.",
            "modules": ["Vehicle Tracking"],
            "features": ["ANPR"]
        }
    ]

    if not mock_db_cameras:
        st.info("No cameras configured yet. Use the form above to add one.", icon=":material/info:")

    # Generate a card for each camera
    for cam in mock_db_cameras:
        # 1. Create a unique state variable for each camera to track if its dropdown is open
        state_key = f"expand_{cam['camera_id']}"
        if state_key not in st.session_state:
            st.session_state[state_key] = False

        with st.container(border=True):
            
            # --- CUSTOM COMPACT HEADER ROW ---
            # Using vertical_alignment="center" ensures the text, status, and button align perfectly
            col_info, col_status, col_btn = st.columns([7, 2, 1], vertical_alignment="center")
            
            with col_info:
                st.markdown(f"#### :material/videocam: {cam['name']} `[{cam['camera_id']}]`")
                st.markdown(f"<div style='color: #888; font-size: 14px; margin-top: -10px; margin-bottom: 5px;'><b>Location:</b> {cam['location']} (Floor {cam['floor']})</div>", unsafe_allow_html=True)
            
            with col_status:
                status_color = "#4CAF50" if cam['status'] == "active" else "#FF9800" if cam['status'] == "maintenance" else "#F44336"
                st.markdown(f"<div style='text-align: right; color: {status_color}; font-weight: 600;'>{cam['status'].upper()}</div>", unsafe_allow_html=True)

            with col_btn:
                # The arrow switches direction based on the session state
                icon = ":material/keyboard_arrow_up:" if st.session_state[state_key] else ":material/keyboard_arrow_down:"
                
                # Using a zero-width space ("\u200B") as the label to render an icon-only button
                if st.button("\u200B", icon=icon, key=f"btn_{cam['camera_id']}", use_container_width=True):
                    st.session_state[state_key] = not st.session_state[state_key]
                    st.rerun()

            # --- HIDDEN DETAILS (Triggered by the button) ---
            if st.session_state[state_key]:
                st.divider()
                
                # Technical info
                st.markdown(f"**Source:** <code>{cam['source']}</code>", unsafe_allow_html=True)
                st.markdown(f"**Description:** {cam['description']}")
                
                # Relational Data
                st.markdown(f"**Modules:** {', '.join(cam['modules']) if cam['modules'] else 'None'}")
                st.markdown(f"**Features:** {', '.join(cam['features']) if cam['features'] else 'None'}")
                
                st.write("")

                # Action Buttons
                act1, act2, _ = st.columns([1, 1, 6])
                with act1:
                    if st.button("Edit", icon=":material/edit:", key=f"edit_{cam['camera_id']}", use_container_width=True):
                        pass # Trigger edit logic
                with act2:
                    if st.button("Delete", icon=":material/delete:", key=f"del_{cam['camera_id']}", use_container_width=True):
                        pass # Trigger delete logic
                    
# -------- ADD NEW CAMERA SECTION --------
    # Left this as an expander since the text "Add New Camera" is helpful here
    with st.expander(":material/add_circle: Add New Camera"):
        with st.form("add_camera_form", clear_on_submit=True):
            
            st.markdown("#### Basic Information")
            col1, col2 = st.columns(2)
            name = col1.text_input("Camera Name*", placeholder="e.g., Main Entrance")
            location = col2.text_input("Location*", placeholder="e.g., North Gate")
            
            col3, col4 = st.columns([3, 1])
            source = col3.text_input("Video Source (RTSP / HTTP)*", placeholder="rtsp://...")
            status = col4.selectbox("Initial Status", ["active", "inactive", "maintenance"])

            st.markdown("#### Metadata")
            meta1, meta2 = st.columns([1, 3])
            floor = meta1.number_input("Floor Level", value=0, step=1)
            description = meta2.text_input("Description", placeholder="Brief details about placement or purpose")

            st.markdown("#### Modules & Features")
            mod1, mod2 = st.columns(2)
            modules = mod1.multiselect("Active Modules", ["Consumer Analytics", "Security", "Vehicle Tracking", "Operations"])
            features = mod2.multiselect("Enabled Features", ["Face Detection", "Footfall Counting", "ANPR", "Crowd Density"])

            st.write("") 
            submitted = st.form_submit_button("Save Camera configuration", type="primary", icon=":material/save:")
            
            if submitted:
                if name and location and source:
                    st.success(f"Camera '{name}' successfully added to the database.", icon=":material/check_circle:")
                else:
                    st.error("Please fill in all required fields (marked with *).", icon=":material/error:")
